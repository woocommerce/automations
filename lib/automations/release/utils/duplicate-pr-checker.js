/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub}  GitHub
 */

/**
 * Checks to see if a pull requests already exists with the given title.
 *
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 * @param {string}        title    The title being checked for.
 *
 * @return {string|Object|undefined} Existing pr if found, title if already
 *                                   processed, or undefined if new issue can be
 *                                   created.
 */
const duplicateChecker = async ( context, octokit, title ) => {
	const openSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title type:pr repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	const closedSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title is:closed type:pr repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	const search = { ...openSearch, ...closedSearch };

	if ( search.data.total_count !== 0 ) {
		const existingPr = search.data.items.find( ( pr ) => {
			if ( pr.title === title && pr.merged === false ) {
				return true;
			}
			return false;
		} );
		return existingPr;
	}
};

module.exports = duplicateChecker;
