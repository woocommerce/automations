/**
 * Internal dependencies
 */
const getDetails = require( './get-details' );
const debug = require( '../../../debug' );

// local variables for parsing todos.
let inTodoBody = false;
let inListItem = false;
let todoBody = '';
let todos = [];
let line = null;
let lineCount = 0;
let index = null;

const fullReset = () => {
	inTodoBody = false;
	inListItem = false;
	todoBody = '';
	todos = [];
	lineCount = 0;
	line = null;
	index = null;
};

const parseTodo = ( change, currentIndex ) => {
	// regex pattern.
	const todoPattern = /.*(?<commentDelimiter>\*(?!\/)|\/\/)(\s((?<hasTodo>todo|@todo)\b|(?<hasParam>(@(?!todo).*?\s)))\s?:?\s*(?<title>.*)|\s*?(?<body>.*(?<!\/)))/gim;
	const matches = todoPattern.exec( change.content.trim() );
	switch ( true ) {
		case ! matches:
		case !! matches.groups.hasParam:
		case ! matches.groups.commentDelimiter:
			return false;
		case !! matches.groups.hasTodo:
			if ( inTodoBody ) {
				return null;
			}
			updateLineAndIndex( change, currentIndex );
			updateTodoBody( matches.groups.title );
			break;
		case !! matches.groups.body && inTodoBody:
			updateTodoBody( matches.groups.body );
			break;
		case !! matches.groups.commentDelimiter && inTodoBody:
			updateTodoWithLineBreak();
			break;
	}
	return true;
};

const getFirstSentence = ( content ) => {
	const pattern = /^.*?[.!?\:](?:\s|$)(?!.*\))/gim;
	const match = pattern.exec( content );
	const sentence = match !== null && match[ 0 ] ? match[ 0 ] : content;
	return sentence.length > 60
		? sentence.substring( 0, 57 ) + '...'
		: sentence;
};

const updateTodos = ( chunk, context, file, config ) => {
	if ( ! inTodoBody || ! todoBody ) {
		return;
	}
	const details = getDetails( {
		context,
		chunk,
		config,
		line,
		lineCount,
	} );
	debug(
		`todoParse: Todo item parsed [${ todoBody }] starting at line [${ line }] in [${ details.sha }]`
	);
	todos.push( {
		keyword: 'todo',
		title: getFirstSentence( todoBody ).trim(),
		content: todoBody.trim(),
		fileName: file.to,
		chunk,
		index,
		...details,
	} );
	todoBody = '';
	inTodoBody = false;
};

const updateLineAndIndex = ( change, newIndex ) => {
	line = change.ln || change.ln2;
	index = newIndex;
};

const updateTodoBody = ( content ) => {
	if ( ! content || content.length > 256 ) {
		updateTodos();
		return;
	}
	lineCount++;

	// possible dash indicating list item?
	if ( /^\s*?\-/.exec( content ) ) {
		todoBody += '\n' + content.trim();
		inListItem = true;
		// not a list item but in list item content? then add one more line break
		// and break out of list item content.
	} else if ( inListItem ) {
		todoBody += '\n' + content.trim();
		inListItem = false;
	} else {
		todoBody +=
			inTodoBody && /$\n\n/gim.exec( todoBody ) === null
				? ' ' + content.trim()
				: content.trim();
	}
	inTodoBody = true;
};

const updateTodoWithLineBreak = () => {
	inTodoBody = true;
	lineCount++;
	todoBody += '\n\n';
};

const parseTodoFromChunk = ( chunk, context, file, config = {} ) => {
	fullReset();
	chunk.changes.forEach( ( change, currentIndex ) => {
		if ( change.type !== 'add' ) {
			return;
		}
		let continueParsing = parseTodo( change, currentIndex );
		// if null, that means updateTodos then repeat the parse. This happens
		// when a todo breaks up the parsing of one in progress chunk.
		if ( continueParsing === null ) {
			updateTodos( chunk, context, file, config );
			continueParsing = parseTodo( change, currentIndex );
		}
		// if false, that means the parsing is done for a multi-line todo and
		// the current todo can be updated.
		if ( ! continueParsing ) {
			updateTodos( chunk, context, file, config );
		}
	} );
	updateTodos( chunk, context, file, config );
	return todos;
};

module.exports = parseTodoFromChunk;
