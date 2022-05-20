const debug = require( '../../../debug' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 */

/**
 * Callback test.
 *
 * @callback updateContent
 * @param {string} content
 */
/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {string} path The path of the file to update
 * @param {string} message The message for the reason of the file update
 * @param {updateContent} updateContent callback to update the content of the file
 */
module.exports = async ( context, octokit, path, message, updateContent ) => {
	const contentResponse = await octokit.repos.getContent( {
		...context.repo,
		path,
	} );

	if ( ! contentResponse ) {
		debug(
			`releaseAutomation: Could not read ${ path } file from repository.`
		);
		return;
	}

	// Content comes from GH API in base64 so convert it to utf-8 string.
	const contentBuffer = new Buffer.from(
		contentResponse.data.content,
		'base64'
	);
	const contents = contentBuffer.toString( 'utf-8' );

	// Need to convert back to base64 to write to the repo.
	const updatedContentBuffer = new Buffer.from(
		updateContent( contents ),
		'utf-8'
	);
	const updatedContent = updatedContentBuffer.toString( 'base64' );

	const fileSha = contentResponse.data.sha;
	const updatedCommit = await octokit.repos.createOrUpdateFileContents( {
		...context.repo,
		message,
		path,
		content: updatedContent,
		sha: fileSha,
		branch: context.payload.ref,
	} );

	if ( ! updatedCommit ) {
		debug( `releaseAutomation: Automatic update of ${ path } failed.` );
	}

	return updatedCommit;
};
