const runner = require( './runner' );

module.exports = {
	name: 'release',
	events: [ 'create', 'issue_comment', 'pull_request_review' ],
	actions: [ 'edited', 'submitted' ],
	runner,
};
