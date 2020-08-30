/**
 * Internal dependencies
 */
const { getMilestoneByTitle } = require( '../../../utils' );

/**
 * External dependencies
 */
const core = require( '@actions/core' );

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').IssueState} IssueState
 */

/**
 * Return whether or not there is a milestone for the provided version.
 *
 * @param {string} version
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {IssueState} state
 * @return {boolean} True if there is a milestone.
 */
module.exports = async ( version, context, octokit, state = 'open' ) => {
	const milestone = await getMilestoneByTitle(
		context,
		octokit,
		version,
		state
	);
	core.debug( `Milestone retrieved: ${ milestone }` );
	return !! milestone;
};
