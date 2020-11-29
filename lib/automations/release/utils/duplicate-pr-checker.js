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
		openSearch.data.items.filter(
			( pr ) => pr.title === title && pr.state === 'open'
		).length > 0
	) {
		return true;
	}

	const closedSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title is:closed type:pr repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	const items = closedSearch.data.items.filter(
		( pr ) => pr.title === title
	);

	// if any of the closed items matching the search are merged, then we return
	// false.
	return (
		items.length > 0 &&
		items.filter( ( pr ) => pr.merged === true ).length === 0
	);
};

module.exports = duplicateChecker;
