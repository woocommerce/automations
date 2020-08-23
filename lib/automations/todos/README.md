## Todo automation

This automation parses for `@todo` or `@TODO` comments in code and adds formatted pull request comments for each todo found. When a pull request is merged to the main branch, issues will be created for each `@todo` in the diff if there is not already an issue for that todo.

Currently the `@todos` will be recognized:

- if in comment blocks begun with `//`
- in comment blocks contained within `/* */` or `/** */`

## Usage

To implement this action, include it in your workflow configuration file:

```yaml
on:
  pull_request:
    types: [opened,synchronize,closed]
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
          # This can be a comma delimited list of automations to run, in this case we're just executing todos
          automations: todos
```

## API

### Inputs

- `github_token`: Required. GitHub API token to use for making API requests. You can use the default `secrets.GITHUB_TOKEN` used by GitHub actions or store a different one in the secrets configuration of your GitHub repository.
- `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.

### Outputs

_None._
