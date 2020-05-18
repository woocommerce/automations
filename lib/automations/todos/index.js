const runner = require( './runner' );

module.exports = {
	name: 'todos',
	events: [ 'pull_request', 'push', 'issues' ],
	actions: [ 'opened', 'synchronize', 'closed', 'edited' ],
	runner,
};
