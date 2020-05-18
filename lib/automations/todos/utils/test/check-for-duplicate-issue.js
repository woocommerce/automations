const {
	duplicateChecker: checkForDuplicateIssue,
	reset,
} = require( '../check-for-duplicate-issue' );
const payload = require( '@testFixtures/payloads/push.json' );

describe( 'check-for-duplicate-issue', () => {
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
		reset();
	} );

	it( 'returns undefined if no duplicate issue is found', async () => {
		const actual = await checkForDuplicateIssue(
			context,
			octokit,
			'hello'
		);
		expect( actual ).toBe( undefined );
	} );

	it( 'returns the issue if a duplicate issue is found in existing tracked todos', async () => {
		// add the issue to the tracker
		let mock = { data: { total_count: 1, items: [ 'hello' ] } };
		octokit.search.issuesAndPullRequests.mockReturnValueOnce( mock );
		await checkForDuplicateIssue( context, octokit, 'hello' );
		// verify it gets returned form the tracker (should be just a string, not an object).
		mock = { data: { total_count: 1, items: [ { title: 'hello' } ] } };
		octokit.search.issuesAndPullRequests.mockReturnValueOnce( mock );
		const actual = await checkForDuplicateIssue(
			context,
			octokit,
			'hello'
		);
		expect( actual ).toBe( 'hello' );
	} );

	it( 'returns the issue if a duplicate issue is found by searching', async () => {
		const mock = {
			data: { total_count: 1, items: [ { title: 'hello' } ] },
		};
		octokit.search.issuesAndPullRequests.mockReturnValueOnce( mock );
		const actual = await checkForDuplicateIssue(
			context,
			octokit,
			'hello'
		);
		expect( actual ).toEqual( mock.data.items[ 0 ] );
	} );
} );
