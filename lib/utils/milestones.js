/**
 * @typedef {import('../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../typedefs').GitHub} GitHub
 * @typedef {import('../typedefs').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem
 * @typedef {import('../typedefs').IssuesListMilestonesForRepoResponseItem} IssuesListMilestonesForRepoResponseItem
 * @typedef {import('../typedefs').IssueState} IssueState
 */

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} title   Milestone title.
 * @param {IssueState} state
 * @return {Promise<IssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( context, octokit, title, state = 'open' ) {
	const options = octokit.issues.listMilestonesForRepo.endpoint.merge( {
		...context.repo,
		state,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if (
				milestone.title === title ||
				milestone.title === `${ title }.0`
			) {
				return milestone;
			}
		}
	}
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHubContext} context
 * @param {GitHub}     octokit   Initialized Octokit REST client.
 * @param {number}     milestone Milestone ID.
 * @param {IssueState} [state]   Optional issue state.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to pull
 *                                                    requests for the given
 *                                                    milestone.
 */
async function getIssuesByMilestone( context, octokit, milestone, state ) {
	const options = octokit.issues.listForRepo.endpoint.merge( {
		...context.repo,
		milestone,
		state,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		pulls.push( ...issues );
	}

	return pulls;
}

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
};
