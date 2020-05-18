/**
 * External dependencies
 */
const { handlebars } = require( 'hbs' );

/**
 * Internal dependencies
 */
const comment = require( './comment' );
const issue = require( './issue' );
const issueFromMerge = require( './issue-from-merge' );
const titleChange = require( './title-change' );
const reopenClosed = require( './reopen-closed' );

// Register a githubHost global helper to make links respect the GHE_HOST env var
handlebars.registerHelper(
	'githubHost',
	() => process.env.GHE_HOST || 'github.com'
);

handlebars.registerHelper(
	'todoUrl',
	() => 'https://github.com/nerrad/automations'
);

const moduleMap = {
	comment,
	issue,
	issueFromMerge,
	titleChange,
	reopenClosed,
};

const compile = ( moduleName ) => handlebars.compile( moduleMap[ moduleName ] );

module.exports = {
	comment: compile( 'comment' ),
	issue: compile( 'issue' ),
	issueFromMerge: compile( 'issueFromMerge' ),
	titleChange: compile( 'titleChange' ),
	reopenClosed: compile( 'reopenClosed' ),
};
