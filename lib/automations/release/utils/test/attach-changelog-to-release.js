const attachChangelogToRelease = require( '../attach-changelog-to-release' );
const releaseListPayload = require( '@testFixtures/payloads/release-list.json' );

describe( 'attachChangelogToRelease', () => {
	let context;

	beforeEach( () => {
		context = {
			repo: {
				owner: 'test-owner',
				repo: 'test-repo',
			},
		};
	} );

	it( 'should update the release by adding the changelog if there is a release', async () => {
		const octokit = {
			repos: {
				listReleases: jest
					.fn( () =>
						Promise.resolve( {
							data: releaseListPayload,
						} )
					)
					.mockName( 'repos.listReleases' ),
				updateRelease: jest
					.fn( () => Promise.resolve( {} ) )
					.mockName( 'repos.updateRelease' ),
			},
		};

		await attachChangelogToRelease( context, octokit );
		expect( octokit.repos.listReleases ).toHaveBeenCalled();
		expect( octokit.repos.updateRelease ).toHaveBeenCalled();
	} );
	it( "should not update the release if doesn't exists any release", async () => {
		const octokit = {
			repos: {
				listReleases: jest
					.fn( () =>
						Promise.resolve( {
							data: [],
						} )
					)
					.mockName( 'repos.listReleases' ),
				updateRelease: jest
					.fn( () => Promise.resolve( {} ) )
					.mockName( 'repos.updateRelease' ),
			},
		};

		await attachChangelogToRelease( context, octokit );
		expect( octokit.repos.listReleases ).toHaveBeenCalled();
	} );
} );
