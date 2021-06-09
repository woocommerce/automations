const { gimmeOctokit, gimmeContext, gimmeApp } = require('@testHelpers');

describe('pull-request-review-handler assigns milestones to pull requests', () => {
	let octokit, context, app;
	beforeEach(() => {
		octokit = gimmeOctokit();
		context = gimmeContext('pull_request_review', 'submitted');
		app = gimmeApp('assign-milestone');
	});
	it('does nothing if the pull request is not approved', async () => {
		context.payload = {
			...context.payload,
			review: { state: 'comment' },
		};
		await app(context, octokit);
		expect(octokit.issues.update).not.toHaveBeenCalled();
	});
	it('does nothing if the pull request has a milestone', async () => {
		context.payload = {
			...context.payload,
			pull_request: { milestone: { number: 1 } },
		};
		await app(context, octokit);
		expect(octokit.issues.update).not.toHaveBeenCalled();
	});
	it('assigns a milestone to an approved pull request', async () => {
		await app(context, octokit);

		octokit.issues.listMilestones.mockReturnValue(
			Promise.resolve({
				data: [
					{
						number: 3,
					},
					{
						number: 4,
					},
				],
			})
		);

		expect(octokit.issues.listMilestones).toHaveBeenCalled();
		expect(octokit.issues.update).toHaveBeenCalled();
		expect(octokit.issues.update.mock.calls[0]).toMatchSnapshot();
	});
});
