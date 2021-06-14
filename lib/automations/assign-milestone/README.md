## Assign Milestone Automation

When a pull request is approved and is not already assigned a milestone, this automation will assign the next milestone to it
automatically.

The next milestone will be the next minor version, calculated from the current version in package.json. So for example, if the current version is 2.5.2, the milestone will be 2.6 (if it exists).

## Usage

To implement this action, include it in your workflow configuration file:

```yaml
on:
    pull_request:
        types: [opened, synchronize, closed]
    push:
    issues:
        types: [edited]
jobs:
    pull-request-automation:
        runs-on: ubuntu-latest
        steps:
            - uses: woocommerce/automations@v1
              with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
                  # This can be a comma delimited list of automations to run, in this case we're just executing assign-milestone
                  automations: assign-milestone
```

## API

### Inputs

-   `github_token`: Required. GitHub API token to use for making API requests. You can use the default `secrets.GITHUB_TOKEN` used by GitHub actions or store a different one in the secrets configuration of your GitHub repository.
-   `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.

### Outputs

_None._
