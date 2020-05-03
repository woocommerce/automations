# Project management automation

> **Note:** Currently this is experimental while I learn Github actions.

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automations to assist with project management in a Github repository:

- `todos`: Parses for `@todo` or `@TODO` comments in code and adds as inline review comments for reviews on pull request, and creates issues for each one if they exist when a pull is merged.

# Installation and usage

To use the action, include it in your workflow configuration file:

```yaml
on: pull_request
jobs:
  pull-request-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: WordPress/gutenberg/packages/project-management-automation@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          automations: [ todos ]

```

# API

## Inputs

- `github_token`: Required. GitHub API token to use for making API requests. This should be stored as a secret in the GitHub repository.
- `automations`: Optional. You can include a list of specific automations you want to run if you don't want to use them all in a given workflow.

## Outputs

_None._

## Credits

Thanks to the work of the Gutenberg team (particularly @aduth) in providing some inspiration for this approach to bundling various automations together.
