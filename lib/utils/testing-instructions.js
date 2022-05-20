/**
 * Internal dependencies
 */
import { getEntry } from './changelog';

const {fetchAllPullRequests} = require('./changelog');
const debug = require( '../debug' );

/**
 * @typedef {import('@octokit/types').PullsGetResponseData} PullRequest
 * @typedef {import('../typedefs').GitHub} GitHub
 * @typedef {import('../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * Gets the testing instructions as a string for inclusion in the PR.
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {string} milestoneTitle The name of the milestone.
 * @param {ReleaseConfig} config The release configuration.
 * @return {Promise<string>} The testing instructions in a string.
 */
export const getTestingInstructions = async ( context, octokit, milestoneTitle, config ) => {
	const prList = await fetchAllPullRequests( context, octokit, milestoneTitle);

	// We need to keep track of all PR ids so we can check which ones slated for this release have been accounted for
	// in the testing instructions.
	const allPrIds = prList.map( ( pr ) => pr.number );

	const doNotIncludeInTestingInstructionsPrs = getPrsMatchingText(
		prList,
		( body ) => body.includes( '* [x] Do not include in the Testing Notes' ),
	);
	const excludeFromTestingInstructionsPrIds = doNotIncludeInTestingInstructionsPrs.map( (pr) => pr.number );

	const experimentalPrs = getPrsMatchingText(
		prList,
		( body ) => body.includes( '* [x] Experimental' ),
		excludeFromTestingInstructionsPrIds,
	);
	const experimentalPrIds = experimentalPrs.map( ( pr ) => pr.number );

	const corePrs = getPrsMatchingText(
		prList,
		( body ) => body.includes( '* [x] WooCommerce Core' ),
		excludeFromTestingInstructionsPrIds,
	);
	const corePrIds = corePrs.map( ( pr ) => pr.number );

	// Here, we're only including PRs that are marked as Feature Plugin and nothing else, this is to handle the case
	// where an IC might inadvertently mark a PR as both WooCommerce core and Feature plugin.
	const featurePluginPrs = getPrsMatchingText(
		prList,
		( body ) => body.includes( '* [x] Feature plugin' ),
		[...excludeFromTestingInstructionsPrIds, ...corePrIds, ...experimentalPrIds ],
	);
	const featurePluginPrIds = featurePluginPrs.map( ( pr ) => pr.number );

	// Now we check the IDs of all PRs that have been categorised, and make sure none have been missed. We check against
	// allPrIds. If some have been missed, an error gets included in the testing instructions and the release lead
	// can check manually.
	const allAssignedPrIds = [ ...corePrIds, ...featurePluginPrIds, ...experimentalPrIds, ...excludeFromTestingInstructionsPrIds ];
	const htmlUrl = context.payload.repository.html_url;
	const prsWithNoTestingCategory = allPrIds.filter(
		( id ) => ! allAssignedPrIds.includes( id ) )
		.map(
			( id ) => `[#${ id }](${ htmlUrl }/pull/${ id })`
		);
	const unaccountedForPrMessage = prsWithNoTestingCategory.length > 0 ? `### ⚠️ Warning - PRs ${ prsWithNoTestingCategory.join(', ') } do not have any testing category assigned. Please check the PR body to verify it should/should not be included in the testing instructions.` : '';
	const getChangelogEntry = getEntry( config );
	const changelogWithPrIds = Object.fromEntries(
		[ ...corePrs, ...featurePluginPrs ].map(
			( pr ) => ( [ pr.number, getChangelogEntry( pr ) ] )
		)
	);

	const prTestingInstructionsMapFunc = ( pr ) => extractTestingInstructions( pr, changelogWithPrIds, htmlUrl );
	const coreTestingInstructions = corePrs.map( prTestingInstructionsMapFunc ).join( '' );
	const featurePluginTestingInstructions = featurePluginPrs.map( prTestingInstructionsMapFunc ).join( '' );
	const formattedCoreTestingInstructions = corePrs.length > 0 ?  `\n## Feature Plugin and package inclusion in WooCommerce

${ coreTestingInstructions }` : '';

	const formattedFeaturePluginTestingInstructions = featurePluginPrs.length > 0 ?  `## Feature Plugin

${ featurePluginTestingInstructions }` : '';


	return `## Testing notes and ZIP for release ${ milestoneTitle }

Zip file for testing: [insert link to built zip here]
${ formattedCoreTestingInstructions }${ formattedFeaturePluginTestingInstructions }${ unaccountedForPrMessage }
`;
};

/**
 * Gets the testing instructions section of a PR.
 * @param pr {PullRequest} The PR to get the instructions from.
 * @param changelog {object} Object keyed by PR ID and whose values are the changelog entries with links to the PR.
 * @param htmlUrl {string} The HTML URL of the repository so we can hyperlink the PR numbers.
 * @return {string}
 */
const extractTestingInstructions = ( pr, changelog, htmlUrl ) => {
	const { body: prBody } = pr;

	// Remove all comments from the PR body so they don't get in the way.
	const prBodyWithoutComments = prBody.replace( /(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '' );

	// If this section isn't in the PR, then we'll error out and show that in the testing instructions instead. Release
	// lead will need to manually check in this case.
	const regex = /### User Facing Testing(.*)\* \[ ] Do not include in the testing notes/mis;
	const matches = prBodyWithoutComments.match( regex );
	const error = `### ⚠️ PR [#${ pr.number }'s](${ htmlUrl }/pull/${ pr.number }) testing instructions could not be parsed. Please check it!\n\n`
	if ( ! matches || ! matches[ 1 ] || ! matches[1].trim() ) {
		debug( error );
		return error;
	}
	debug( JSON.stringify( changelog ) );
	if ( ! changelog.hasOwnProperty( pr.number ) && changelog[ pr.number ] ) {
		debug( `PR ${ pr.number } not found in changelog. Skipping extracting testing instructions.` );
		return error;
	}
	debug( `PR ${ pr.number } was found in changelog ${ JSON.stringify( changelog ) }. Extracting changelog then!` );
	return `### ${ changelog[ pr.number ].substr( 2 ) }\n\n${ matches[1].trim() }\n\n`;
}

/**
 * Gets PRs for which the filter returns true.
 * @param prList {PullRequest[]}
 * @param filter {( string ) => boolean} A function to run against the
 * @param excludePrIds {number[]} A list of pr numbers to exclude.
 * @return {PullRequest[]} Returns a list of pull requests that satisfy the filter.
 */
const getPrsMatchingText = ( prList, filter, excludePrIds = [] ) => {
	return prList.filter( pr => ! excludePrIds.includes( pr.number ) && filter( pr.body ) );
}
