const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	gimmeConfig,
} = require( '@testHelpers' );

describe( 'branch-create-handler for release pull request generation', () => {
	let octokit, context, app, config;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'create' );
		config = gimmeConfig( 'release' );
		app = gimmeApp( 'release' );
	} );
	it( 'creates a pull request', async () => {
		await app( context, octokit, config );
		expect( octokit.search.issuesAndPullRequests ).toHaveBeenCalled();
		expect( octokit.repos.getContents ).toHaveBeenCalled();
		expect(
			octokit.issues.listMilestonesForRepo.endpoint.merge
		).toHaveBeenCalled();
		expect( octokit.paginate.iterator ).toHaveBeenCalled();
		expect( octokit.issues.listForRepo.endpoint.merge ).toHaveBeenCalled();
		expect( octokit.paginate.iterator ).toHaveBeenCalled();
		expect( octokit.pulls.create ).toHaveBeenCalled();
		expect( octokit.issues.createComment ).toHaveBeenCalled();
		expect( octokit.pulls.create.mock.calls[ 0 ] ).toMatchSnapshot();
		expect(
			octokit.issues.createComment.mock.calls[ 0 ]
		).toMatchSnapshot();
	} );
	// if pull request already exists for branch, bail
} );
