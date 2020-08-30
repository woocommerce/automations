const { validateConfig } = require( '../validate-config' );
const actions = require( '@actions/core' );

jest.mock( '@actions/core' );

describe( 'validateConfig', () => {
	let spy;
	beforeEach( () => {
		spy = actions.setFailed;
	} );
	afterEach( () => {
		spy.mockReset();
	} );
	it( 'ignores config keys not validated', () => {
		validateConfig( { invalid: 'not validated' } );
		expect( spy ).not.toHaveBeenCalled();
	} );
	[ 'labelTypeMap', 'rewordTerms' ].forEach( ( property ) => {
		describe( `${ property } property validations`, () => {
			it( 'fails if it is not an object', () => {
				const caller = () =>
					void validateConfig( { [ property ]: 'some value' } );
				expect( caller ).toThrow( 'Invalid type' );
				expect( spy ).toHaveBeenCalled();
			} );
			it( 'fails if it is an object but not all values are a string', () => {
				const caller = () =>
					void validateConfig( {
						[ property ]: { a: 'valid', b: 10 },
					} );
				expect( caller ).toThrow( 'Invalid type' );
				expect( spy ).toHaveBeenCalled();
			} );
			it( 'passes if is an object and all values are a string', () => {
				validateConfig( { [ property ]: { a: 'valid' } } );
				expect( spy ).not.toHaveBeenCalled();
			} );
		} );
	} );
	[ 'groupTitleOrder', 'labelsToOmit' ].forEach( ( property ) => {
		describe( `${ property } property validation`, () => {
			it( 'fails if it is not an array', () => {
				const caller = () =>
					void validateConfig( { [ property ]: {} } );
				expect( caller ).toThrow( 'Invalid type' );
				expect( spy ).toHaveBeenCalled();
			} );
			it( 'fails if it is an array but not all values are a string', () => {
				const caller = () =>
					validateConfig( { [ property ]: [ 'valid', 10 ] } );
				expect( caller ).toThrow( 'Invalid type' );
				expect( spy ).toHaveBeenCalled();
			} );
			it( 'passes if it is an array and all values are a string', () => {
				validateConfig( { [ property ]: [ 'valid' ] } );
				expect( spy ).not.toHaveBeenCalled();
			} );
		} );
	} );
	[ 'labelTypePrefix', 'needsDevNoteLabel' ].forEach( ( property ) => {
		describe( `${ property } property validation`, () => {
			it( 'fails if it is not a string', () => {
				const caller = () =>
					void validateConfig( { [ property ]: 10 } );
				expect( caller ).toThrow( 'Invalid type' );
				expect( spy ).toHaveBeenCalled();
			} );
			it( 'passes if it is a string', () => {
				validateConfig( { [ property ]: 'valid' } );
				expect( spy ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
