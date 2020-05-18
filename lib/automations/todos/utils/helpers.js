exports.lineBreak = ( body ) => {
	// Regular expression to match all occurences of '&lt;br&gt'
	const regEx = /\/?&lt;br(?:\s\/)?&gt;/g;
	return body.replace( regEx, '<br>' );
};

exports.truncate = ( str, maxLength = 80 ) => {
	if ( str.length < maxLength ) return str;
	return str.substring( 0, maxLength ) + '...';
};
