const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	gimmeConfig,
} = require( '@testHelpers' );
const actions = require( '@actions/core' );

jest.mock( '@actions/core' );

describe( 'attach-changelog-new-release-handler for attach changelog to the release', () => {
	let octokit, context, app, config;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'release', 'published' );
		config = gimmeConfig( 'release' );
		app = gimmeApp( 'release' );
	} );
	it( 'attach changelog to release', async () => {
		octokit.pulls.get.mockReturnValueOnce(
			Promise.resolve( {
				data: require( '@testFixtures/payloads/pull_requests.json' )[ 0 ],
			} )
		);

		await app( context, octokit, config );
		expect( octokit.search.issuesAndPullRequests ).toHaveBeenCalled();
		expect( octokit.pulls.get ).toHaveBeenCalled();
		expect( octokit.repos.updateRelease ).toHaveBeenCalled();
	} );

	it( "failing job if release PR isn't found", async () => {
		octokit.search.issuesAndPullRequests.mockReturnValueOnce(
			Promise.resolve( {
				data: {
					items: [],
				},
			} )
		);
		const spy = actions.setFailed;

		await app( context, octokit, config );

		expect( octokit.search.issuesAndPullRequests ).toHaveBeenCalled();
		expect( spy ).toHaveBeenCalled();
	} );
} );
