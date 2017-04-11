/**
 * Handle display updates
 *
 * @type {{loadWeekButton: Element, dayTimeEntries: Element, make: View.make, addTextOrNode: View.addTextOrNode, msg: View.msg, axiosErr: View.axiosErr, showDay: View.showDay, addTimeEntry: View.addTimeEntry, addWeek: View.addWeek, updateStatusBar: View.updateStatusBar, updateSingleStatus: View.updateSingleStatus, harvestAuthForm: View.harvestAuthForm}}
 */

var View = {

	loadWeekButton : document.getElementById( 'appLoadWeek' ),
	dayTimeEntries : document.getElementById( 'appEntries' ),

	/**
	 * ELEMENTR
	 *
	 * @see https://goo.gl/md61lt
	 *
	 * @param {string} type
	 * @param {object} attrs
	 * @param {object} append
	 *
	 * @returns {Element}
	 */

	make : function ( type, attrs, append ) {
		'use strict';

		var el = document.createElement( type );

		Object.keys( attrs ).forEach( function ( attr ) {
			el[ attr ] = attrs[ attr ];
		} );

		if ( append ) {

			if ( typeof append === 'function' ) {
				append = append();
			} else if ( !Array.isArray( append ) ) {
				append = [ append ];
			}

			append.forEach( function ( add ) {
				el = View.addTextOrNode( add, el );
			} );
		}

		return el;
	},

	/**
	 * Append text or a node
	 *
	 * @param {*} m
	 * @param {Element} el
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
	 * @param {string} msg
	 * @param {boolean} goodBad
	 */

	msg : function ( msg, goodBad ) {
		'use strict';

		document
			.getElementById( 'appMsgs' )
			.appendChild( View.make(
				'div', {
					className : 'message ' + ( goodBad ? 'success' : 'error' )
				}, msg
			) );
	},

	/**
	 * Handle an Axios error response
	 *
	 * @see: https://github.com/mzabriskie/axios#handling-errors
	 *
	 * @param {Error} error
	 */

	axiosErr : function ( error ) {
		'use strict';

		if ( error.response ) {

			View.msg( [
				View.make( 'p', {}, [ View.make( 'strong', {}, 'Axios error response:' ) ] ),
				View.make( 'p', {}, [ View.make( 'strong', {}, 'Data: ' ), error.response.data ] ),
				View.make( 'p', {}, [ View.make( 'strong', {}, 'Status: ' ), error.response.status ] ),
				View.make( 'p', {}, [ View.make( 'strong', {}, 'Headers: ' ), error.response.headers ] )
			], false );
		} else {

			View.msg( [
				View.make( 'p', {}, [ View.make( 'strong', {}, 'Axios error message: ' ), error.message ] )
			], false );
		}
	},

	/**
	 * Get a day and show it
	 *
	 * @param {string|object} showDay
	 */

	showDay : function ( showDay ) {
		'use strict';

		if ( typeof showDay === 'string' ) {
			document.getElementById( 'appNavDay' ).innerHTML = ( showDay == App.harvestToday ? 'Today' : showDay );
			showDay = Storage.getDay( showDay );
		}

		if ( showDay ) {

			// Total time to field
			document.getElementById( 'appTotalTime' ).value = showDay.totalTime
				? showDay.totalTime
				: showDay.moneyTime + showDay.usedTime;

			// Clear out existing entries, if any
			while ( View.dayTimeEntries.firstChild ) {
				View.dayTimeEntries.removeChild( View.dayTimeEntries.firstChild );
			}

			// Add time entries list
			showDay.entries.forEach( function ( el ) {
				View.addTimeEntry( el );
			} );

			// Pretty status bar
			View.updateStatusBar( showDay, 'dayStatus' );
		}
	},

	/**
	 * Adds a time entry to the day list
	 *
	 * @param {object} timeEntry
	 */

	addTimeEntry : function ( timeEntry ) {
		'use strict';

		View.dayTimeEntries.appendChild( View.make(
			'li', {
				className : 'app__entry--' + ( timeEntry.billable ? 'money' : 'used' )
			}, timeEntry.label + ': ' + timeEntry.hours
		) );
	},

	/**
	 * Takes a specially-formatted week object and outputs the stats
	 *
	 * @param {object} timeObj
	 * @param {number} weekNum
	 * @param {number} dateFromSec
	 */

	addWeek : function ( timeObj, weekNum, dateFromSec ) {
		'use strict';

		var thisWeek = View.make( 'div', {
				className : 'app__screen__row app__screen__week', id : 'week' + weekNum
		}, [
			View.make( 'div', { className : 'app__status__bg', id : 'weekStatus' + weekNum }, [] ),
			View.make( 'div', { className : 'app__screen__col' }, [
				View.make( 'h2', {}, 'Week ' + weekNum ),
				View.make( 'p', {},
					Format.dateDisplay( new Date( dateFromSec ) ) + ' to ' +
					Format.dateDisplay( new Date( dateFromSec + DateUtil.daysToSeconds( 6 ) ) )
				),
				View.make( 'p', {}, function () {

					var dayLinks = [];
					var currDay = DateUtil.convertJsDay( Storage.get( 'harvestCompanyWeekStart' ) );

					for ( var i = 0; i <= 6; i++ ) {

						// Make sure we've got a valid date number to convert
						currDay = currDay > 6 ? 0 : currDay;
						dayLinks.push(
							View.make(
								'a', {
									href      : '#day/' + Format.date(
										new Date( dateFromSec + DateUtil.daysToSeconds( i ) )
									),
									className : 'app__link__day'
								},
								DateUtil.convertJsDay( currDay ).slice( 0, 2 )
							)
						);

						dayLinks.push( View.make( 'span', { className : 'app__spacer' }, ' ' ) );
						currDay++;
					}

					return dayLinks;
				} )
			] ),
			View.make( 'div', { className : 'app__screen__col' }, [
				View.make( 'div', {}, [
					View.make( 'strong', {}, 'Total: ' ),
					View.make( 'span', {}, Format.timeDisplay( timeObj.totalTime ) )
				] ),
				View.make( 'div', {}, [
					View.make( 'strong', {}, 'Billable: ' ),
					View.make( 'span', {}, Format.timeDisplay( timeObj.moneyTime ) )
				] ),
				View.make( 'div', {}, [
					View.make( 'strong', {}, 'Used: ' ),
					View.make( 'span', {}, Format.timeDisplay( timeObj.usedTime ) )
				] ),
				View.make( 'div', {}, [
					View.make( 'strong', {}, 'Waste: ' ),
					View.make( 'span', {}, Format.timeDisplay(
						timeObj.totalTime - timeObj.moneyTime - timeObj.usedTime
					) )
				] )
			] )
		] );

		// Check for existing weeks
		var updateWeek = document.getElementById( 'week' + weekNum );

		if ( !updateWeek ) {

			// Not updating an existing week so just add it before the load button
			View.loadWeekButton.parentNode.insertBefore( thisWeek, View.loadWeekButton );

			// Store this so next time around we know where we're at
			View.loadWeekButton.setAttribute( 'data-week-offset', ( weekNum * -1 ).toString() );
		} else {

			// Week exists so replace the existing
			View.loadWeekButton.parentNode.insertBefore( thisWeek, updateWeek );
			updateWeek.parentNode.removeChild( updateWeek );
		}

		// And, finally, show the bar
		View.updateStatusBar( timeObj, 'weekStatus' + weekNum );
	},

	/**
	 * Set bar widths for daily status
	 *
	 * @param {object} timeObj
	 * @param {string} statusNodeId
	 */

	updateStatusBar : function ( timeObj, statusNodeId ) {
		'use strict';

		var totalTime = timeObj.totalTime ? timeObj.totalTime : timeObj.moneyTime + timeObj.usedTime;

		var barObj = document.getElementById( statusNodeId );
		while ( barObj.hasChildNodes() ) {
			barObj.removeChild( barObj.lastChild );
		}

		// Billable
		var moneyPercent = timeObj.moneyTime / totalTime * 100;
		if ( moneyPercent > 0.01 ) {
			this.updateSingleStatus( {
				percent : moneyPercent,
				name    : 'Money',
				amount  : Format.timeDisplay( timeObj.moneyTime )
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
				percent : wastePercent,
				name    : 'Waste',
				amount  : Format.timeDisplay( totalTime - timeObj.moneyTime - timeObj.usedTime )
			}, 'app__status--waste', barObj );
		}
	},

	/**
	 * Set single status bars
	 *
	 * @param {object} labels
	 * @param {string} classAttr
	 * @param {object} barObj
	 */

	updateSingleStatus : function ( labels, classAttr, barObj ) {
		'use strict';

		barObj.appendChild(
			View.make( 'div', {
				className : classAttr,
				style     : 'width: ' + labels.percent + '%'
			}, [
				View.make( 'span', {
					className : 'app__status__label app__status__amount'
				}, labels.amount ),
				View.make( 'span', {
					className : 'app__status__label app__status__name'
				}, labels.name )
			] )
		);
	},

	/**
	 * Returns a DOM element with a GET form to do initial OAuth
	 *
	 * @param formAction
	 *
	 * @returns {Element}
	 */

	harvestAuthForm : function ( formAction ) {
		'use strict';

		return this.make( 'form', {
			method : 'get',
			action : formAction,
			onsubmit : function ( e ) {

				var clientId = document.querySelector( '[name=client_id]' );

				if ( clientId.value ) {

					Storage.set( 'harvestClientId', clientId.value );
					View.msg( 'Heading to Harvest, hang on tight!', true );

				} else {
					e.preventDefault();

					clientId.classList.add( 'error' );
				}
			}
		}, [
			this.make( 'input', {
				name : 'client_id',
				type : 'text',
				placeholder : 'Enter your OAuth client ID'
			} ),
			this.make( 'input', {
				type : 'submit',
				value : 'Authorize'
			} ),
			this.make( 'input', {
				type : 'hidden',
				name : 'state',
				value : 'optional-csrf-token'
			} ),
			this.make( 'input', {
				type : 'hidden',
				name : 'response_type',
				value : 'token'
			} ),
			this.make( 'input', {
				type : 'hidden',
				name : 'redirect_uri',
				value : window.location.href
			} )
		] );
	}
};