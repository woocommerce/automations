/**
 * External dependencies
 */
const { setFailed } = require( '@actions/core' );

const types = {
	labelTypeMap: {
		type: 'object',
		items: {
			type: 'string',
		},
	},
	groupTitleOrder: {
		type: 'array',
		items: {
			type: 'string',
		},
	},
	rewordTerms: {
		type: 'object',
		items: {
			type: 'string',
		},
	},
	labelTypePrefix: {
		type: 'string',
	},
	needsDevNoteLabel: {
		type: 'string',
	},
	labelsToOmit: {
		type: 'array',
		items: {
			type: 'string',
		},
	},
};

const failForType = ( configName, reason ) => {
	setFailed(
		`releaseAutomation: Validation for the config property ${ configName } failed because ${ reason }`
	);
};

module.exports = {
	/**
	 * If an invalid type is passed in then the action is failed with a message.
	 *
	 * @param {Object} config Incoming config object to validate against types.
	 */
	validateConfig: ( config ) => {
		Object.keys( types ).forEach( ( configKey ) => {
			// only validate if the configKey exists in the config.
			if ( config[ configKey ] ) {
				const configValue = config[ configKey ];
				const typeToCheck = types[ configKey ].type;
				// special case for Object because arrays are objects in JS
				if ( typeToCheck === 'object' ) {
					if ( Array.isArray( configValue ) ) {
						failForType(
							configKey,
							'its an Array when an object is expected'
						);
						throw new Error( 'Invalid type' );
					}
				}
				if ( typeToCheck === 'array' ) {
					if ( ! Array.isArray( configValue ) ) {
						failForType(
							configKey,
							'it is not an array when an array is expected'
						);
						throw new Error( 'Invalid type' );
					}
				}
				// all other type checks.
				if (
					typeToCheck !== 'array' &&
					typeof configValue !== typeToCheck
				) {
					failForType(
						configKey,
						`it is not an ${ typeToCheck } (but a ${ typeof configValue })`
					);
					throw new Error( 'Invalid type' );
				}
				if ( types[ configKey ].items ) {
					const expectedItemType = types[ configKey ].items.type;
					const values =
						typeToCheck === 'array'
							? configValue
							: Object.values( configValue );
					if (
						values.filter(
							( value ) => typeof value !== expectedItemType
						).length !== 0
					) {
						failForType(
							configKey,
							`it expects values in the ${ typeToCheck } for the ${ configKey } property to be of type ${ expectedItemType }. Something in the ${ typeToCheck } is not that type.`
						);
						throw new Error( 'Invalid type' );
					}
				}
			}
		} );
	},
};
