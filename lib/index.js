/**
 * External dependencies
 */
const { setFailed, getInput } = require("@actions/core");
const { context, GitHub } = require("@actions/github");

/**
 * Internal dependencies
 */
const debug = require("./debug");
const ifNotFork = require("./if-not-fork");
const automations = require("./automations");

/**
 * @typedef {import('./typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

// @todo Need to add tests for the various submodules in here.
// Testing a multiline todo comment
// to see how this works.

(async function initialize() {
  const token = getInput("github_token");
  const types = getInput("automations").split(",");

  debug(`The types value is ${types}`);

  if (types && !Array.isArray(types)) {
    setFailed(
      "initialize: The provided `automations` configuration object must be a list."
    );
    return;
  }
  if (!token) {
    setFailed("initialize: Input `github_token` is required");
    return;
  }

  const octokit = new GitHub(token);

  debug(
    `initialize: Received event = '${context.eventName}', action = '${context.payload.action}'`
  );

  for (const { name, events, actions, runner } of automations) {
    if (
      events.includes(context.eventName) &&
      (actions === undefined || actions.includes(context.payload.action))
    ) {
      try {
        debug(`initialize: Starting runner ${name}`);
        /**
         * @type {AutomationTaskRunner}
         */
        const task = ifNotFork(runner);
        await task(context, octokit);
      } catch (error) {
        setFailed(`initialize: Runner ${name} failed with error: ${error}`);
      }
    }
  }

  debug("initialize: All done!");
})();
