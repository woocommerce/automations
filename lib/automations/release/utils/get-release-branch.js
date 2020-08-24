/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 */

/**
 * Return release branch name for the given patchVersion.
 *
 * So if the patch version is 2.0.1, then this will check for any of the
 * following branches:
 *
 * - release/2.0
 * - release/2.0.0
 *
 * If any of the above exist then will return the actual branch name,
 * otherwise false.
 *
 * @param {string}        patchVersion
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 *
 * @return {boolean|string} If a branch is found then the branch.name is returned,
 *                        otherwise false.
 */
module.exports = async ( patchVersion, context, octokit ) => {
	const releaseVersion = patchVersion
		.split( '.' )
		.slice( 0, 2 )
		.join( '.' );
	let branch = await octokit.repos.getBranch( {
		...context.repo,
		branch: `release/${ releaseVersion }`,
	} );
	// if branch doesn't exist try the canonical `.0` version.
	if ( branch && branch.message ) {
		branch = await octokit.repos.getBranch( {
			...context.repo,
			branch: `release/${ releaseVersion }.0`,
		} );
	}
	return branch && branch.name ? branch.name : false;
};
