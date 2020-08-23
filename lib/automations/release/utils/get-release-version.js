const normalizeReleaseVersion = ( version ) => {
	const splitVersion = version.split( '.' );
	switch ( splitVersion.length ) {
		case 1:
			return `${ version }.0.0`;
		case 2:
			return `${ version }.0`;
	}
	return version;
};

/**
 * @param {Object} payload The webhook payload for the GitHub create event.
 */
module.exports = ( payload ) => {
	const ref = payload.ref || '';
	if ( ! ref || ! ref.includes( 'release/' ) ) {
		return '';
	}
	return normalizeReleaseVersion( ref.replace( 'release/', '' ) );
};
