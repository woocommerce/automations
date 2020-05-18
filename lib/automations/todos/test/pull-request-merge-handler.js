const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	loadDiff,
} = require( '@testHelpers' );
const { reset } = require( '../utils/check-for-duplicate-issue' );

describe( 'pull-request-merged-handler', () => {
	let octokit, context, app;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'pull_request', 'closed' );
		app = gimmeApp( 'todos' );
		reset();
	} );
	it( 'does nothing on an unmerged, closed PR', async () => {
		context.payload = {
			...context.payload,
			pull_request: { merged: false },
		};
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
	it( 'creates an issue', async () => {
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.create.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	it( 'creates an issue with a truncated title', async () => {
		octokit.pulls.get.mockReturnValue( loadDiff( 'long-title' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.create.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	it( 'does not create any issues if no todos are found', async () => {
		octokit.pulls.get.mockReturnValue( loadDiff( 'none' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
	it( 'does not create an issue that already exists', async () => {
		octokit.search.issuesAndPullRequests.mockReturnValueOnce(
			Promise.resolve( {
				data: {
					total_count: 1,
					items: [
						{ title: 'I am an example title', state: 'open' },
					],
				},
			} )
		);
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
	it( 'creates many (5) issues', async () => {
		octokit.pulls.get.mockReturnValue( loadDiff( 'many' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 5 );
	} );
	it( 'reopens a closed issue', async () => {
		octokit.search.issuesAndPullRequests.mockReturnValueOnce(
			Promise.resolve( {
				data: {
					total_count: 1,
					items: [
						{
							number: 1,
							title: 'I am an example title',
							state: 'closed',
						},
					],
				},
			} )
		);
		await app( context, octokit );
		expect( octokit.issues.update ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.createComment ).toHaveBeenCalledTimes( 1 );
		expect(
			octokit.issues.createComment.mock.calls[ 0 ]
		).toMatchSnapshot();
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
} );
