/**
 * External dependencies
 */
const { setFailed, getInput, debug: coreDebug } = require( '@actions/core' );

const allowedBumpStrategy = [ 'minor', 'ignore', 'major' ];

module.exports = async () => {
	const config = {
		bumpStrategy: getInput( 'bump_strategy' ) || 'minor',
	};

	coreDebug( 'retrieved config: ' + JSON.stringify( config ) );

	if ( ! config.bumpStrategy.includes( allowedBumpStrategy ) ) {
		setFailed(
			`assign-milestone: Invalid bumpStrategy provided. Allowed values: ${ JSON.stringify(
				allowedBumpStrategy
			) }`
		);
	}

	return config;
};
