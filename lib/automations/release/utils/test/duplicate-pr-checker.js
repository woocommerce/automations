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
				issuesAndPullRequests: jest.fn( () => {
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
	it( 'returns true if a duplicate is found in existing pulls', async () => {
		// add the pull
		const mock = {
			data: {
				total_count: 1,
				items: [ { title: 'hello', merged: false } ],
			},
		};
		octokit.search.issuesAndPullRequests.mockReturnValue( mock );
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( true );
	} );
	it( 'returns true if the pr is closed, matches the title and is not merged', async () => {
		// mocked pull
		const mock = {
			data: {
				total_count: 1,
				items: [
					{
						title: 'hello',
						merged: false,
						state: 'closed',
					},
				],
			},
		};
		octokit.search.issuesAndPullRequests.mockReturnValue( mock );
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( true );
	} );
	it( 'returns false if the pr is closed, matches the title, and is merged', async () => {
		// mocked pull
		const mock = {
			data: {
				total_count: 1,
				items: [
					{
						title: 'hello',
						merged: true,
						state: 'closed',
					},
				],
			},
		};
		octokit.search.issuesAndPullRequests.mockReturnValue( mock );
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( false );
	} );
	it( 'returns false if any of the matching prs is closed, matches the title, and is merged', async () => {
		// mocked pull
		const mock = {
			data: {
				total_count: 1,
				items: [
					{
						title: 'hello',
						merged: false,
						state: 'closed',
					},
					{
						title: 'hello',
						merged: true,
						state: 'closed',
					},
				],
			},
		};
		octokit.search.issuesAndPullRequests.mockReturnValue( mock );
		const actual = await duplicateChecker( context, octokit, 'hello' );
		expect( actual ).toBe( false );
	} );
} );
