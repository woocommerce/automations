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
	const search = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title type:pr state:open repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	if ( search.data.total_count !== 0 ) {
		const existingPr = search.data.items.find(
			( pr ) => pr.title === title
		);
		return existingPr;
	}
};

module.exports = {
	duplicateChecker,
};
