/**
 * Internal dependencies
 */
const { reopenClosed } = require("../templates");

/**
 * @typedef {import('../../../typedefs').ReopenClosedData} ReopenClosedData
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

/**
 * Reopen a closed issue and post a comment saying what happened and why
 * @param {object} params
 * @param {GitHubContext} params.context
 * @param {GitHub} params.octokit
 * @param {object} params.config
 * @param {object} params.issue
 * @param {ReopenClosedData} data
 *
 * @return {object} Github comment object.
 */
module.exports = async ({ context, octokit, config = {}, issue }, data) => {
  const { reOpenClosed: reOpenIssue = true } = config;
  if (typeof issue !== "object") {
    return;
  }
  if (issue.state === "closed" && reOpenIssue) {
    await octokit.issues.update({
      ...context.repo,
      issue_number: issue.number,
      state: "open",
    });

    const body = reopenClosed({
      ...context.repo,
      ...data,
    });
    return octokit.issues.createComment({
      ...context.repo,
      issue_number: issue.number,
      body,
    });
  }
};
