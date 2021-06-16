## Assign Milestone Automation

When a pull request is approved and is not already assigned a milestone, this automation will assign the next milestone to it
automatically.

The next milestone will be calculated from the current version in package.json. By default this will be the next minor version, but setting `milestone_bump_strategy` can change this:

-   `none` - Assign to the current major.minor version.
-   `patch` - Assign to the next patch version.
-   `minor` - Assign to the next minor version.
-   `major` - Assign to the next major version.

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
                  milestone_bump_strategy: none
```

## API

### Inputs

-   `github_token`: Required. GitHub API token to use for making API requests. You can use the default `secrets.GITHUB_TOKEN` used by GitHub actions or store a different one in the secrets configuration of your GitHub repository.
-   `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.
-   `milestone_bump_strategy`: Optional. For the assign-milestone workflow, this controls which milestone is selected.

### Outputs

_None._
