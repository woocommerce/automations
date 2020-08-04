module.exports = ( version ) => {
	const splitVersion = version.split( '.' );
	return splitVersion.length > 2 && splitVersion[ 2 ] !== '0';
};
