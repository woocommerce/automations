## Update Milestone Automation

When a release is completed, this automation will update the due date of its milestone to current date.

## Usage

To implement this action, include it in your workflow configuration file:

```yaml
on:
    release:
        types: [published]
jobs:
    tag:
        name: New Release
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v3
            - name: 'Get Previous tag'
              id: previoustag
              uses: "WyriHaximus/github-action-get-previous-tag@v1"
            - name: Set milestone due date
              uses: woocommerce/automations@v1
              with:
                github_token: ${{ secrets.GITHUB_TOKEN }}
                automations: update-milestone
                target_milestone: ${{ steps.previoustag.outputs.tag }}
```

## API

### Inputs

- `github_token`: Required. GitHub API token to use for making API requests. You can use the default `secrets.GITHUB_TOKEN` used by GitHub actions or store a different one in the secrets configuration of your GitHub repository.
- `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.
- `target_milestone`: Optional. For the update-milestone workflow, this controls which milestone due date needs to be updated.

### Outputs

_None._
