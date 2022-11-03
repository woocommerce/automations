/**
 * External dependencies
 */
const { setFailed } = require( '@actions/core' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const updateMilestoneHandler = require( './update-milestone-handler' );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

const runnerMatrix = {
	release: {
		published: updateMilestoneHandler,
	},
};

/**
 * The task runner for this action
 *
 * @param {string} eventName The event we want the runner for.
 * @param {string} [action]  The action we want the runner for.
 *
 * @return {AutomationTaskRunner} A runner function.
 */
const getRunnerTask = ( eventName, action ) => {
	if (
		! runnerMatrix[ eventName ] ||
		action === undefined ||
		! runnerMatrix[ eventName ][ action ]
	) {
		return;
	}
	return runnerMatrix[ eventName ][ action ];
};

/**
 * The task runner for this action to update the milestone
 *
 * @param {GitHubContext} context Context for the job run (github).
 * @param {GitHub}        octokit GitHub api helper.
 * @param {Object}        config  Config object.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit, config ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	if ( typeof task === 'function' ) {
		debug( `Update Milestone: Executing the ${ task.name } task.` );
		await task( context, octokit, config );
	} else {
		setFailed(
			`Update Milestone: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;
