/**
 * @typedef {import('@actions/github/').GitHub} GitHub
 * @typedef {import('@actions/github/').context} GitHubContext
 * @typedef {import('leasot/dist/definitions').TodoComment} TodoComment
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
 * @property {string} username
 * @property {string} sha
 * @property {number} number
 * @property {string} range
 */

/**
 * @typedef FileBoundaries
 *
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef TodoItem
 *
 * @property {string}    keyword  The keyword matched for the todo.
 * @property {string}    title    The title for the todo item. Usually the first sentence.
 * @property {string}    content  The todo content. Might match the title.
 * @property {string}    fileName The file the todo content was found in.
 * @property {DiffChunk} chunk    The chunk the todo content was found in.
 * @property {number}    index    The index of the chunk in the diff
 * @property {string}    username The user.login of the user making the commit.
 * @property {string}    sha      The sha for the commit the chunk belongs to.
 * @property {string}    number   The pull request number the commit belongs to.
 * @property {string}    range    The line number range string for the commit blob.
 */

/**
 * @typedef  ReopenClosedData
 * @property {string} keyword
 * @property {string} sha
 * @property {string} fileName
 */

module.exports = {};
