/**
 * External dependencies
 */
const core = require( '@actions/core' );

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 */

/**
 * Return the version found in package.json.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @return {string} Version
 */
module.exports = async ( context, octokit ) => {
	try {
		core.debug( 'Fetching `package.json` contents' );

		const response = await octokit.repos.getContent( {
			...context.repo,
			path: 'package.json',
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
			const { version } = JSON.parse( buffer.toString( 'utf-8' ) );

			core.debug( `Found version: ${ version }` );

			return version;
		}

		throw new Error( 'No content found' );
	} catch ( error ) {
		core.debug(
			`Could not find version in package.json. Failed with error: ${ error }`
		);
	}

	return false;
};
