/**
 * Internal dependencies
 */
const { comment } = require("./templates");
const { lineBreak } = require("./utils/helpers");
const getTodos = require("./utils/get-todos");
const debug = require("../../debug");

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async (context, octokit) => {
  const pullNumber = context.payload.number;
  const { data: comments } = await octokit.issues.listComments({
    ...context.repo,
    issue_number: pullNumber,
  });

  /**
   * @type {TodoItem[]}
   */
  const todos = await getTodos(context, octokit);
  todos.forEach(
    ({ keyword, title, content, fileName, range, sha, username, number }) => {
      // Does PR already have a comment for this item?
      if (comments.some((comment) => comment.body.startsWith(`## ${title}`))) {
        debug(`Comment with title [${title}] already exists`);
        return;
      }
      let body = comment({
        ...context.repo,
        body: content,
        sha,
        username: `cc @${username}`,
        number,
        range,
        fileName,
        keyword,
      });
      body = lineBreak(body);
      const { owner, repo } = context.repo;
      debug(`Creating comment [${title}] in [${owner}/${repo}#${number}]`);
      octokit.issues.createComment({
        ...context.repo,
        issue_number: pullNumber,
        body,
      });
    }
  );
};
