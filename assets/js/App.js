/**
 * Main App for the page
 * Uses Kyle Simpson's OLOO (as a model)
 *
 * @see http://stackoverflow.com/a/30468602/728480
 *
 * @type {{canStoreLocal: boolean, yearNow: string, monthNow: string, dayNow: string, harvestToday: string, init: App.init, changeState: App.changeState, parseParams: App.parseParams, getUrlHash: App.getUrlHash, getDayToShow: App.getDayToShow}}
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

		// Get the current day data
		this.harvestToday = Format.date();

		// Get the current state of the app
		if ( window.location.hash.indexOf( Harvest.accessTokenParam ) === -1 ) {
			this.changeState( this.getUrlHash() );
		}

		//
		// Attach interaction events
		//

		// If the hash changes, alter the start
		window.onhashchange = function () {
			App.changeState( App.getUrlHash() );
		};

		// Update stored total time
		document
			.getElementById( 'appTotalTimeForm' )
			.addEventListener( 'submit', function ( e ) {
				e.preventDefault();

				var theDate;
				var totalTimeVal = document.getElementById( 'appTotalTime' ).value;

				// What date are we saving?
				theDate = App.getDayToShow();

				// Get stored date for this date
				var dateJson = Storage.getDay( theDate );

				// Can't have a total time less than what was tracked for the day
				var minimumTime = dateJson.moneyTime + dateJson.usedTime;

				if ( ! totalTimeVal || totalTimeVal < minimumTime ) {

					// Not a number, empty, or less than the minimum
					document.getElementById( 'appTotalTime' ).value = minimumTime;

					// An empty stored total time tells status update to use total tracked
					dateJson.totalTime = 0;
				} else {
					dateJson.totalTime = parseFloat( totalTimeVal );
				}

				Storage.setDay( theDate, dateJson );
				View.updateStatusBar( dateJson, 'dayStatus' );

				Harvest.getWeek();
			} );

		// Load another week
		View.loadWeekButton
			.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				Harvest.getWeek( this.getAttribute( 'data-week-offset' ) );
			} );

		// Harvest startup
		Harvest.init();

		if ( Harvest.runAuth() ) {
			Harvest.getCompany();
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
		var todayNavLink = document.getElementById( 'appNavDay' );

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
				todayNavLink.innerHTML = 'Today';

				if ( force ) {
					window.location.hash = 'week';
				}

				break;

			default:
				View.showDay( App.getDayToShow() );
				navLink = todayNavLink;
				appScreen = document.getElementById( 'dayScreen' );

				if ( force ) {
					window.location.hash = 'day';
				}
		}

		navLink.classList.add( 'is-active' );
		appScreen.classList.add( 'is-active' );
	},

	/**
	 * Given a string, parse out the params
	 *
	 * @param {string} params
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
	},

	/**
	 * Normalize URL hash getting
	 *
	 * @returns {string}
	 */

	getUrlHash : function () {

		return window.location.hash.replace( '#', '' );
	},

	/**
	 * Determine what date we're showing based on the URL hash
	 *
	 * @returns {string}
	 */

	getDayToShow : function () {

		return window.location.hash.indexOf( '/' ) < 0 ?
			App.harvestToday :
			window.location.hash.split( '/' )[ 1 ];
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