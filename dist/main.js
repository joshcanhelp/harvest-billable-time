/* globals console, alert, require, axios, Cookies */

/**
 * Main App for the page
 * Uses Kyle Simpson's OLOO (as a model)
 *
 * @see http://stackoverflow.com/a/30468602/728480
 */

var App = {

	// Is local storage allowed?

	canStoreLocal : false,

	// Date properties for today

	yearNow : '',
	monthNow : '',
	dayNow : '',
	harvestToday : '',

	/**
	 * Startup, needs to be called explicitly after Object.create()
	 */

	init : function () {
		'use strict';

		// Can we use local storage?

		this.canStoreLocal = Storage.canLocalStore();

		// Get the current state of the app

		var theHash = window.location.hash.replace( '#', '' );
		if ( theHash === 'week' ) {
			this.changeState( 'week' );
		} else if ( ! theHash.length || theHash === 'day' ) {
			this.changeState( 'day' );
		}

		// Get the current day data
		this.harvestToday = Format.date();

		//
		// Attach interaction events
		//

		// Change tabs

    document
      .querySelectorAll( '.app__nav__link' )
      .forEach( function ( el ) {
        el.addEventListener( 'click', function (e) {
          e.preventDefault();

          var state = this.getAttribute( 'href' ).replace('#', '');
          App.changeState( state );
        } );
      } );

    // Update stored total time

		document
		  .getElementById('appTotalTimeForm')
		  .addEventListener( 'submit', function (e) {
		    e.preventDefault();

        var todayJson = Storage.getDay( App.harvestToday );
        var totalTimeVal = document.getElementById( 'appTotalTime' ).value;

        // Can't have a total time less than what was tracked for the day
        var minimumTime = todayJson.moneyTime + todayJson.usedTime;

        if ( ! totalTimeVal || totalTimeVal < minimumTime) {

          // Not a number, empty, or less than the minimum
          document.getElementById( 'appTotalTime' ).value = minimumTime;

          // An empty stored total time tells status update to use total tracked
          todayJson.totalTime = 0;
        } else {
          todayJson.totalTime = parseFloat( totalTimeVal );
        }

        Storage.setDay( App.harvestToday, todayJson );

        View.updateStatusBar( todayJson, 'day' );
      });

    //
    // Harvest startup
    //

    Harvest.init();
    Harvest.getDaily( Harvest.getWeek );

	},

	/**
	 * Change the app state, including nav, window showing, and hash
	 *
	 * @param state
	 */

	changeState : function ( state ) {
		'use strict';

		var navLink, appScreen;

		// Make everything inactive for now

		document.querySelectorAll( '.is-active' )
			.forEach( function ( el ) {
				el.classList.remove( 'is-active' );
			} );

		// Determine an acceptable state

		switch ( state ) {

			case 'day':
				navLink = document.getElementById( 'appNavDay' );
				appScreen = document.getElementById( 'day' );
				break;

			case 'week':
				navLink = document.getElementById( 'appNavWeek' );
				appScreen = document.getElementById( 'week' );
				break;

		}

		if ( navLink && appScreen ) {
			navLink.classList.add( 'is-active' );
			appScreen.classList.add( 'is-active' );

			window.location.hash = state;
		}
	},

  /**
   * Get the various parameters from a URL piece, hash or query
   *
   * @param params
   *
   * @returns {{}}
   */

	parseParams : function ( params ) {
    'use strict';

    // Nothing to parse

    if ( params.indexOf( '&' ) < 0 ) {
      return {};
    }

    var pieces = {};

    // Normalize param string in case it was passed in with prepended char

    params = params.replace( '?', '' );
    params = params.replace( '#', '' );

    params.split( '&' ).forEach(function ( el ) {
        pieces[el.split('=')[0]] = el.split( '=' )[1];
    });

    return pieces;
	},

  /**
   * Get the day of the week name from a JS day number
   *
   * @param jsDay
   *
   * @returns {string|int}
   */

	convertJsDay : function ( jsDay ) {
	  'use strict';

    var dotw = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if ( typeof jsDay === 'string' ) {

      // If it's a string, assume we want to convert from English day to JS day
      return dotw.indexOf( jsDay );
    } else {

      // If it's anything else, assume int and we want to convert JS day to English day
      return dotw[jsDay];
    }
	}
};

/**
 * Harvest API API
 *
 * @type {{authKey: string, clientId: string, baseUrl: string, authPath: string, init: Harvest.init, get: Harvest.get}}
 */

var Harvest = {

  // Projects, we get this back with the daily call
  currProjects : {},

	// Cookie names
	accessTokenCookie    : 'harvestAccessToken',
	accessTokenCookieExp : 'harvestAccessTokenExp',

	// URL param names
	accessTokenParam    : 'access_token',
	accessTokenExpParam : 'expires_in',

	// API: base URL
	baseUrl : 'https://joshcanhelp.harvestapp.com',

	// API Path: OAuth
	// Needs client_id and redirect_uri params
	authPath : '/oauth2/authorize',

	// API Path: refresh token
	// Need client_id (above) and refresh_token (expired token) params
	refreshPath : '/oauth2/token',

	// API Path: check account details
	checkPath : '/account/who_am_i',

	// API Path: get daily time sheet
	// Need to replace the token in there with a valid user ID
	entriesPath : '/people/{USER_ID}/entries',

	// API Path: daily entries
	dailyPath : '/daily',

	/**
	 * Startup, needs to be called explicitly after Object.create()
	 */

	init : function () {
		'use strict';

		this.accessToken = Cookies.get( this.accessTokenCookie );

    // Setup a Harvest-specific Axios config
    this.hAxios = axios.create( { baseURL : this.baseUrl } );
    this.hAxios.defaults.method = 'get';
    this.hAxios.defaults.headers.common['Content-Type'] = 'application/json';
    this.hAxios.defaults.headers.common.Accept = 'application/json';

    this.runAuth();
    this.getCompany();
	},

  /**
   * OAuth process
   */

	runAuth : function () {
    'use strict';

    if ( this.accessToken && (Date.now() / 1000) < Cookies.get( this.accessTokenCookieExp ) ) {

      // We have an auth token in our cookies, not expired
      View.msg( 'Auth cookie found', true );

    } else {

      View.msg( 'No cookie, looking for hash', true );

      // We don't have a cookie so we need to figure out what the next step is
      var haveTokenIndex = window.location.hash.indexOf( this.accessTokenParam + '=' );

      if ( haveTokenIndex > -1 ) {

        //
        // STATE: We were redirected from Harvest, grab access token, expires, and refresh token
        //

        View.msg( 'Have a URL access token', true );

        var oauthParams = App.parseParams( window.location.hash );

        // Set and store access token

        this.accessToken = oauthParams.access_token;
        Cookies.set( this.accessTokenCookie, this.accessToken );

        // Set and store token expiration

        var expiresIn = parseInt( oauthParams.expires_in, 10 );
        expiresIn = expiresIn + Math.round( Date.now() / 1000 );
        Cookies.set( this.accessTokenCookieExp, expiresIn);

        // Set default state to get rid of Oauth in the URL

        App.changeState( 'day' );

        // Set auth header - NOT WORKING
        // this.hAxios.defaults.headers.common.Authorization = 'Bearer ' + this.accessToken;

      } else {

        //
        // STATE: No token and no oAuth params so we need to authenticate
        //

        View.msg( 'Approval required', false );
        View.msg( View.harvestAuthForm( Harvest.baseUrl + Harvest.authPath ), false );
      }
    }
	},

  /**
   * Get and store company data
   */

	getCompany : function () {
    'use strict';

    if ( !this.accessToken ) {
      View.msg( 'Cannot getCompany without an access token', false );
      return;
    }

    // Grab company information to test out the token
    this.hAxios( {
        url    : this.checkPath,
        params : {
          access_token : this.accessToken
        }
      } )

      // Success!
      .then( function ( response ) {

        // Store things we might need
        Storage.set( 'harvestCompanyName', response.data.company.name );
        Storage.set( 'harvestUserId', response.data.user.id );
        Storage.set( 'harvestCompanyWeekStart', response.data.company.week_start_day );

        // Proof of connection
        View.msg( [
          View.make( 'img', { src : response.data.user.avatar_url, width : 120 } ),
          View.make( 'p', {}, [ View.make( 'strong', {}, 'Company: ' ), response.data.company.name ] ),
          View.make( 'p', {}, [ View.make( 'strong', {}, 'User: ' ), response.data.user.first_name ] ),
          View.make( 'p', {}, [ View.make( 'strong', {}, 'User ID: ' ), response.data.user.id ] )
        ], true );

      } )

      // Absolute failure!
      .catch( function ( error ) {
        View.axiosErr( error );
      } );

	},

  /**
   * Get daily entries for the Today display
   *
   * @param callback
   */

  getDaily : function ( callback ) {
		'use strict';

		if ( !this.accessToken ) {
			View.msg( 'Cannot getDaily without an access token!', false );
			return;
		}

		this.hAxios( {
				url    : this.dailyPath,
				params : {
					access_token : this.accessToken
				}
			} )

      // Success!
			.then( function ( response ) {

        console.log( 'Response from getDaily()' );
				console.log( response.data );
				View.msg( 'Showing ' + response.data.for_day, true );

				// Get the current day data to replace
				var currentDay = Storage.getDay( response.data.for_day );
				var newDay = {
				  totalTime : currentDay.totalTime > 0 ? currentDay.totalTime : 0,
				  entries : []
				};

				// Project data is provided separately
        // Just need whether the project is billable or not
        response.data.projects.forEach(function (el) {

					Harvest.currProjects[el.id] = {
					  isBillable : el.billable,
					  clientName : el.client,
					  projectName : el.name
					};
				});

				var totalTime = 0;
        var totalMoney = 0;
        var totalUsed = 0;

        View.msg( 'Showing ' + response.data.day_entries.length + ' entries', true );

        // Run through all the entries and add them to the list while calculating the total
				response.data.day_entries.forEach(function (el) {

				  var storeEntry = Harvest.prepareEntry( el );
					var entryClass = '';

					if ( storeEntry.billable ) {

            // Count up billed time
						entryClass = 'app__entry--money';
						totalMoney = totalMoney + storeEntry.hours;
					} else {

            // Count up unbilled time
            entryClass = 'app__entry--used';
            totalUsed = totalUsed + storeEntry.hours;
					}

          // Count up total billed and unbilled time
					totalTime = totalTime + storeEntry.hours;

          // Create the element and append to the list
          View.addTimeEntry( entryClass, storeEntry.label + ': ' + storeEntry.hours );

          newDay.entries.push( storeEntry );

				});

        newDay.moneyTime = totalMoney;
        newDay.usedTime = totalUsed;

        // If we have a total time entered, use that
        if ( newDay.totalTime > 0 ) {
          totalTime = newDay.totalTime;
        }

				document.getElementById('appTotalTime').value = totalTime;

				// Update stored day
        Storage.setDay( response.data.for_day, newDay );

        View.updateStatusBar( newDay, 'day' );

        callback();

			} )

      // Utter failure!
      .catch( function ( error ) {
        View.axiosErr( error );
      } );
	},

  /**
   * Get Harvest entries for a specific week
   *
   * @param offset - if empty, this week; if not, integer to mean how many counting back
   */

  getWeek : function ( offset ) {
    'use strict';

    if ( !Harvest.accessToken ) {
      View.msg( 'Cannot getEntries without an access token', false );
      return;
    }

    var dateTo, dateFrom;
    var weekStartJs = App.convertJsDay( Storage.get( 'harvestCompanyWeekStart' ) );

    offset = parseInt( offset, 10 );

    if ( !offset ) {

      //
      // No offset so get the current week
      //

      // End date is today

      dateTo = App.harvestToday;

      // Now figure out where to start

      var thisDate = new Date();
      var thisDay = thisDate.getDay();

      if ( thisDay === weekStartJs ) {
        dateFrom = dateTo;
      } else {

        var dayDiff = DateUtil.dayDiff( thisDay, weekStartJs );

        dateFrom = Format.date( new Date( Date.now() - DateUtil.daysToSeconds( dayDiff ) ) );
      }

    } else {

      //
      // There was an offset so get that week
      //

      console.log( 'Get offset week' );

    }

    // console.log( dateFrom );
    // console.log( dateTo );

    Harvest.hAxios( {
        url    : Harvest.entriesPath.replace('{USER_ID}', Storage.get('harvestUserId')),
        params : {
          access_token : Harvest.accessToken,
          from : dateFrom,
          to : dateTo
        }
      } )

      // Success!
      .then( function ( response ) {

        console.log( 'Response from getWeek()' );
        console.log( response );

        var thisWeek = {
          moneyTime : 0,
          usedTime : 0,
          totalTime : 0,
          totalEntries : 0,
          dates: []
        };

        response.data.forEach(function (el) {

          // Date of time entry
          var currDate = el.day_entry.spent_at;

          // Get day from local
          var thisDayLocal = Storage.getDay( currDate );

          // Prepare the time entry
          var addEntry = Harvest.prepareEntry( el.day_entry );

          // Have we already seen this day?
          if ( thisWeek.dates.indexOf( currDate ) > -1 ) {

            // Have already cleared out the entries
            // Need to add this new entry
            thisDayLocal.entries.push( addEntry );

          } else {

            // Mark this date as updated
            thisWeek.dates.push( currDate );

            // Clear out entries and add this new one
            thisDayLocal.entries =[ addEntry ];

            // Clear out time totals
            thisDayLocal.usedTime = 0;
            thisDayLocal.moneyTime = 0;
          }

          // Calculate time totals
          if ( addEntry.billable ) {
            thisDayLocal.moneyTime += addEntry.hours;
            thisWeek.moneyTime += addEntry.hours;
          } else {
            thisDayLocal.usedTime += addEntry.hours;
            thisWeek.usedTime += addEntry.hours;
          }

          // Re-store our new local day
          Storage.setDay( currDate, thisDayLocal );
        });

        // Set total time
        thisWeek.dates.forEach(function (el) {
          var thisDayTotal = Storage.getDay( el );

          thisWeek.totalTime += thisDayTotal.totalTime ?
            thisDayTotal.totalTime :
            thisDayTotal.moneyTime + thisDayTotal.usedTime;
        });

        View.addWeek( thisWeek );
      })

      // Catastrophic failure!
      .catch( function ( error ) {
        View.axiosErr( error );
      } );
  },

  /**
   * Prepare a single time entry for storing
   * Will work with daily entry format or weekly report, normalizing to a specific format
   *
   * @param entry
   * @returns {{id: Number, pid: Number, billable: *, label: string, notes: (*|string|Array), hours: *}}
   */

  prepareEntry : function ( entry ) {
    'use strict';

    var projectId = parseInt( entry.project_id, 10 );

    return {
      id       : parseInt( entry.id, 10 ),
      pid      : projectId,
      billable : Harvest.currProjects[projectId].isBillable,
      label    : Harvest.currProjects[projectId].clientName + ' - ' + Harvest.currProjects[projectId].projectName,
      notes    : entry.notes,
      hours    : entry.hours_with_timer ? entry.hours_with_timer : entry.hours
    };
  }
};

var DateUtil = {

  /**
   * Get the difference in days between days of the week
   *
   * @param today
   * @param weekStart
   *
   * @returns {number}
   */

  dayDiff : function ( today, weekStart ) {
    'use strict';

  	return [0, 1, 2, 3, 4, 5, 6].slice( today - weekStart )[0];
  },

  /**
   * Get a time duration in seconds from days
   *
   * @param days
   *
   * @returns {number}
   */

  daysToSeconds : function ( days ) {
    'use strict';

  	return days * 24 * 60 * 60 * 1000;
  },

  /**
   * Format a date for Harvest
   *
   * @param dateObj
   *
   * @returns {string}
   */

  formatDate : function ( dateObj ) {
    'use strict';

    if ( !dateObj ) {
      dateObj = new Date();
    }

    return dateObj.getFullYear() +
      '-' +
      String( '0' + (dateObj.getMonth() + 1) )
        .slice(-2) +
      '-' +
      String( '0' + (dateObj.getDate()) )
        .slice( -2 );
  }
};

var Format = {

  /**
   * Format a time for Display
   *
   * @param time
   *
   * @returns {string}
   */

  timeDisplay : function ( time ) {
    'use strict';

    time = Math.round( time * 10 ) / 10;
    return ( time < 0.01 ? 0 : time ) + '';

  },

  /**
   * Format a date for Harvest
   *
   * @param dateObj
   *
   * @returns {string}
   */

  date : function ( dateObj ) {
    'use strict';

    if ( !dateObj ) {
      dateObj = new Date();
    }

    return dateObj.getFullYear() +
      '-' +
      String( '0' + (dateObj.getMonth() + 1) )
        .slice( -2 ) +
      '-' +
      String( '0' + (dateObj.getDate()) )
        .slice( -2 );
  }
};

var View = {

  /**
   * ELEMENTR
   *
   * @see https://goo.gl/md61lt
   *
   * @param type
   * @param attrs
   * @param append
   *
   * @returns {Element}
   */

  make : function ( type, attrs, append ) {
    'use strict';

    var el = document.createElement( type );

    Object.keys( attrs ) .forEach( function ( attr ) {
      el[attr] = attrs[attr];
    } );

    if ( append ) {

      if ( ! Array.isArray( append ) ) {
        append = [ append ];
      }

      append.forEach(function (add) {
        el = View.addTextOrNode( add, el );
      });
    }

    return el;
  },

  /**
   * Append text or a node
   *
   * @param m
   * @param el
   */

  addTextOrNode : function ( m, el ) {

    if ( typeof m === 'string' || typeof m === 'number' ) {
      m = document.createTextNode( m );
    }

    el.appendChild( m );
    return el;
  },

  /**
   * Take a string or element, attach a class, and append it to the right place
   *
   * @param msg
   * @param goodBad
   */

  msg : function ( msg, goodBad ) {
    'use strict';

    var messageNode = View.make(
      'div',
      { className: 'message ' + ( goodBad ? 'success' : 'error' ) },
      msg
    );

    document
      .getElementById( 'appMsgs' )
      .appendChild( messageNode );
  },

  /**
   * Handle an Axios error response
   *
   * @see: https://github.com/mzabriskie/axios#handling-errors
   *
   * @param error
   */

  axiosErr : function ( error ) {
    'use strict';

    if ( error.response ) {

      View.msg( [
        View.make( 'p', {}, [View.make( 'strong', {}, 'Axios error response:' )] ),
        View.make( 'p', {}, [View.make( 'strong', {}, 'Data: ' ), error.response.data] ),
        View.make( 'p', {}, [View.make( 'strong', {}, 'Status: ' ), error.response.status] ),
        View.make( 'p', {}, [View.make( 'strong', {}, 'Headers: ' ), error.response.headers] )
      ], false );
    } else {

      View.msg( [
        View.make( 'p', {}, [View.make( 'strong', {}, 'Axios error message: ' ), error.message] ),
      ], false );
    }
  },

  /**
   * Adds a time entry to the day list
   *
   * @param classAttr
   * @param label
   */

  addTimeEntry : function ( classAttr, label ) {
    'use strict';

    document
      .getElementById( 'appEntries' )
      .appendChild( View.make( 'li', { className : classAttr }, label ) );
  },

  /**
   * Takes a specially-formatted week object and outputs the stats
   *
   * @param {Object} timeObj
   */

  addWeek : function ( timeObj ) {
    'use strict';

    View.updateStatusBar( timeObj, 'week' );

    document
      .getElementById('week')
      .appendChild(
        View.make( 'div', { className : 'app__screen__week__1' }, [
          View.make( 'p', {}, [
          View.make( 'strong', {}, 'Total: ' ),
          View.make( 'span', {}, Format.timeDisplay( timeObj.totalTime ) )
          ] ),
          View.make( 'p', {}, [
            View.make( 'strong', {}, 'Billable: ' ),
            View.make( 'span', {}, Format.timeDisplay( timeObj.moneyTime ) )
          ] ),
        View.make( 'p', {}, [
          View.make( 'strong', {}, 'Used: ' ),
          View.make( 'span', {}, Format.timeDisplay( timeObj.usedTime ) )
        ] ),
          View.make( 'p', {}, [
            View.make( 'strong', {}, 'Waste: ' ),
            View.make( 'span', {}, Format.timeDisplay( timeObj.totalTime - timeObj.moneyTime - timeObj.usedTime ) )
          ] )
        ] ) );
  },

  /**
   * Set bar widths for daily status
   *
   * @param timeObj
   * @param dayOrWeek
   */

  updateStatusBar : function ( timeObj, dayOrWeek ) {
    'use strict';

    var totalTime = timeObj.totalTime ? timeObj.totalTime : timeObj.moneyTime + timeObj.usedTime;

    var barObj = document.getElementById( dayOrWeek + 'Status' );
    while ( barObj.hasChildNodes() ) {
      barObj.removeChild( barObj.lastChild );
    }

    // Billable
    var moneyPercent = timeObj.moneyTime / totalTime * 100;
    if ( moneyPercent > 0.01 ) {
      this.updateSingleStatus( {
        percent: moneyPercent,
        name: 'Money',
        amount: Format.timeDisplay( timeObj.moneyTime )
      }, 'app__status--money', barObj );
    }

    // Not billable
    var usedPercent = timeObj.usedTime / totalTime * 100;
    if ( usedPercent > 0.01 ) {
      this.updateSingleStatus( {
         percent : usedPercent,
         name    : 'Used',
         amount  : Format.timeDisplay( timeObj.usedTime )
       }, 'app__status--used', barObj );
    }

    // Wasted
    var wastePercent = 100 - moneyPercent - usedPercent;
    if ( wastePercent >= 1 && wastePercent !== Infinity ) {
      this.updateSingleStatus( {
        percent: wastePercent,
        name: 'Wasted',
        amount: Format.timeDisplay( totalTime - timeObj.moneyTime - timeObj.usedTime )
      }, 'app__status--waste', barObj );
    }
  },

  /**
   * Set single status bars
   *
   * @param {Object} labels
   * @param {string} classAttr
   * @param {Object} barObj
   */

  updateSingleStatus : function ( labels, classAttr, barObj ) {
    'use strict';

    barObj.appendChild(
      View.make( 'div', {
          className: classAttr,
          style: 'width: ' + labels.percent + '%'
        }, [
          View.make( 'span', {
              className: 'app__status__label app__status__amount'
            }, labels.amount + ' [' + Math.round( labels.percent ) + '%]' ),
          View.make( 'span', {
            className : 'app__status__label app__status__name'
          }, labels.name )
        ] )
    );
  },

  /**
   * Returns a DOM element with a GET form to do initial OAuth
   * TODO: Use ELEMENTR above
   *
   * @param formAction
   *
   * @returns {Element}
   */

  harvestAuthForm : function ( formAction ) {
    'use strict';

    var authForm = document.createElement( 'form' );
    authForm.setAttribute( 'method', 'get' );
    authForm.setAttribute( 'action', formAction );

    // Client ID input

    var inputClientId = document.createElement( 'input' );
    inputClientId.setAttribute( 'name', 'client_id' );

    var maybeExistingClientId = Storage.get( 'harvestClientId' );

    // If we have one stored, don't show, just add it to the form as a hidden input

    if ( maybeExistingClientId ) {
      inputClientId.setAttribute( 'type', 'hidden' );
      inputClientId.setAttribute( 'value', maybeExistingClientId );
    } else {
      inputClientId.setAttribute( 'type', 'text' );
      inputClientId.setAttribute( 'placeholder', 'Enter your OAuth client ID' );
    }

    var inputClientSecret = document.createElement( 'input' );
    inputClientSecret.setAttribute( 'name', 'client_secret' );

    if ( ! Storage.get( 'harvestClientSecret' ) ) {
      inputClientSecret.setAttribute( 'type', 'text' );
      inputClientSecret.setAttribute( 'placeholder', 'Enter your OAuth client ID' );
    }

    var inputSubmit = document.createElement( 'input' );
    inputSubmit.setAttribute( 'type', 'submit' );
    inputSubmit.setAttribute( 'value', 'Authorize' );

    var inputState = document.createElement( 'input' );
    inputState.setAttribute( 'type', 'hidden' );
    inputState.setAttribute( 'name', 'state' );
    inputState.setAttribute( 'value', 'optional-csrf-token' );

    var inputReponseType = document.createElement( 'input' );
    inputReponseType.setAttribute( 'type', 'hidden' );
    inputReponseType.setAttribute( 'name', 'response_type' );
    inputReponseType.setAttribute( 'value', 'token' );

    var inputRedirectUri = document.createElement( 'input' );
    inputRedirectUri.setAttribute( 'type', 'hidden' );
    inputRedirectUri.setAttribute( 'name', 'redirect_uri' );
    inputRedirectUri.setAttribute( 'value', window.location.href );

    authForm.appendChild( inputClientId );
    authForm.appendChild( inputState );
    authForm.appendChild( inputReponseType );
    authForm.appendChild( inputRedirectUri );
    authForm.appendChild( inputSubmit );

    authForm.addEventListener( 'submit', function ( e ) {

      var clientId = document.querySelector( '[name=client_id]' );
      var secretId = document.querySelector( '[name=client_secret]' );

      if ( clientId.value && secretId.value ) {

        // Store and send client ID

        Storage.set( 'harvestClientId', clientId.value );

        // Store but don't send client secret

        Storage.set( 'harvestClientSecret', secretId.value );
        secretId.parentNode.removeChild( secretId );

        View.msg( 'Heading to Harvest, hang on tight!', true );

      } else {
        e.preventDefault();

        if ( !clientId.value ) {
          clientId.classList.add( 'error' );
        }

        if ( !secretId.value ) {
          secretId.classList.add( 'error' );
        }
      }
    } );

    return authForm;
  },
};


/**
 * Local storage API API
 * @type {{canLocalStore: Storage.canLocalStore}}
 */

var Storage = {

  /**
   * Detects whether localStorage is both supported and available
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
   *
   * @returns {boolean}
   */

	canLocalStore : function () {
		'use strict';

		try {

			var x = '__storage_test__';

			window.localStorage.setItem( x, x );
			window.localStorage.removeItem( x );

			return true;
		} catch ( e ) {
			alert( 'localStorage not supported so this will not work for you, unfortunately' );
			return false;
		}
	},

  /**
   * Getter for local storage
   *
   * @param key
   */

	get : function ( key ) {
	  'use strict';

		return window.localStorage.getItem( key );
	},

  /**
   * Setter for local storage
   *
   * @param key
   * @param val
   */

	set : function ( key, val ) {
	  'use strict';

    window.localStorage.setItem( key, val );
	},

  /**
   * Getter for days in local storage
   *
   * @param key
   */

  getDay : function ( key ) {
    'use strict';

    if ( window.localStorage.getItem( key ) !== null ) {
      return JSON.parse( window.localStorage.getItem( key ) );
    } else {
      return {
        totalTime : 0,
        moneyTime : 0,
        usedTime : 0,
        entries : []
      };
    }
  },

  /**
   * Setter for days in local storage
   * TODO: Validate the key for date format
   *
   * @param key
   * @param val
   */

  setDay : function ( key, val ) {
    'use strict';

    window.localStorage.setItem( key, JSON.stringify( val ) );
  }
};

/**
 * Give us forEach capability for NodeList, fixes Firefox lack of support
 */

if ( !NodeList.prototype.forEach ) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}

/**
 * Let's go!!
 */

App.init();

