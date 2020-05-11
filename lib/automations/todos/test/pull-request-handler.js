const {
  gimmeOctokit,
  gimmeContext,
  gimmeApp,
  loadDiff,
} = require("@testHelpers");
const pullRequestOpened = require("@testFixtures/payloads/pull_request.opened.json");

describe("pull-request-handler", () => {
  let octokit, context, app;
  beforeEach(() => {
    octokit = gimmeOctokit();
    context = gimmeContext("pull_request", "opened");
    app = gimmeApp("todos");
  });
  it("comments on a pull request", async () => {
    await app(context, octokit);
    expect(octokit.issues.listComments).toHaveBeenCalledTimes(1);
    expect(octokit.issues.createComment).toHaveBeenCalledTimes(1);
    expect(octokit.issues.createComment.mock.calls[0]).toMatchSnapshot();
  });
});
