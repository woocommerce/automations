const getReleaseBranch = require( '../get-release-branch' );
const payload = require( '@testFixtures/payloads/create.json' );

describe( 'testing get release branch for given patch version', () => {
	let context, octokit;

	beforeEach( () => {
		context = { payload };
		octokit = {
			repos: {
				getBranch: jest.fn( () => {
					return Promise.resolve( {
						name: 'release/3.0',
					} );
				} ),
			},
		};
	} );

	it( 'returns false if branch is not found', async () => {
		const mock = { message: 'Not Found' };
		octokit.repos.getBranch.mockReturnValue( mock );
		const response = await getReleaseBranch( '3.0', context, octokit );
		expect( response ).toBe( false );
	} );
	it( 'returns branch name when a matching release branch for the exact patch version is found', async () => {
		const response = await getReleaseBranch( '3.0', context, octokit );
		expect( response ).toBe( 'release/3.0' );
	} );
	it( 'returns branch name when a matching release branch for the initial patch version is found', async () => {
		const mock = { name: 'release/3.0.0' };
		octokit.repos.getBranch.mockReturnValue( mock );
		const response = await getReleaseBranch( '3.0', context, octokit );
		expect( response ).toBe( 'release/3.0.0' );
	} );
} );
