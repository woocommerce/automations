/**
 * External dependencies
 */
const debug = require( '../../debug' );
const { setFailed } = require( '@actions/core' );

/**
 * Internal dependencies
 */
const branchCreateHandler = require( './branch-create-handler' );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

const runnerMatrix = {
	create: branchCreateHandler,
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
 * @param {ReleaseConfig} config  The config for the release automation.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit, config ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	if ( typeof task === 'function' ) {
		debug( `releaseRunner: Executing the ${ task.name } task.` );
		await task( context, octokit, config );
	} else {
		setFailed(
			`releaseRunner: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;
