## Releases automation

This automation handles automating various parts of a somewhat opinionated release process.

Currently:

- it reacts to the `create` (create branch) event (which is triggered when you [create a branch using the GitHub UI](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository#creating-a-branch)).
- if a created branch has the format `release/x.x.x` where `x.x.x` is the version being released...
  - automation will check if there's already a pull request created for this release branch and if yes then stop here. Otherwise...
  - will create a pull request using `.github/release-pull-request.md` or `.github/patch-release-pull-request.md` templates found in the project's repo or falling back to the templates in this action.
  - will generate and add the changelog for the release to the pull request description (using the configuration provided in the project's `.github/release-automation-config.json` file).
  - will generate a release checklist using the `.github/release-initial-checklist.md` or `.github/patch-initial-checklist.md` templates and add as a comment on the pull request for the branch.

## Usage

To implement this action, include it in your workflow configuration file:

```yaml
name: Release PUll Request Automation
on:
  create:
jobs:
  release-automation:
    runs-on: ubuntu-latest
    steps:
      # This is needed to make sure the created branch has a changeset. Otherwise the pull request
      # will not be created.
      - uses: actions/checkout@v2
        - run: |
          date > .release-artifact
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "generating changeset for pull request"
          rm .release-artifact
          git commit -am "generating changeset for pull request"
          git push
      - uses: woocommerce/automations@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          # This can be a comma delimited list of automations to run, in this case we're just executing release
          automations: release
```

### Customization

You can customize the output of various content in the pull request via adding templates with the given names to your project's `.github` folder.

#### Pull request description

The following templates are used for the pull request description:

| Template file name | Used when... |
| ------------------ | ------------ |
| `release-pull-request.md` | The release is not a patch release (i.e. `4.1.0`, or `3.2.0`, or `4.0.0`)
| `patch-pull-request.md` | The release is a patch release (i.e. `3.2.2` or `4.0.1`)

Templates utilize handlebars template format and will receive the following variables:

- `version`: Implemented by `{{version}}`. This will be replaced by the detected version from the release branch.
- `changelog`: Implemented by `{{changelog}}`. This will be replaced by the generated changelog.
- `devNoteItems`: Implemented by `{{devNoteItems}}`. This will be replaced by any changelog items designated as a dev note.

### Release checklist (added as a comment on the pull request)

The following templates are used for the release checklist added as a comment on the pull request.

| Template file name | Used when... |
| ------------------ | ------------ |
| `release-initial-checklist.md` | The release is not a patch release (i.e. `4.1.0`, or `3.2.0`, or `4.0.0`)
| `patch-initial-checklist.md` | The release is a patch release (i.e. `3.2.2` or `4.0.1`)

The same variables are available in these templates as were available in the pull request description templates.

### Automation configuration

The automation allows for configuration using a `release-automation-config.json` file found in your project's `.github` folder. If this file is not present then the fallback will be the [`default.json` configuration file](./config/default.json) used by this action.

The configuration file has the following properties:

**`labelTypeMap`** and `labelType

These will map label types to a heading for grouping the changelog. For instance if you prefix your issue types with `type:` (eg. `type: bug`), then you would give the `labelTypePrefix` a value of `type: ` and implement `bug` as a property in the `labelTypeMap`.

**`groupTitleOrder`**

This property is used to indicate the order you want the groups to be in. The value should be an array of Group names that correspond to the values in the `labelTypeMap` and in the order want for the headings to display in the changelog.

You can use the string `'undefined'` to indicate a slot that any unrecognized headings are to be inserted into.

**`rewordTerms`**

This is a map you can use to indicate to the changelog generator word replacements for strings in a changelog entry. For instance you might want to change instances of `e2e` to the full `end-to-end` string instead of shortform.

**`needsDevNoteLabel`**

This is a label your project uses to indicate pull requests that require some additional developer type documentation when publishing the release.

**`labelsToOmit`**

You can add any labels here that the changelog generator should use as a signal to omit the pull request from being included in the generated changelog.

## API

### Inputs

- `github_token`: Required. GitHub API token to use for making API requests. You can use the default `secrets.GITHUB_TOKEN` used by GitHub actions or store a different one in the secrets configuration of your GitHub repository.
- `automations`: Optional. You can include a comma-delimited list of specific automations you want to run if you don't want to use them all in a given workflow.

### Outputs

_None._
