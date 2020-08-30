/**
 * Internal dependencies
 */
const debug = require( '../../../debug' );
const defaultConfig = require( './default.json' );
const { validateConfig } = require( './validate-config' );

/**
 * External dependencies
 */
const core = require( '@actions/core' );

/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

module.exports = {
	/**
	 * @param {GitHubContext} context
	 * @param {GitHub}        octokit
	 */
	getConfig: async ( context, octokit ) => {
		let repoConfig = {};
		const configFileName = 'release-automation-config.json';
		// check if config file exists on GitHub repo.
		try {
			const response = octokit.repos.getContents( {
				...context.repo,
				path: `.github/${ configFileName }`,
			} );
			if (
				response.data &&
				response.data.content &&
				response.data.encoding
			) {
				const buffer = Buffer.from(
					response.data.content,
					response.data.encoding
				);
				repoConfig = JSON.parse( buffer.toString( 'utf-8' ) );
			}
		} catch ( e ) {
			debug(
				`releaseRunner: Error retrieving the ${ configFileName } release config from the repository.`
			);
		}

		core.debug( 'retrieved config' + JSON.stringify( repoConfig ) );

		// validate config.
		validateConfig( repoConfig );

		// merge configs with defaultConfig back filling.
		return {
			...defaultConfig,
			...repoConfig,
		};
	},
};
