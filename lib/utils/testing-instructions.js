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
	const featurePluginPrs = getPrsMatchingText(
		prList,
		( body ) => body.includes( '* [x] Feature plugin' ),
		[...excludeFromTestingInstructionsPrIds, ...corePrIds, ...experimentalPrIds ],
	);
	const featurePluginPrIds = featurePluginPrs.map( ( pr ) => pr.number );
	const allAssignedPrIds = [ ...corePrIds, ...featurePluginPrIds, experimentalPrIds, excludeFromTestingInstructionsPrIds ];
	const prsWithNoTestingCategory = allPrIds.filter( ( id ) => ! [ ...corePrIds, ...experimentalPrIds, ...featurePluginPrIds ].includes( id ) );
	const unaccountedForPrMessage = prsWithNoTestingCategory.length > 0 ? `# ⚠️ Warning - PRs #${ prsWithNoTestingCategory.join(', #') } do not have any testing category assigned. Please check the PR body to verify it should/should not be included in the testing instructions.` : '';
	const getChangelogEntry = getEntry( config );
	const changelogWithPrIds = Object.fromEntries(
		[ ...corePrs, ...featurePluginPrs ].map(
			( pr ) => ( [ pr.number, getChangelogEntry( pr ) ] )
		)
	);

	const prTestingInstructionsMapFunc = ( pr ) => extractTestingInstructions( pr, changelogWithPrIds );
	const coreTestingInstructions = corePrs.map( prTestingInstructionsMapFunc ).join( '' );
	const featurePluginTestingInstructions = featurePluginPrs.map( prTestingInstructionsMapFunc ).join( '' );
	const formattedCoreTestingInstructions = corePrs.length > 0 ?  `\n## Feature Plugin and package inclusion in WooCommerce

${ coreTestingInstructions }` : '';

	const formattedFeaturePluginTestingInstructions = featurePluginPrs.length > 0 ?  `## Feature Plugin

${ featurePluginTestingInstructions }` : '';


	return `## Testing notes and ZIP for release ${ milestoneTitle }

Zip file for testing: [insert link to built zip here]
${ formattedCoreTestingInstructions }${ formattedFeaturePluginTestingInstructions }${ unaccountedForPrMessage };
`;
};

/**
 * Gets the testing instructions section of a PR.
 * @param pr {PullRequest} The PR to get the instructions from.
 * @param changelog {object} Object keyed by PR ID and whose values are the changelog entries with links to the PR.
 * @return {string}
 */
const extractTestingInstructions = ( pr, changelog ) => {
	const { body: prBody } = pr;
	const prBodyWithoutComments = prBody.replace( /(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '' );
	const regex = /### User Facing Testing(.*)\* \[ ] Do not include in the testing notes/mis;
	const matches = prBodyWithoutComments.match( regex );
	const error = `⚠️ PR [#${ pr.number }](${ pr.url }) testing instructions could not be parsed. Please check it!`
	if ( ! matches || ! matches[ 1 ] ) {
		debug( error );
		return error;
	}
	if ( ! pr.number in changelog ) {
		return error;
	}
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
