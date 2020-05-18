const getTodos = require( '../get-todos' );
const { loadDiff } = require( '@testHelpers' );

describe( 'getTodos', () => {
	let context, octokit;
	beforeEach( () => {
		context = {
			eventName: 'push',
			payload: require( '@testFixtures/payloads/push.json' ),
			repo: {
				owner: 'nerrad',
				repo: 'todo',
			},
		};
		octokit = {
			repos: {
				getCommit: jest
					.fn( () => loadDiff( 'basic' ) )
					.mockName( 'repos.getCommit' ),
			},
		};
	} );
	it( 'returns nothing if there is only whitespace for the todos', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'title-with-whitespace' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 0 );
	} );
	it( 'returns nothing if the todo exists outside of a comment block', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'todo-variable' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 0 );
	} );
	it( 'does not consider a string having a todo if the keyword is in the middle of a sentence', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'middle-of-sentence' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'The beginning of the todo and this is a sentence with a todo in the middle of it.'
		);
	} );
	it( "Returns the expected title for a multiline todo where the sentence doesn't end on the first line.", async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'multiline-title' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'This is a todo that spreads its title across multi-lines. This is the body of the todo.'
		);
		expect( todos[ 0 ].title ).toEqual(
			'This is a todo that spreads its title across multi-lines.'
		);
	} );
	it( 'Returns the expected sentence when there is no sentence stop in the returned entire todo', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'title-with-no-sentence' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'This is a todo that has no sentence stop'
		);
		expect( todos[ 0 ].title ).toEqual(
			'This is a todo that has no sentence stop'
		);
	} );
	it( 'Returns the expected sentence when the todo goes over 60 chars', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'title-with-sentence-over-60-chars' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'This is a title that is over 60 characters and it is not multi-line nope. But it does have some other body content.'
		);
		expect( todos[ 0 ].title ).toEqual(
			'This is a title that is over 60 characters and it is not ...'
		);
	} );
	it( 'Returns the expected title when the sentence stop is on the same line as a multi-line todo', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'title-with-sentence-stop-on-line' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'I am an example title. And this is the body that continues on the next line.'
		);
		expect( todos[ 0 ].title ).toEqual( 'I am an example title.' );
	} );
	it( 'Returns the expected title when the sentence stop is a colon.', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'title-with-colon-as-sentence-stop' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'I am an example title: and this is the body that continues on the next line.'
		);
		expect( todos[ 0 ].title ).toEqual( 'I am an example title:' );
	} );
	it( 'Returns the expected todos for multiple todos across chunks.', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'many' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 5 );
		expect( todos[ 0 ].content ).toEqual( 'Title number 1 multiline' );
		expect( todos[ 3 ].content ).toEqual(
			'Title number 4 This is some other sentence with todo in it.'
		);
	} );
	it( 'Returns the expected multiline todo when there is a param breaking things up.', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve( loadDiff( 'multiline-broken-up' ) )
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 4 );
		expect( todos[ 0 ].content ).toEqual(
			'This is a todo with some multi-line text.'
		);
		expect( todos[ 1 ].content ).toEqual(
			'This is another todo that has some text.'
		);
		expect( todos[ 2 ].content ).toEqual(
			'this is a todo with some multi-line text.'
		);
		expect( todos[ 3 ].content ).toEqual(
			'Another todo that has some text.'
		);
	} );
	it( 'handles multi-line todo with a list (using dashes) in the content.', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve(
				loadDiff( 'multi-line-with-list-as-dash-handling' )
			)
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'I am an example title:\n- This is a dash\n- This is another dash\n- And a third dash.\nAnd this is done.'
		);
	} );
	it( 'preserves blank lines in comment blocks across multiline todos', async () => {
		octokit.repos.getCommit.mockReturnValue(
			Promise.resolve(
				loadDiff( 'todo-with-multiline-including-blank-lines' )
			)
		);
		const todos = await getTodos( context, octokit );
		expect( todos ).toHaveLength( 1 );
		expect( todos[ 0 ].content ).toEqual(
			'This is a todo that spreads its title across multi-lines.\n\nThis is the body of the todo.'
		);
	} );
} );
