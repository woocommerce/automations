const duplicateChecker = require( '../duplicate-pr-checker' );
const payload = require( '@testFixtures/payloads/create.json' );

describe( 'check-for-duplicate-pull', () => {
	let context, octokit;

	beforeEach( () => {
		context = {
			payload,
		};
		octokit = {
			search: {
				issuesAndPullRequests: jest.fn( ( query ) => {
					if ( query.q.includes( 'is:merged' ) ) {
						return Promise.resolve( {
							data: {
								items: [ { title: 'merged test' } ],
							},
						} );
					}
					if ( query.q.includes( 'is:unmerged' ) ) {
						return Promise.resolve( {
							data: {
								items: [ { title: 'unmerged test' } ],
							},
						} );
					}
					return Promise.resolve( {
						data: { total_count: 0, items: [] },
					} );
				} ),
			},
		};
	} );

	it( 'returns false if no duplicate pull request is found', async () => {
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( false );
	} );
	it( 'returns true if a duplicate is found in existing  open pulls', async () => {
		// add the pull
		const mock = {
			data: {
				total_count: 1,
				items: [ { title: 'hello' } ],
			},
		};
		octokit.search.issuesAndPullRequests.mockReturnValueOnce( mock );
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( true );
	} );
	it( 'returns false if the pr is closed, matches the title and is not merged', async () => {
		const actual = await duplicateChecker(
			context,
			octokit,
			'unmerged test'
		);
		expect( actual ).toBe( false );
	} );
	it( 'returns true if the pr is closed, matches the title, and is merged', async () => {
		// mocked pull
		const actual = await duplicateChecker(
			context,
			octokit,
			'merged test'
		);
		expect( actual ).toBe( true );
	} );
} );
