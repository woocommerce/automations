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

	// if we have a match to the title in these results, then that means we return true
	// because the pull request was merged and thus we should not end up creating
	// another pull request (the branch is reopened for another reason)
	if (
		closedMergedSearch.data.items.filter( ( pr ) => pr.title === title )
			.length > 0
	) {
		return true;
	}

	// otherwise there' no match considered (even if there are unmerged closed prs matching the title)
	return false;
};

module.exports = duplicateChecker;
