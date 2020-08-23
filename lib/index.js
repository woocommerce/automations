/**
 * External dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { context, GitHub } = require( '@actions/github' );

/**
 * Internal dependencies
 */
const debug = require( './debug' );
const ifNotFork = require( './if-not-fork' );
const automations = require( './automations' );

/**
 * @typedef {import('./typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

( async function initialize() {
	const types = getInput( 'automations' ).split( ',' );

	debug( `The types value is ${ types }` );

	if ( types && ! Array.isArray( types ) ) {
		setFailed(
			'initialize: The provided `automations` configuration object must be a list.'
		);
		return;
	}
	const token = getInput( 'github_token' );
	if ( ! token ) {
		setFailed( 'initialize: Input `github_token` is required' );
		return;
	}

	const octokit = new GitHub( token );

	debug(
		`initialize: Received event = '${ context.eventName }', action = '${ context.payload.action }'`
	);

	for ( const { name, events, actions, runner, getConfig } of automations ) {
		if (
			events.includes( context.eventName ) &&
			( actions === undefined ||
				actions.includes( context.payload.action ) )
		) {
			try {
				debug( `initialize: Starting runner ${ name }` );
				/**
				 * @type {AutomationTaskRunner}
				 */
				const task = ifNotFork( runner );
				const config = await getConfig( context, octokit );
				await task( context, octokit, config );
			} catch ( error ) {
				setFailed(
					`initialize: Runner ${ name } failed with error: ${ error }`
				);
			}
		}
	}

	debug( 'initialize: All done!' );
} )();
