/**
 * Internal dependencies
 */
const { reopenClosed } = require( '../templates' );

/**
 * @typedef {import('../../../typedefs').ReopenClosedData} ReopenClosedData
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

/**
 * Reopen a closed issue and post a comment saying what happened and why
 *
 * @param {Object} params
 * @param {GitHubContext} params.context
 * @param {GitHub} params.octokit
 * @param {Object} params.config
 * @param {Object} params.issue
 * @param {ReopenClosedData} data
 *
 * @return {Object} Github comment object.
 */
module.exports = async ( { context, octokit, config = {}, issue }, data ) => {
	const { reOpenClosed: reOpenIssue = true } = config;
	if ( typeof issue !== 'object' ) {
		return;
	}
	if ( issue.state === 'closed' && reOpenIssue ) {
		const body = reopenClosed( {
			...context.repo,
			...data,
		} );
		return Promise.all( [
			octokit.issues.update( {
				...context.repo,
				issue_number: issue.number,
				state: 'open',
			} ),
			octokit.issues.createComment( {
				...context.repo,
				issue_number: issue.number,
				body,
			} ),
		] );
	}
};
