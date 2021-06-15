const runner = require( './runner' );
const { getConfig } = require( './get-config' );

module.exports = {
	name: 'assign-milestone',
	events: [ 'pull_request_review' ],
	actions: [ 'submitted', 'edited' ],
	runner,
	getConfig,
};
