const {
	gimmeOctokit,
	gimmeContext,
	gimmeApp,
	gimmeConfig,
} = require( '@testHelpers' );
<<<<<<< Updated upstream

describe( 'branch-create-handler for release pull request generation', () => {
	let octokit, context, app, config;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'create' );
		config = gimmeConfig( 'release' );
		app = gimmeApp( 'release' );
	} );
	it( 'creates a pull request with changelog', async () => {
		await app( context, octokit, config );
		expect( octokit.search.issuesAndPullRequests ).toHaveBeenCalled();
		expect( octokit.repos.getContent ).toHaveBeenCalled();
		expect(
			octokit.issues.listMilestones.endpoint.merge
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
	it( 'bails if pull branch is not a release branch', async () => {
		context.payload = { ...context.payload, ref: 'not-a-release-branch' };
		await app( context, octokit, config );
		expect( octokit.search.issuesAndPullRequests ).not.toHaveBeenCalled();
	} );
	describe( 'bails if pull request already exists for branch (various version strings)', () => {
		it.each`
			version
			${ '3' }
			${ '3.0' }
		`(
			'bails when the release branch is "release/$version" and there is already a pull with "Release: 3.0.0" as the title',
			async () => {
				octokit.search.issuesAndPullRequests.mockReturnValueOnce(
					Promise.resolve( {
						data: {
							items: [
								{
									title: 'Release: 3.0.0',
								},
							],
						},
					} )
				);
				context.payload = { ...context.payload, ref: 'release/3.0' };
				await app( context, octokit, config );
				expect(
					octokit.search.issuesAndPullRequests
				).toHaveBeenCalled();
				expect( octokit.repos.getBranch ).not.toHaveBeenCalled();
			}
		);
	} );
	it( 'Bails if there is no milestone for the given release branch', async () => {
		context.payload = { ...context.payload, ref: 'release/4.2.1' };
		await app( context, octokit, config );
		expect( octokit.pulls.create.mock.calls[ 0 ] ).toMatchSnapshot();
		expect(
			octokit.issues.createComment.mock.calls[ 0 ]
		).toMatchSnapshot();
=======
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
>>>>>>> Stashed changes
	} );
} );
