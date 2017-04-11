/**
 * Harvest API API
 *
 * @type {{week1DateFromSec: number, currProjects: {}, accessToken: string, accessTokenCookie: string, accessTokenCookieExp: string, accessTokenParam: string, baseUrl: string, authPath: string, checkPath: string, dailyPath: string, entriesPath: string, init: Harvest.init, runAuth: Harvest.runAuth, getCompany: Harvest.getCompany, getDaily: Harvest.getDaily, getWeek: Harvest.getWeek}}
 */

var Harvest = {

	// First week dare from in seconds
	week1DateFromSec : 0,

	// Projects, we get this back with the daily call
	currProjects : {},

	// Cookie access token name
	accessToken : '',

	// Cookie expiration name
	accessTokenCookie : 'harvestAccessToken',

	// Cookie expiration name
	accessTokenCookieExp : 'harvestAccessExp',

	// Access token URI paramter name
	accessTokenParam : 'access_token',

	// API: base URL
	baseUrl : 'https://api.harvestapp.com',

	// API Path: check account details
	authPath : '/oauth2/authorize',

	// API Path: check account details
	checkPath : '/account/who_am_i',

	// API Path: daily entries
	dailyPath : '/daily',

	// API Path: get daily time sheet
	// Need to replace the token in there with a valid user ID
	entriesPath : '/people/{USER_ID}/entries',

	/**
	 * Startup, needs to be called explicitly after Object.create()
	 */

	init : function () {
		'use strict';

		// Axios defaults
		axios.defaults.baseURL = this.baseUrl;
		axios.defaults.headers.common[ 'Content-Type' ] = 'application/json';
		axios.defaults.headers.common[ 'Accept' ] = 'application/json';
		axios.defaults.params = {};

		this.accessToken = Cookies.get( this.accessTokenCookie );

		if ( this.accessToken ) {
			axios.defaults.params[ 'access_token' ] = this.accessToken;
		}

		// Date data for pulling weeks
		var thisDate = new Date();
		var dayDiff = DateUtil.dayDiff(
			thisDate.getDay(),
			DateUtil.convertJsDay( Storage.get( 'harvestCompanyWeekStart' ) )
		);

		this.week1DateFromSec = Date.now() - DateUtil.daysToSeconds( dayDiff );
	},

	/**
	 * Authenticate with the Harvest API server
	 */

	runAuth : function () {
		'use strict';

		if ( ! this.accessToken || ! ( ( Date.now() / 1000) < Cookies.get( this.accessTokenCookieExp ) ) ) {

			View.msg( 'No cookie, looking for hash', true );

			// We don't have a cookie so we need to figure out what the next step is
			var haveTokenIndex = window.location.hash.indexOf( this.accessTokenParam + '=' );

			//return false;

			if ( haveTokenIndex > -1 ) {

				// We were redirected from Harvest, grab access token, expires, and refresh token

				View.msg( 'Have a URL access token', true );

				var oauthParams = App.parseParams( window.location.hash );

				// Set and store access token
				this.accessToken = oauthParams.access_token;
				Cookies.set( this.accessTokenCookie, this.accessToken );

				// Set and store token expiration
				var expiresIn = parseInt( oauthParams.expires_in, 10 );
				expiresIn = expiresIn + Math.round( Date.now() / 1000 );
				Cookies.set( this.accessTokenCookieExp, expiresIn );

				// Set a default URL parameter for calls
				axios.defaults.params[ 'access_token' ] = this.accessToken;

				// Set default state to get rid of Oauth in the URL
				App.changeState( 'day', true );

			} else {

				// No token and no oAuth params so we need to authenticate
				View.msg( 'Approval required', false );

				if ( Storage.get( 'harvestClientId' ) ) {

					window.location.replace( this.baseUrl + this.authPath +
						'?client_id=' + Storage.get( 'harvestClientId' ) +
						'&redirect_uri=' + encodeURIComponent( window.location.href ) +
						'&state=optional-csrf-token&response_type=token'
					);
					return false;

				} else {

					View.msg( View.harvestAuthForm( Harvest.baseUrl + Harvest.authPath ), false );
					return false;
				}
			}
		}

		return true;
	},


	/**
	 * Get and store company data
	 */

	getCompany : function () {
		'use strict';

		if ( !this.accessToken ) {
			View.msg( 'No access token; stopping.', false );
		}

		// Grab company information to test out the token
		axios.get( this.checkPath )

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
	 * @param date
	 */

	getDaily : function ( callback ) {
		'use strict';

		if ( !this.accessToken ) {
			View.msg( 'No access token; stopping.', false );
		}

		axios.get( this.dailyPath )

		// Success!
			.then( function ( response ) {

				// Get the current day data to replace
				var currentDay = Storage.getDay( response.data.for_day );
				var newDay = {
					totalTime : currentDay.totalTime > 0 ? currentDay.totalTime : 0,
					entries   : []
				};

				// Project data is provided separately
				// Just need whether the project is billable or not
				response.data.projects.forEach( function ( el ) {

					Harvest.currProjects[ el.id ] = {
						isBillable  : el.billable,
						clientName  : el.client,
						projectName : el.name
					};
				} );

				var totalTime = 0;
				var totalMoney = 0;
				var totalUsed = 0;

				// Run through all the entries and add them to the list while calculating the total
				response.data.day_entries.forEach( function ( el ) {

					var storeEntry = Format.timeEntry( el );

					if ( storeEntry.billable ) {

						// Count up billed time
						totalMoney = totalMoney + storeEntry.hours;
					} else {

						// Count up unbilled time
						totalUsed = totalUsed + storeEntry.hours;
					}

					// Count up total billed and unbilled time
					totalTime = totalTime + storeEntry.hours;

					// Push to entries for storage
					newDay.entries.push( storeEntry );
				} );

				newDay.moneyTime = totalMoney;
				newDay.usedTime = totalUsed;

				// Update stored day
				Storage.setDay( response.data.for_day, newDay );

				// Show the day
				View.showDay( App.getDayToShow() );

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

		// URL params for pulling the time report
		var dateTo, dateFrom;
		offset = offset ? parseInt( offset, 10 ) : 0;
		var weekNum = ( offset * -1 ) + 1;
		var dateFromSec = Harvest.week1DateFromSec;

		if ( !offset ) {

			// First week showing
			dateTo = App.harvestToday;
			dateFrom = Format.date( new Date( Harvest.week1DateFromSec ) );

		} else {

			// Not the first week. In fact, a different week altogether
			dateFromSec = Harvest.week1DateFromSec + ( offset * DateUtil.daysToSeconds( 7 ) );
			dateFrom = Format.date( new Date( dateFromSec ) );
			dateTo = Format.date( new Date( dateFromSec + DateUtil.daysToSeconds( 6 ) ) );
		}

		axios.get( Harvest.entriesPath.replace( '{USER_ID}', Storage.get( 'harvestUserId' ) ), {
			params : {
				from : dateFrom,
				to   : dateTo
			}
		} )

			// Success!
			.then( function ( response ) {

				var thisWeek = {
					moneyTime    : 0,
					usedTime     : 0,
					totalTime    : 0,
					totalEntries : 0,
					dates        : []
				};

				response.data.forEach( function ( el ) {

					if ( ! Harvest.currProjects[ el.day_entry.project_id ] ) {

						View.loadWeekButton.setAttribute( 'disabled', true );
						View.axiosErr( 'A time entry for this week was for an inactive project. Quitting ...', false );
						return false;
					}

					// Date of time entry
					var currDate = el.day_entry.spent_at;

					// Get day from local
					var thisDayLocal = Storage.getDay( currDate );

					// Prepare the time entry
					var addEntry = Format.timeEntry( el.day_entry );

					// Have we already seen this day?
					if ( thisWeek.dates.indexOf( currDate ) > -1 ) {

						// Have already cleared out the entries
						// Need to add this new entry
						thisDayLocal.entries.push( addEntry );

					} else {

						// Mark this date as updated
						thisWeek.dates.push( currDate );

						// Clear out entries and add this new one
						thisDayLocal.entries = [ addEntry ];

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
				} );

				// Set total time
				thisWeek.dates.forEach( function ( el ) {
					var thisDayTotal = Storage.getDay( el );

					thisWeek.totalTime += thisDayTotal.totalTime ?
						thisDayTotal.totalTime :
						thisDayTotal.moneyTime + thisDayTotal.usedTime;
				} );

				View.addWeek( thisWeek, weekNum, dateFromSec );
			} )

			// Catastrophic failure!
			.catch( function ( error ) {
				View.axiosErr( error );
			} );
	}
};