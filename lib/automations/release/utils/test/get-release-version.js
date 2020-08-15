const getReleaseVersion = require( '../get-release-version' );

describe( 'getReleaseVersion', () => {
	it( 'returns empty string when payload.ref is not present', () => {
		const version = getReleaseVersion( {} );
		expect( version ).toBe( '' );
	} );
	it( 'returns empty string when payload.ref exists but it does not include `release` in the branch name', () => {
		const version = getReleaseVersion( { ref: 'some branch' } );
		expect( version ).toBe( '' );
	} );
	it( 'returns version when payload.ref is a release branch', () => {
		const version = getReleaseVersion( { ref: 'release/3.0.1' } );
		expect( version ).toBe( '3.0.1' );
	} );
} );
