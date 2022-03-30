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

	const pullRequests = await octokit.search.issuesAndPullRequests( {
		q: `${ `is:pr Release: 7.3.0 in:title repo:woocommerce/woocommerce-gutenberg-products-block` }`,
	} );

	if (
		pullRequests.data.items.length === 0 ||
		pullRequests.data.items.length > 1
	) {
		setFailed(
			`Missing PR associated with the release ${ release.tag_name }`
		);
	}

	const pullRequest = await octokit.pulls.get( {
		owner: 'woocommerce',
		repo: 'woocommerce-gutenberg-products-block',
		pull_number: pullRequests.data.items[ 0 ].number,
	} );

	console.log(
		'ci entro1',
		pullRequest.data.body.match( /```([\s\S]*?)```/gm )[ 0 ]
	);

	await octokit.repos.updateRelease( {
		...context.repo,
		release_id: release.id,
		body: pullRequest.data.body
			.match( /```([\s\S]*?)```/gm )[ 0 ]
			.replace( /```/gm, '' ),
	} );
};
