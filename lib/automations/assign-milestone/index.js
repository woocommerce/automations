const runner = require( './runner' );

module.exports = {
	name: 'assign-milestone',
	events: [ 'pull_request_review' ],
	actions: [ 'submitted', 'edited' ],
	runner,
};
