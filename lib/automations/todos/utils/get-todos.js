/**
 * External dependencies
 */
const parseDiff = require( 'parse-diff' );

/**
 * Internal dependencies
 */
const getDiff = require( './get-diff' );
const parseTodoFromChunk = require( './parse-to-do' );

/**
 * @typedef {import('../../../typedefs').TodoDetails} TodoDetails
 * @typedef {import('../../../typedefs').FileBoundaries} FileBoundaries
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').TodoItem} TodoItem
 */

/**
 * Used to retrieve todo information for usage from the given context.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 *
 * @return {TodoItem[]} An array of todo items.
 */
module.exports = async ( context, octokit ) => {
	let todos = [];
	// Get the diff for this commit or PR
	const diff = await getDiff( context, octokit );
	if ( ! diff ) {
		return todos;
	}

	// Parse the diff as files
	const files = parseDiff( diff );
	files.forEach( ( file ) => {
		// loop through every chunk in a file
		file.chunks.forEach( ( chunk ) => {
			const todosForChunk = parseTodoFromChunk( chunk, context, file );
			todos = [ ...todos, ...todosForChunk ];
		} );
	} );
	return todos;
};
