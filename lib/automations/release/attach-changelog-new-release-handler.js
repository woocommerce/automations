const { setFailed } = require( '@actions/core' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {ReleaseConfig} config
 */
exports.attachChangelogHandler = async ( context, octokit, config ) => {
	const release = context.payload.release;

	const { owner, repo } = context.repo;

	const pullRequests = octokit.rest.search.issuesAndPullRequests( {
		q: `q=${ encodeURIComponent(
			`is:pr is:closed Release: ${ release.tag_name } in:title`
		) }`,
	} );

	if ( pullRequests.length === 0 || pullRequests.data.items.length > 1 ) {
		setFailed( '' );
	}

	const pullRequestNumber = await octokit.rest.pullRequest( {
		id: pullRequests.data.items[ 0 ].number,
	} );

	const pullRequest = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: pullRequestNumber,
	} )[ 0 ];

	await octokit.repos.updateRelease( {
		...context.repo,
		release_id: release.id,
		body: pullRequest.body,
	} );
};
