const isPatchRelease = require( '../is-patch-release' );

describe( 'isPatchRelease', () => {
	it.each`
		version
		${'3.1'}
		${'3.1.0'}
		${'4.0.0.0'}
		${'2'}
	`(
		'returns false when for $version because it is not a patch release',
		( { version } ) => {
			expect( isPatchRelease( version ) ).toBe( false );
		}
	);
	it.each`
		version
		${'2.3.1'}
		${'3.10.2.1'}
		${'3.10.0.3'}
	`(
		'returns true when for $version because it is a patch release',
		( { version } ) => {
			expect( isPatchRelease( version ) ).toBe( true );
		}
	);
} );
