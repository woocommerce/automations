/**
 * Automation Task Runner
 *
 * @typedef {(payload:any,octokit:Github)=>void} AutomationTaskRunner
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

// @todo Finish the todo task runner here and export the configuration.

module.exports = {};
