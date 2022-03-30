const runner = require( './runner' );
const { getConfig } = require( './config' );

module.exports = {
	name: 'release',
	events: [ 'create', 'release' ],
	runner,
	getConfig,
};
