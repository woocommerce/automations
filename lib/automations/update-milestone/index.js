const runner = require( './runner' );
const getConfig = require( './get-config' );

module.exports = {
	name: 'update-milestone',
	events: [ 'release' ],
	runner,
	getConfig,
};
