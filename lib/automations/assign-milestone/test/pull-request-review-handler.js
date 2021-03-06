const { gimmeOctokit, gimmeContext, gimmeApp } = require( '@testHelpers' );

describe( 'pull-request-review-handler assigns milestone', () => {
	let octokit, context, app;
	beforeEach( () => {
		octokit = gimmeOctokit();
		context = gimmeContext( 'pull_request_review', 'submitted' );
		app = gimmeApp( 'assign-milestone' );
	} );
	it( 'does nothing if the pull request is not approved', async () => {
		context.payload = {
			...context.payload,
			review: { state: 'comment' },
		};
		await app( context, octokit, {
			bumpStrategy: 'minor',
		} );
		expect( octokit.issues.update ).not.toHaveBeenCalled();
	} );
	it( 'does nothing if the pull request has a milestone', async () => {
		context.payload = {
			...context.payload,
			pull_request: { milestone: { number: 1 } },
		};
		await app( context, octokit, {
			bumpStrategy: 'minor',
		} );
		expect( octokit.issues.update ).not.toHaveBeenCalled();
	} );
	it( 'assigns a milestone to an approved pull request', async () => {
		octokit.repos.getContent.mockReturnValueOnce(
			Promise.resolve( {
				data: {
					content: Buffer.from(
						JSON.stringify( {
							version: '3.0.0',
						} )
					).toString( 'base64' ),
					encoding: 'base64',
				},
			} )
		);
		await app( context, octokit, {
			bumpStrategy: 'minor',
		} );
		expect( octokit.repos.getContent ).toHaveBeenCalled();
		expect(
			octokit.issues.listMilestones.endpoint.merge
		).toHaveBeenCalled();
		expect( octokit.issues.update ).toHaveBeenCalled();
		expect( octokit.issues.update.mock.calls[ 0 ] ).toMatchSnapshot();
	} );
	describe( 'based on bumpStrategy', () => {
		beforeEach( () => {
			octokit.repos.getContent.mockReturnValueOnce(
				Promise.resolve( {
					data: {
						content: Buffer.from(
							JSON.stringify( {
								version: '3.0.0',
							} )
						).toString( 'base64' ),
						encoding: 'base64',
					},
				} )
			);
		} );
		it( 'none', async () => {
			await app( context, octokit, {
				bumpStrategy: 'none',
			} );
			expect( octokit.issues.update ).toHaveBeenCalled();
			expect( octokit.issues.update.mock.calls[ 0 ] ).toMatchSnapshot();
		} );
		it( 'patch', async () => {
			await app( context, octokit, {
				bumpStrategy: 'patch',
			} );
			expect( octokit.issues.update ).toHaveBeenCalled();
			expect( octokit.issues.update.mock.calls[ 0 ] ).toMatchSnapshot();
		} );
		it( 'minor', async () => {
			await app( context, octokit, {
				bumpStrategy: 'minor',
			} );
			expect( octokit.issues.update ).toHaveBeenCalled();
			expect( octokit.issues.update.mock.calls[ 0 ] ).toMatchSnapshot();
		} );
		it( 'major', async () => {
			await app( context, octokit, {
				bumpStrategy: 'major',
			} );
			expect( octokit.issues.update ).toHaveBeenCalled();
			expect( octokit.issues.update.mock.calls[ 0 ] ).toMatchSnapshot();
		} );
	} );
} );
