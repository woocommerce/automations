/**
 * External dependencies
 */
const debug = require( '../../debug' );
const { setFailed } = require( '@actions/core' );

/**
 * Internal dependencies
 */
const pullRequestHandler = require( './pull-request-handler' );
const pullRequestMergeHandler = require( './pull-request-merge-handler' );
const pushHandler = require( './push-handler' );
const issueRenameHandler = require( './issue-rename-handler' );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

const runnerMatrix = {
	pull_request: {
		opened: pullRequestHandler,
		synchronize: pullRequestHandler,
		closed: pullRequestMergeHandler,
	},
	push: pushHandler,
	issues: {
		edited: issueRenameHandler,
	},
};

/**
 * Whether or not this runner should run given the event and action.
 *
 * @param {string} eventName The event we want the runner for.
 * @param {string} [action]  The action we want the runner for.
 *
 * @return {AutomationTaskRunner} A runner function.
 */
const getRunnerTask = ( eventName, action ) => {
	if ( ! runnerMatrix[ eventName ] ) {
		return;
	}
	return action === undefined
		? runnerMatrix[ eventName ]
		: runnerMatrix[ eventName ][ action ];
};

/**
 * The task runner for the Todos action
 *
 * @param {GitHubContext} context Context for the job run (github).
 * @param {GitHub}        octokit GitHub api helper.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	if ( typeof task === 'function' ) {
		debug( `todoRunner: Executing the ${ task.name } task.` );
		await task( context, octokit );
	} else {
		setFailed(
			`todoRunner: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;
