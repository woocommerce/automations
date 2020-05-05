/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 */

/**
 * Gets the commit using the diff header
 * @param {GitHubContext} context Github context helper.
 * @param {Github}        octokit        Github helper.
 *
 * @return {Object} The diff response
 */
async function getCommit(context, octokit) {
  if (context.eventName === "push") {
    return octokit.repos.getCommit({
      ...context.repo,
      ref: context.payload.head_commit.id,
      mediaType: {
        format: "diff",
      },
    });
  } else {
    return octokit.pulls.get({
      ...context.repo,
      pull_number: context.payload.number,
      mediaType: {
        format: "diff",
      },
    });
  }
}

/**
 * Gets the commit using the diff header
 * @param {GitHubContext} context Github context helper.
 * @param {Github}        octokit        Github helper.
 *
 * @return {string} The diff as a string.
 */
module.exports = async (context, octokit) => {
  const diff = await getCommit(context, octokit);
  return diff.data;
};
