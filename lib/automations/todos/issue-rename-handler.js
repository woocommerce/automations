/**
 * Internal dependencies
 */
const { titleChange } = require("./templates");
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
  const { issue, changes, sender } = context.payload;
  if (
    sender.login !== context.actor &&
    issue.user.login === context.actor &&
    changes.title
  ) {
    debug(
      `Renaming issue #${issue.number} in ${context.repo.owner}/${context.repo.repo}`
    );
    return Promise.all([
      octokit.issues.update({
        ...context.repo,
        issue_number: issue.number,
        title: changes.title.from,
      }),
      octokit.issue.createComment({
        ...context.repo,
        issue_number: issue.number,
        body: titleChange(),
      }),
    ]);
  }
};
