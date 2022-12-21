const { gimmeOctokit, gimmeContext, gimmeApp } = require( '@testHelpers' );

describe( 'Update milestone after successful release', () => {
	let octokit, context, app;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'release', 'published' );
		app = gimmeApp( 'update-milestone' );
	} );
	it( 'Does not updates the milestone if milestone not present', async () => {
		await app( context, octokit, {
			targetMilestone: '6.0.0',
		} );
		expect(
			octokit.issues.listMilestones.endpoint.merge
		).toHaveBeenCalled();
		expect( octokit.issues.updateMilestone ).not.toHaveBeenCalled();
	} );
	it( 'Does not updates the milestone if milestone have a due date', async () => {
		await app( context, octokit, {
			targetMilestone: '7.0.0',
		} );
		expect(
			octokit.issues.listMilestones.endpoint.merge
		).toHaveBeenCalled();
		expect( octokit.issues.updateMilestone ).not.toHaveBeenCalled();
	} );
	it( 'Updates the milestone if milestone is present and has no due date', async () => {
		await app( context, octokit, {
			targetMilestone: '5.0.0',
		} );
		expect(
			octokit.issues.listMilestones.endpoint.merge
		).toHaveBeenCalled();
		expect( octokit.issues.updateMilestone ).toHaveBeenCalled();
	} );
} );
