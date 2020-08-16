const runner = require( './runner' );
const { getConfig } = require( './config' );

module.exports = {
	name: 'release',
	events: [ 'create' ],
	actions: [],
	runner,
	getConfig,
};
