/**
 * Formatting data in a standard way
 *
 * @type {{timeDisplay: Format.timeDisplay, date: Format.date, timeEntry: Format.timeEntry}}
 */

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

		time = Math.round( time * 100 ) / 100;
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
			'-' + String( '0' + (dateObj.getMonth() + 1) ).slice( -2 ) +
			'-' + String( '0' + dateObj.getDate() ).slice( -2 );
	},

	/**
	 * Format a date for display
	 *
	 * @param dateObj
	 *
	 * @returns {string}
	 */

	dateDisplay : function ( dateObj ) {
		'use strict';

		if ( !dateObj ) {
			dateObj = new Date();
		}

		return String( dateObj.getMonth() + 1 ) +
			'/' + String( dateObj.getDate() ) +
			'/' + dateObj.getFullYear();
	},

	/**
	 * Prepare a single time entry for storing
	 * Will work with daily entry format or weekly report, normalizing to a specific format
	 *
	 * @param entry
	 * @returns {{id: Number, pid: Number, billable: *, label: string, notes: (*|string|Array), hours: *}}
	 */

	timeEntry : function ( entry ) {
		'use strict';

		var projectId = parseInt( entry.project_id, 10 );

		return {
			id       : parseInt( entry.id, 10 ),
			pid      : projectId,
			billable : Harvest.currProjects[ projectId ].isBillable,
			label    : Harvest.currProjects[ projectId ].clientName + ' - ' +
			Harvest.currProjects[ projectId ].projectName,
			notes    : entry.notes,
			hours    : entry.hours_with_timer ? entry.hours_with_timer : entry.hours
		};
	}
};

