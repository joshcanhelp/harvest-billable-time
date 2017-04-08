/**
 * Fun helper functions for dealing with dates
 *
 * @type {{dayDiff: DateUtil.dayDiff, daysToSeconds: DateUtil.daysToSeconds, convertJsDay: DateUtil.convertJsDay}}
 */

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

		return [ 0, 1, 2, 3, 4, 5, 6 ].slice( today - weekStart )[ 0 ];
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
	 * Get the day of the week name from a JS day number
	 *
	 * @param jsDay
	 *
	 * @returns {string|int}
	 */

	convertJsDay : function ( jsDay ) {
		'use strict';

		var dotw = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

		if ( typeof jsDay === 'string' ) {

			// If it's a string, assume we want to convert from English day to JS day
			return dotw.indexOf( jsDay );
		} else {

			// If it's anything else, assume int and we want to convert JS day to English day
			return dotw[ jsDay ];
		}
	}
};
