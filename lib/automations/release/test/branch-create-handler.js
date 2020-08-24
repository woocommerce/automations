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
	it( 'bails if pull branch is not a release branch', async () => {
		context.payload = { ...context.payload, ref: 'not-a-release-branch' };
		await app( context, octokit, config );
		expect( octokit.search.issuesAndPullRequests ).not.toHaveBeenCalled();
	} );
	describe( 'bails if pull request already exists for branch (various version strings)', () => {
		it.each`
			version
			${'3'}
			${'3.0'}
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
	} );
} );
