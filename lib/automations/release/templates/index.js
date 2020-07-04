/**
 * External dependencies
 */
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/**
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 */

module.exports = {
	/**
	 * @param {string}        name    Name of template to get
	 * @param {GitHubContext} context
	 * @param {GitHub}        octokit
	 */
	getTemplate: async ( name, context, octokit ) => {
		const templates = {
			'release-pull-request': {
				fallBack: 'release-pull-request.md',
				canOverride: true,
			},
			'action-helpers': {
				fallBack: 'action-helpers.md',
				canOverride: false,
			},
		};
		const templateFileName = templates[ name ] || '';
		if ( ! templateFileName ) {
			throw new Error( `There is no template named ${ name }` );
		}
		// check if template exists on github repo
		let templateContents = '';
		try {
			const response = octokit.repos.getContent( {
				...context.repo,
				path: `.github/${ templateFileName }`,
			} );
			if ( response.content ) {
				const buffer = new Buffer( response.content, 'base64' );
				templateContents = buffer.toString( 'utf-8' );
			}
		} catch ( e ) {
			debug(
				`releaseRunner: Error retrieving the ${ templateFileName } from the repository.`
			);
		}
		// if templateContents is empty then let's fallback to the default template
		if ( ! templateContents ) {
			templateContents = fs.readFileSync( templateFileName, 'utf-8' );
		}
		return templateContents;
	},
};
