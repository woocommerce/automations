/**
 * External dependencies
 */
const { setFailed, getInput: coreGetInput } = require( '@actions/core' );

const inputs = {
	bumpStrategy: {
		input: 'milestone_bump_strategy',
		allowed: [ 'none', 'patch', 'minor', 'major' ],
		default: 'minor',
		required: false,
	},
};

const getInput = ( input ) => {
	const value = coreGetInput( input.input ) || input.default;

	if ( input.required && ! value ) {
		throw new Error( `Missing required input ${ input.input }` );
	}

	if ( value && input.allowed && ! value.includes( input.allowed ) ) {
		throw new Error(
			`Input ${
				input.input
			} provided with value "${ value }" must be one of ${ JSON.stringify(
				input.allowed
			) }`
		);
	}

	return value;
};

module.exports = async () => {
	try {
		const config = {
			bumpStrategy: getInput( inputs.bumpStrategy ),
		};

		return config;
	} catch ( error ) {
		setFailed( `assign-milestone: ${ error }` );
	}
};
