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
const getDetails = require("./get-details");
const debug = require("../../../debug");

/**
 * @typedef {import('../../../typedefs').TodoDetails} TodoDetails
 * @typedef {import('../../../typedefs').FileBoundaries} FileBoundaries
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').TodoItem} TodoItem
 * @typedef {import('../../../typedefs').TodoComment} TodoComment
 */

const getFirstSentence = (content) => {
  const pattern = /^.*?[.!?](?:\s|$)(?!.*\))/gim;
  const match = pattern.exec(content);
  return match !== null && match[0];
};

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

  const todos = await Promise.all(
    files.map(async (file) => {
      // loop through every chunk in a file
      await Promise.all(
        file.chunks.map(async (chunk) => {
          // chunks might have multiple changes
          await Promise.all(
            chunk.changes.map(async (change, index) => {
              // Only act on added lines
              // @todo Eventually handle deleted lines.
              if (change.type !== "add") {
                return;
              }

              const fileName = file.to;
              const extension = path.extname(fileName);
              // Use leosot to get matching todos
              debug(
                `get-todos: Filename being parsed: ${fileName} extension: ${extension}`
              );
              debug(`getTodos: content being parsed is: ${change.content}`);
              const parsedTodos = leasot.parse(change.content, {
                filename: fileName,
                extension: extension,
              });

              // if no matches return;
              if (!parsedTodos) {
                return;
              }

              // okay so we have parsedTodos. This will be an array but
              // since we're matching against chunks there should only be
              // one todo in a chunk, so we'll grab the first.
              /**
               * @type {TodoComment}
               */
              const todoItem = parsedTodos[0];

              const extraDetails = getDetails({
                context,
                chunk,
                config: {},
                line: change.ln || change.ln2,
              });

              debug(`getTodos: Todo item parsed = ${todoItem}`);
              console.log(todoItem);

              return {
                keyword: todoItem.tag,
                title,
                content: todoItem.text,
                fileName,
                chunk,
                index,
                ...extraDetails,
              };
            })
          );
        })
      );
    })
  );
};
