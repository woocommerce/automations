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
		},
		pulls: {
			get: jest.fn( () => loadDiff( 'basic' ) ).mockName( 'pulls.get' ),
		},
	};
};

exports.gimmeApp = ( appType ) => {
	const app = require( `../lib/automations/${ appType }` );
	return app.runner;
};
