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
 * @return {boolean} Existing pr if found, title if already
 *                                   processed, or undefined if new issue can be
 *                                   created.
 */
const duplicateChecker = async ( context, octokit, title ) => {
	const openSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title type:pr is:open repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	// if there's a match with open pr then abort early
	if (
		openSearch.data.items.filter( ( pr ) => pr.title === title ).length > 0
	) {
		return true;
	}

	const closedMergedSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title is:closed type:pr repo:${ context.payload.repository.full_name } is:merged`,
		per_page: 50,
	} );

	// if we have a match to the title in these results, then that means we return false
	// because the pull request was merged.
	if (
		closedMergedSearch.data.items.filter( ( pr ) => pr.title === title )
			.length > 0
	) {
		return false;
	}

	const closedSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title is:closed type:pr repo:${ context.payload.repository.full_name } is:unmerged`,
		per_page: 50,
	} );

	return (
		closedSearch.data.items.filter( ( pr ) => pr.title === title ).length >
		0
	);
};

module.exports = duplicateChecker;
