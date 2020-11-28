The release pull request has been created! This checklist is a guide to follow for the remainder of the release process. You can check off each item in this list once completed.

## Checklist

* [ ] Make sure this branch has the latest built version of the automation. In the commit log there should be a commit with "Update built file" as the message and no other commits affecting source files after it. Builds are automatically created on merges to trunk.
* [ ] Make sure any necessary README.md updates are up-to-date.
* [ ] Update the version in `package.json` and `package-lock.json` for this release. Commit and push.
* [ ] Create a GitHub release based off of this branch and tag `v{{version}}`
* [ ] Delete related major version branch only tag used for GitHub actions (for example if you released `v1.0.1` then the major version is `v1`) and create a new tag using this version. This ensures repos using this action will always get the latest build in that major version branch.
* [ ] Squash merge this pull into trunk.
