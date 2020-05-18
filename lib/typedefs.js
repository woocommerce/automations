/**
 * @typedef {import('@actions/github/').GitHub} GitHub
 * @typedef {import('@actions/github/').context} GitHubContext
 * @typedef {import('parse-diff').Change} DiffChange
 * @typedef {import('parse-diff').Chunk} DiffChunk
 */

/**
 * Automation Task Runner
 *
 * @typedef {(context: GitHubContext, octokit:GitHub)=>void} AutomationTaskRunner
 */

/**
 * Automation Task
 *
 * @typedef AutomationTask
 *
 * @property {string}               name      The name of the task
 * @property {Array<string>}        events    The events the task is triggered on.
 * @property {Array<string>}        [actions] The actions (for events) that the task responds to.
 * @property {AutomationTaskRunner} runner    The task runner.
 */

/**
 * @typedef TodoDetails
 *
 * @property {string} username The GitHub login for the user creating this todo.
 * @property {string} sha      The sha for the diff containing this todo.
 * @property {number} number   The pull request number for the diff containing this todo.
 * @property {string} range    The range values for the diffs containing this todo.
 */

/**
 * @typedef FileBoundaries
 *
 * @property {number} start Start of the file boundary.
 * @property {number} end   End of the file boundary.
 */

/**
 * @typedef TodoItem
 *
 * @property {string}    keyword  The keyword matched for the todo.
 * @property {string}    title    The title for the todo item. Usually the first sentence.
 * @property {string}    content  The todo content. Might match the title.
 * @property {string}    fileName The file the todo content was found in.
 * @property {DiffChunk} chunk    The chunk the todo content was found in.
 * @property {Array}     index    The index of the chunk in the diff.
 * @property {string}    username The user.login of the user making the commit.
 * @property {string}    sha      The sha for the commit the chunk belongs to.
 * @property {string}    number   The pull request number the commit belongs to.
 * @property {string}    range    The line number range string for the commit blob.
 */

/**
 * @typedef  ReopenClosedData
 * @property {string} keyword  The todo keyword used.
 * @property {string} sha      The sha for the affected commit.
 * @property {string} fileName The name of the file the todo is found in.
 */

module.exports = {};
