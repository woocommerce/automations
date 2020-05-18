const { gimmeOctokit, gimmeContext, gimmeApp } = require( '@testHelpers' );

describe( 'issue-rename-handler', () => {
	let octokit, context, app;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'issues', 'edited' );
		app = gimmeApp( 'todos' );
	} );
	it( 'un-edits the issue title', async () => {
		await app( context, octokit );
		expect( octokit.issues.update.mock.calls[ 0 ][ 0 ] ).toMatchSnapshot();
		expect(
			octokit.issues.createComment.mock.calls[ 0 ][ 0 ]
		).toMatchSnapshot();
	} );
	it( 'only acts if the title is edited', async () => {
		context.payload.changes = {};
		await app( context, octokit );
		expect( octokit.issues.update ).not.toHaveBeenCalled();
		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );
} );
