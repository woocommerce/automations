/**
 * @param {Object} payload The webhook payload for the GitHub create event.
 */
module.exports = ( payload ) => {
	const ref = payload.ref || '';
	if ( ! ref || ! ref.includes( 'release/' ) ) {
		return '';
	}
	return ref.replace( 'release/', '' );
};
