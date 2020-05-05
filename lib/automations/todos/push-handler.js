/**
 * Internal dependencies
 */
const checkForDuplicateIssue = require("./utils/check-for-duplicate-issue");
const { lineBreak, truncate } = require("./utils/helpers");
const reopenClosed = require("./templates");
const { issue } = require("./templates");
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
  // Only trigger on pushes to master
  if (
    context.payload.ref !==
    `refs/heads/${context.payload.repository.master_branch}`
  ) {
    return;
  }

  // Do not trigger on merge commits
  const commit = await octokit.git.getCommit({
    ...context.repo,
    commit_sha: context.payload.head_commit.id,
  });
  if (commit.data.parents.length > 1) {
    return;
  }

  /**
   * @type {TodoItem[]}
   */
  const todos = await getTodos(context, octokit);
  todos.forEach(
    async ({ keyword, title, content, fileName, range, sha, username }) => {
      // Prevent duplicates
      const existingIssue = await checkForDuplicateIssue(context, title);
      if (existingIssue) {
        debug(`Duplicate issue found with title [${title}]`);
        return reopenClosed(
          { context, octokit, issue: existingIssue },
          { keyword, sha, fileName }
        );
      }
      // Actually create the issue
      const body = lineBreak(
        issue({
          ...context.repo,
          sha,
          username,
          range,
          filename,
          keyword,
          body: content,
        })
      );

      const { owner, repo } = context.repo;
      debug(`Creating issue [${title}] in [${owner}/${repo}]`);
      return octokit.issues.create({
        ...context.repo,
        title: truncate(title),
        body,
      });
    }
  );
};
