const runner = require( './runner' );

module.exports = {
	name: 'update-milestone',
	events: [ 'released' ],
	actions: [ 'update-milestone' ],
	runner,
};
