# Project management automation

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automations to assist with project management in a Github repository.

## Available Automations

- `todos`: Parses for `@todo` or `@TODO` comments in code and adds as inline review comments for reviews on pull request, and creates issues for each one if they exist when a pull is merged.

## Installation and Usage

To use the action, include it in your workflow configuration file:

```yaml
on: pull_request
jobs:
  pull-request-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: woocommerce/automations@v1.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          # This can be a comma delimited list of automations to run, in this case we're just executing todos
          automations: todos

```

## API

### Inputs

- `github_token`: Required. GitHub API token to use for making API requests. This should be stored as a secret in the GitHub repository.
- `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.

### Outputs

_None._

## Contributing

This will be expanded, but for reference:

### Developing

- Clone the repo and then `npm install`.

### Builds and releases

- All pushes to master will automatically build the `dist/index.js` file for the action (then commit and push to master). So no need to worry about builds.
- For releases, make sure you update the examples in the `README.md` if releasing a major version, otherwise just create a release manually (in the future this may get automated for releases).

### Adding a new automation.

The design of this repository is setup so that automations can be their own discrete thing (eg. "todos") but still take advantage of various scaffolding and boilerplate when creating a new automation. The following is a rough list of steps to take to create and add a new automation:

- Create a new directory in `lib/automations` that is the name of your automation.
- Your `lib/automations` directory must at a minimum export the following from the `index.js` file in the directory:

```js
module.exports = {
  // the name of your automation
  name: 'my-automation',
  // what github action workflow events your automation reacts to.
  events: [ 'pull_request' ],
  // what github action workflow event actions your automation reacts to.
  actions: [ 'opened' ],
  // the runner for your automation.
  runner
}
```
- As noted above, this export must include a `runner` for your automation. The runner is an async function that will receive two arguments: `context` (which is the GitHub action context value) and `octokit` (which is the GitHub api helper). See more about these two arguments [here](https://github.com/actions/toolkit/tree/master/packages/github) (they are essentially what gets exposed by the `@actions/github` package). You can use the [`todos` runner as an example](https://github.com/nerrad/automations/blob/master/lib/automations/todos/runner.js).
- Finally, in [`lib/automations.js`](https://github.com/nerrad/automations/blob/master/lib/automations.js), makes sure you import your automation configuration into this file and add it to the `moduleNames` array. So for example, if your automation was setup in `lib/automations/my-automation`, you would have something like this in the file after your changes:

```js
  
const todos = require( './automations/todos' );
const myAutomation = require( './automations/my-automation' );

const moduleNames = [ todos, myAutomation ];

/**
 * @typedef {import('./typedefs').AutomationTask} AutomationTask
 */

/**
 * @type {AutomationTask[]}
 */
const automations = moduleNames.map( ( module ) => module );

module.exports = automations;
```

- make sure you list your automation name and a brief description of what it does in the **Available Automations** section of this readme file.

That's it!

Don't forget to add tests for your automation. There are various helpers available for mocking the `context` and `octokit` values (you can view the various todos automation tests for examples).


## Credits

- Thanks to the work of the [Gutenberg team](https://github.com/wordpress/gutenberg) (particularly [@aduth](https://github.com/aduth)) in providing some inspiration for this approach to bundling various automations together.
- The `todos` automation was inspired by this [todo probot app](https://github.com/JasonEtco/todo). Initial iterations of this action borrowed heavily from the ideas in this app.
