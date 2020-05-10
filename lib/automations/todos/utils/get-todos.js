/**
 * External dependencies
 */
const parseDiff = require("parse-diff");
const leasot = require("leasot");
const path = require("path");

/**
 * Internal dependencies
 */
const getDiff = require("./get-diff");
const parseTodoFromChunk = require("./parse-to-do");

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
 * @return TodoItem[]
 */
module.exports = async (context, octokit) => {
  // Get the diff for this commit or PR
  const diff = await getDiff(context, octokit);
  if (!diff) {
    return todos;
  }

  // Parse the diff as files
  const files = parseDiff(diff);
  let todos = [];
  files.forEach((file) => {
    // loop through every chunk in a file
    file.chunks.forEach((chunk) => {
      const todosForChunk = parseTodoFromChunk(chunk, context, file);
      todos = [...todos, ...todosForChunk];
    });
  });
  return todos;
};
