const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	loadDiff,
} = require( '@testHelpers' );

describe( 'pull-request-handler', () => {
	let octokit, context, app;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'pull_request', 'opened' );
		app = gimmeApp( 'todos' );
	} );
	it( 'comments on a pull request', async () => {
		await app( context, octokit );
		expect( octokit.issues.listComments ).toHaveBeenCalledTimes( 1 );
		expect( octokit.issues.createComment ).toHaveBeenCalledTimes( 1 );
		expect(
			octokit.issues.createComment.mock.calls[ 0 ]
		).toMatchSnapshot();
	} );
	it( 'does not create duplicate comments', async () => {
		octokit.issues.listComments.mockReturnValueOnce(
			Promise.resolve( {
				data: [
					{
						body: '## I am an example title',
					},
				],
			} )
		);
		await app( context, octokit );
		expect( octokit.issues.createComment ).not.toHaveBeenCalled();
	} );
	it( 'creates many (5) comments', async () => {
		octokit.pulls.get.mockReturnValue( loadDiff( 'many' ) );
		await app( context, octokit );
		expect( octokit.issues.createComment ).toHaveBeenCalledTimes( 5 );
	} );
} );
