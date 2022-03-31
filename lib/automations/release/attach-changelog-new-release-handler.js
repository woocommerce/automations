const { setFailed } = require( '@actions/core' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * Extract only the changelog from the PR body.
 * Extract the content that is wrapped between backtips.
 * @param {string} pullRequestBody
 */
const parsePullRequestBody = ( pullRequestBody ) => {
	const body = pullRequestBody.match( /```([\s\S]*?)```/gm );

	if ( ! body || body.length === 0 ) {
		return pullRequestBody;
	}

	return body[ 0 ].replace( /```/gm, '' );
};

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {ReleaseConfig} config
 */
exports.attachChangelogHandler = async ( context, octokit ) => {
	const release = context.payload.release;
	const { repo } = context;

	const pullRequests = await octokit.search.issuesAndPullRequests( {
		q: `is:pr Release: ${ release.name } in:title repo:"${ repo.owner }/${ repo.repo }"`,
	} );

	if (
		pullRequests.data.items.length === 0 ||
		pullRequests.data.items.length > 1
	) {
		return setFailed(
			`Missing PR associated with the release ${ release.name } with tag ${ release.tag_name }`
		);
	}

	const pullRequest = await octokit.pulls.get( {
		...repo,
		pull_number: pullRequests.data.items[ 0 ].number,
	} );

	await octokit.repos.updateRelease( {
		...repo,
		release_id: release.id,
		body: parsePullRequestBody( pullRequest.data.body ),
	} );
};
