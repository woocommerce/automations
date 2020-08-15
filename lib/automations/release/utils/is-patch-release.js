module.exports = ( version ) => {
	const splitVersion = version.split( '.' );
	let isPatchRelease = splitVersion.length > 2 && splitVersion[ 2 ] !== '0';
	if ( splitVersion.length > 3 ) {
		isPatchRelease = splitVersion[ 3 ] !== '0';
	}
	return isPatchRelease;
};
