/**
 * Local storage API API
 *
 * @type {{canLocalStore: Storage.canLocalStore, get: Storage.get, set: Storage.set, getDay: Storage.getDay, setDay: Storage.setDay}}
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
	 * @param {string} key
	 */

	get : function ( key ) {
		'use strict';

		return window.localStorage.getItem( key );
	},

	/**
	 * Setter for local storage
	 *
	 * @param {string} key
	 * @param {string|int|object} val
	 */

	set : function ( key, val ) {
		'use strict';

		window.localStorage.setItem( key, val );
	},

	/**
	 * Getter for days in local storage
	 *
	 * @param {string} key
	 */

	getDay : function ( key ) {
		'use strict';

		if ( window.localStorage.getItem( key ) !== null ) {
			return JSON.parse( window.localStorage.getItem( key ) );
		} else {
			return {
				totalTime : 0,
				moneyTime : 0,
				usedTime  : 0,
				entries   : []
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