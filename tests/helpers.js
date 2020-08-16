const fs = require( 'fs' );
const path = require( 'path' );

const loadDiff = ( exports.loadDiff = ( filename ) => {
	return Promise.resolve( {
		data: fs.readFileSync(
			path.join( __dirname, 'fixtures', 'diffs', filename + '.txt' ),
			'utf8'
		),
		headers: { 'content-length': 1 },
	} );
} );

exports.gimmeContext = ( eventName, action ) => {
	class ContextMock {
		constructor() {
			this.action = action;
			this.eventName = eventName;
			this.payload = this.getPayload();
			this.ref = 'release';
			this.sha = '6c2373ad036d292f7e9467981ba8b467e8b8b0ff';
			this.actor = 'nerrad';
			this.workflow = '';
		}
		get issue() {
			return {
				owner: 'nerrad',
				repo: 'tests',
				number: 10,
			};
		}

		get repo() {
			return { owner: 'nerrad', repo: 'tests' };
		}

		getPayload() {
			const filename =
				typeof this.action !== 'undefined'
					? `${ eventName }.${ action }.json`
					: `${ eventName }.json`;
			return require( `./fixtures/payloads/${ filename }` );
		}
	}
	return new ContextMock();
};

exports.gimmeOctokit = () => {
	return {
		issues: {
			update: jest.fn().mockName( 'issues.update' ),
			createComment: jest.fn().mockName( 'issues.createComment' ),
			listComments: jest
				.fn( () => Promise.resolve( { data: [] } ) )
				.mockName( 'issues.listComments' ),
			create: jest
				.fn( ( data ) => Promise.resolve( { data } ) )
				.mockName( 'issues.create' ),
			listMilestonesForRepo: {
				endpoint: {
					merge: jest
						.fn( () => ( {
							type: 'list.milestones',
						} ) )
						.mockName(
							'issues.listMilestonesForRepo.endpoint.merge'
						),
				},
			},
			listForRepo: {
				endpoint: {
					merge: jest
						.fn( () => ( {
							type: 'list.issues',
						} ) )
						.mockName( 'issues.listForRepo.endpoint.merge' ),
				},
			},
		},
		git: {
			getCommit: jest
				.fn( () => Promise.resolve( { data: { parents: [ 1 ] } } ) )
				.mockName( 'git.getCommit' ),
		},
		search: {
			issuesAndPullRequests: jest
				.fn( () =>
					Promise.resolve( { data: { total_count: 0, items: [] } } )
				)
				.mockName( 'search.issuesAndPullRequests' ),
		},
		repos: {
			getCommit: jest
				.fn( () => loadDiff( 'basic' ) )
				.mockName( 'repos.getCommit' ),
			getContents: jest
				.fn( () => Promise.resolve( { content: '' } ) )
				.mockName( 'repos.getContents' ),
		},
		pulls: {
			get: jest.fn( () => loadDiff( 'basic' ) ).mockName( 'pulls.get' ),
			create: jest
				.fn( () => Promise.resolve( { number: 1235 } ) )
				.mockName( 'pulls.create' ),
		},
		paginate: {
			iterator: jest
				.fn( ( options ) => {
					switch ( options.type ) {
						case 'list.milestones':
							return mockedAsyncIterator( [
								{ data: [ { title: '3.0.0', number: 1234 } ] },
							] )();
						case 'list.issues':
							return mockedAsyncIterator( [
								{
									data: require( './fixtures/payloads/issues-list.json' ),
								},
							] )();
					}
					return mockedAsyncIterator( {} )();
				} )
				.mockName( 'paginate.iterator' ),
		},
	};
};

const mockedAsyncIterator = ( resolvedValue ) =>
	async function* iterable() {
		const values = await Promise.resolve( resolvedValue );
		for ( const value of values ) {
			yield value;
		}
	};

exports.gimmeConfig = ( appType ) => {
	const app = require( `../lib/automations/${ appType }` );
	return app.getConfig();
};

exports.gimmeApp = ( appType ) => {
	const app = require( `../lib/automations/${ appType }` );
	return app.runner;
};
