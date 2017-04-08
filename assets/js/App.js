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
	yearNow      : '',
	monthNow     : '',
	dayNow       : '',
	harvestToday : '',

	/**
	 * Startup, needs to be called explicitly after Object.create()
	 */

	init : function () {
		'use strict';

		// Can we use local storage?
		this.canStoreLocal = Storage.canLocalStore();

		// Get the current state of the app
		if ( window.location.hash.indexOf( Harvest.accessTokenParam ) === -1 ) {
			this.changeState( window.location.hash.replace( '#', '' ), true );
		}

		window.onhashchange = function () {
			'use strict';

			App.changeState( window.location.hash.replace( '#', '' ) );
		};

		// Get the current day data
		this.harvestToday = Format.date();

		//
		// Attach interaction events
		//

		// Update stored total time
		document
			.getElementById( 'appTotalTimeForm' )
			.addEventListener( 'submit', function ( e ) {

				e.preventDefault();

				var theDate;
				var theHash = window.location.hash;

				if ( !theHash || !theHash.indexOf( '/' ) ) {

					// No day listed so looking at today
					theDate = App.harvestToday;
				} else {

					// Have a date to use
					theDate = theHash.slice( theHash.indexOf( '/' ) )[ 1 ];
				}

				var todayJson = Storage.getDay( theDate );
				var totalTimeVal = document.getElementById( 'appTotalTime' ).value;

				// Can't have a total time less than what was tracked for the day
				var minimumTime = todayJson.moneyTime + todayJson.usedTime;

				if ( !totalTimeVal || totalTimeVal < minimumTime ) {

					// Not a number, empty, or less than the minimum
					document.getElementById( 'appTotalTime' ).value = minimumTime;

					// An empty stored total time tells status update to use total tracked
					todayJson.totalTime = 0;
				} else {
					todayJson.totalTime = parseFloat( totalTimeVal );
				}

				Storage.setDay( theDate, todayJson );

				View.updateStatusBar( todayJson, 'dayStatus' );
				Harvest.getWeek();
			} );

		// Load another week
		View.loadWeekButton
			.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				Harvest.getWeek( this.getAttribute( 'data-week-offset' ) );
			} );

		// Harvest startup
		if ( Harvest.init() ) {
			Harvest.getDaily( Harvest.getWeek );
		}
	},

	/**
	 * Change the app state, including nav, window showing, and hash
	 *
	 * @param hash
	 * @param force
	 */

	changeState : function ( hash, force ) {
		'use strict';

		var navLink, appScreen;

		// Make everything inactive for now
		document
			.querySelectorAll( '.is-active' )
			.forEach( function ( el ) {
				el.classList.remove( 'is-active' );
			} );

		// Determine an acceptable state
		switch ( hash ) {

			case 'week':
				navLink = document.getElementById( 'appNavWeek' );
				appScreen = document.getElementById( 'weekScreen' );

				if ( force ) {
					window.location.hash = 'week';
				}

				break;

			default:
				View.showDay( hash.indexOf( '/' ) ? hash.split( '/' )[ 1 ] : App.harvestToday );
				navLink = document.getElementById( 'appNavDay' );
				appScreen = document.getElementById( 'dayScreen' );

				if ( force ) {
					window.location.hash = 'day';
				}
		}

		if ( navLink && appScreen ) {
			navLink.classList.add( 'is-active' );
			appScreen.classList.add( 'is-active' );
		}
	},

	/**
	 * Given a string, parse out the params
	 *
	 * @param params
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

		params.split( '&' ).forEach( function ( el ) {
			pieces[ el.split( '=' )[ 0 ] ] = el.split( '=' )[ 1 ];
		} );

		return pieces;
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