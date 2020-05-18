const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	loadDiff,
} = require( '@testHelpers' );
const { reset } = require( '../utils/check-for-duplicate-issue' );

describe( 'push-handler', () => {
	let octokit, context, app;

	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'push' );
		app = gimmeApp( 'todos' );
		reset();
	} );

	it( 'creates an issue', async () => {
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.create.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	it( 'creates an issue with a @todo comment', async () => {
		octokit.repos.getCommit.mockReturnValue( loadDiff( 'at-todo' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.create.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	it( 'creates an issue with a truncated title', async () => {
		octokit.repos.getCommit.mockReturnValue( loadDiff( 'long-title' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.create.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	it( 'does not create any issues if no todos are found', async () => {
		octokit.repos.getCommit.mockReturnValue( loadDiff( 'none' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
	it( 'does not create any issues if the push is not on the default branch', async () => {
		context.payload = { ...context.payload, ref: 'not-master' };
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
	it( 'does not create the same issue twice in the same run', async () => {
		octokit.repos.getCommit.mockReturnValue( loadDiff( 'duplicate' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'creates an issue if the search does not have an issue with the correct title', async () => {
		octokit.search.issuesAndPullRequests.mockReturnValueOnce(
			Promise.resolve( {
				data: {
					total_count: 1,
					items: [ { title: 'Not found', state: 'open' } ],
				},
			} )
		);
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 1 );
	} );
	it( 'creates many (5) issues', async () => {
		octokit.repos.getCommit.mockReturnValue( loadDiff( 'many' ) );
		await app( context, octokit );
		expect( octokit.issues.create ).toHaveBeenCalledTimes( 5 );
		expect( octokit.issues.create.mock.calls ).toMatchSnapshot();
	} );
	it( 'ignores pushes not to master', async () => {
		context.payload = { ...context.payload, ref: 'not/the/master/branch' };
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
	it( 'ignores merge commits', async () => {
		octokit.git.getCommit.mockReturnValueOnce(
			Promise.resolve( {
				data: { parents: [ 1, 2 ] },
			} )
		);
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
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
	it( 'does nothing with a diff over the max size', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( { headers: { 'content-length': 2000001 } } )
		);
		await app( context, octokit );
		expect( octokit.issues.create ).not.toHaveBeenCalled();
	} );
} );
