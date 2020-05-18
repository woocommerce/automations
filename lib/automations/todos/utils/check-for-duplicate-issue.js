/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub}  GitHub
 */

let todoTitlesVerified = [];

/**
 * Checks to see if an issue already exists with the given title.
 *
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 * @param {string}        title    The title being checked for.
 *
 * @return {string|Object|undefined} Existing issue if found, title if already
 *                                   processed, or undefined if new issue can be
 *                                   created.
 */
const duplicateChecker = async ( context, octokit, title ) => {
	if ( todoTitlesVerified.includes( title ) ) {
		return title;
	}
	todoTitlesVerified.push( title );

	const search = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title repo:${ context.payload.repository.full_name }`,
		per_page: 100,
	} );

	if ( search.data.total_count !== 0 ) {
		const existingIssue = search.data.items.find(
			( issue ) => issue.title === title
		);
		return existingIssue;
	}
};

module.exports = {
	duplicateChecker,
	reset: () => ( todoTitlesVerified = [] ),
};
