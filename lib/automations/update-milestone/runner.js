/**
 * External dependencies
 */
const debug = require( '../../debug' );
//const { setFailed, debug: coreDebug } = require( '@actions/core' );

const runner = async ( context, octokit, config ) => {
	debug( `eventName: ${ context.eventName }.` );
	debug( `payload: ${ context.payload.action }.` );
};

module.exports = runner;
