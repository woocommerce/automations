/**
 * Note: much of this was taken from and adapted from the changelog script in the Gutenberg
 * project
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/bin/plugin/commands/changelog.js
 */

/**
 * External dependencies
 */
const { groupBy, escapeRegExp, uniq } = require( 'lodash' );
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
const {
	getMilestoneByTitle,
	getIssuesByMilestone,
} = require( '../../milestones' );

/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('@octokit/rest').Octokit.IssuesListForRepoResponseItem} IssuesListForRepoResponseItem
 * @typedef {import('@octokit/rest').Octokit.IssuesListMilestonesForRepoResponseItem} IssuesListMilestonesForRepoResponseItem
 * @typedef {import('../../../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * Changelog normalization function, returning a string to use as title, or
 * undefined if entry should be omitted.
 *
 * @typedef {(text:string,issue:IssuesListForRepoResponseItem)=>string|undefined} ChangelogNormalization
 */

/**
 * Mapping of patterns to match a title to a grouping type.
 *
 * @type {Map<RegExp,string>}
 */
const TITLE_TYPE_PATTERNS = new Map( [
	[ /^(\w+:)?(bug)?\s*fix(es)?(:|\/ )?/i, 'Bug Fixes' ],
] );

/**
 * Returns type candidates based on given issue label names.
 *
 * @param {string[]} labels Label names.
 * @param {ReleaseConfig}   config Release configuration object.
 * @return {string[]} Type candidates.
 */
function getTypesByLabels( labels, config ) {
	core.debug(
		'Received config in getTypesByLabels:' + JSON.stringify( config )
	);
	const prefix = config.labelTypePrefix;
	const labelTypeMap = config.labelTypeMap;
	return uniq(
		labels
			.filter( ( label ) => label.startsWith( prefix ) )
			.map( ( label ) => label.slice( prefix.length ) )
			.map( ( label ) =>
				labelTypeMap.hasOwnProperty( label )
					? labelTypeMap[ label ]
					: label
			)
	);
}

/**
 * Returns type candidates based on given issue title.
 *
 * @param {string} title Issue title.
 *
 * @return {string[]} Type candidates.
 */
function getTypesByTitle( title ) {
	const types = [];
	for ( const [ pattern, type ] of TITLE_TYPE_PATTERNS.entries() ) {
		if ( pattern.test( title ) ) {
			types.push( type );
		}
	}

	return types;
}

/**
 * Returns a function that generates a type label for a given issue object, or a
 * default if type cannot be determined.
 *
 * @param {ReleaseConfig} config The changelog config object.
 *
 * @return {function(IssuesListForRepoResponseItem)} Type label.
 */
function getIssueType( config ) {
	core.debug(
		'Received config in getIssueType: ' + JSON.stringify( config )
	);
	/**
	 * @param {IssuesListForRepoResponseItem} issue Issue object.
	 *
	 * @return {string} Type label.
	 */
	return ( issue ) => {
		const candidates = [
			...getTypesByLabels(
				issue.labels.map( ( { name } ) => name ),
				config
			),
			...getTypesByTitle( issue.title ),
		];

		return candidates.length
			? candidates.sort( sortGroup( config ) )[ 0 ]
			: 'Various';
	};
}

/**
 * Returns all issues that have the given needs dev note label.
 *
 * @param {IssuesListForRepoResponseItem[]} pullRequests
 * @param {string}                          needsDevNoteLabel
 * return {IssuesListForRepoResponseItem[]} Array of issues having the label.
 */
function getDevNoteNeeded( pullRequests, needsDevNoteLabel ) {
	if ( ! needsDevNoteLabel ) {
		return [];
	}
	return pullRequests.filter( ( pullRequest ) => {
		return pullRequest.labels.includes( needsDevNoteLabel );
	} );
}

/**
 * Returns a sort comparator, comparing two group titles.
 *
 * @param {ReleaseConfig} config The changelog configuration object.
 *
 * @return {Function} The sort comparator.
 */
function sortGroup( config ) {
	/**
	 * @param {string} a First group title.
	 * @param {string} b Second group title.
	 *
	 * @return {number} Sort result.
	 */
	return ( a, b ) => {
		const groupTitleOrder = config.groupTitleOrder;
		if ( ! groupTitleOrder ) {
			return -1;
		}
		const [ aIndex, bIndex ] = [ a, b ].map( ( title ) => {
			const index = groupTitleOrder.indexOf( title );
			return index === -1
				? groupTitleOrder.indexOf( 'undefined' )
				: index;
		} );

		return aIndex - bIndex;
	};
}

/**
 * Given a text string, appends a period if not already ending with one.
 *
 * @param {string} text Original text.
 *
 * @return {string} Text with trailing period.
 */
function addTrailingPeriod( text ) {
	return text.replace( /\s*\.?$/, '' ) + '.';
}

/**
 * Returns a function that given a text string, replaces reworded terms.
 *
 * @param {ReleaseConfig} config The changelog configuration object.
 *
 * @return {function(string)} The reworder function
 */
function reword( config ) {
	/**
	 * @param {string} text Original text.
	 *
	 * @return {string} Text with reworded terms.
	 */
	return ( text ) => {
		const rewordTerms = config.rewordTerms;
		if ( ! rewordTerms ) {
			return text;
		}
		for ( const [ term, replacement ] of Object.entries( rewordTerms ) ) {
			const pattern = new RegExp(
				'(^| )' + escapeRegExp( term ) + '( |$)',
				'ig'
			);
			text = text.replace( pattern, '$1' + replacement + '$2' );
		}

		return text;
	};
}

/**
 * Given a text string, capitalizes the first letter of the last segment
 * following a colon.
 *
 * @param {string} text Original text.
 *
 * @return {string} Text with capitalizes last segment.
 */
function capitalizeAfterColonSeparatedPrefix( text ) {
	const parts = text.split( ':' );
	parts[ parts.length - 1 ] = parts[ parts.length - 1 ].replace(
		/^(\s*)([a-z])/,
		( _match, whitespace, letter ) => whitespace + letter.toUpperCase()
	);

	return parts.join( ':' );
}

/**
 * Higher-order function which returns a normalization function to omit by title
 * prefix matching any of the given prefixes.
 *
 * @param {string[]} prefixes Prefixes from which to determine if given entry
 *                            should be omitted.
 *
 * @return {ChangelogNormalization} Normalization function.
 */
const createOmitByTitlePrefix = ( prefixes ) => ( title ) =>
	prefixes.some( ( prefix ) =>
		new RegExp( '^' + escapeRegExp( prefix ), 'i' ).test( title )
	)
		? undefined
		: title;

/**
 * Higher-order function which returns a normalization function to omit by issue
 * label matching any of the given label names.
 *
 * @param {string[]} labels Label names from which to determine if given entry
 *                          should be omitted.
 *
 * @return {ChangelogNormalization} Normalization function.
 */
const createOmitByLabel = ( labels ) => ( text, issue ) =>
	issue.labels.some( ( label ) => labels.includes( label.name ) )
		? undefined
		: text;

/**
 * Returns a function that given an issue title and issue, returns the title
 * with redundant grouping type details removed. The prefix is redundant since
 * it would already be clear enough by group assignment that the prefix would be
 * inferred.
 *
 * @param {ReleaseConfig} config The changelog configuration object.
 *
 * @return {function(string, IssuesListForRepoResponseItem)} Generator function.
 */
function removeRedundantTypePrefix( config ) {
	/**
	 * @param {string} title The title being checked
	 * @param {IssuesListForRepoResponseItem} issue The issue being checked.
	 *
	 * @return {string} Title with redundant grouping type details removed.
	 */
	return ( title, issue ) => {
		const type = getIssueType( config )( issue );

		return title.replace(
			new RegExp(
				`^\\[?${
					// Naively try to convert to singular form, to match "Bug Fixes"
					// type as either "Bug Fix" or "Bug Fixes" (technically matches
					// "Bug Fixs" as well).
					escapeRegExp( type.replace( /(es|s)$/, '' ) )
				}(es|s)?\\]?:?\\s*`,
				'i'
			),
			''
		);
	};
}

/**
 * Array of normalizations applying to title, each returning a new string, or
 * undefined to indicate an entry which should be omitted.
 *
 * @param {ReleaseConfig} config The release configuration object
 *
 * @return {Array<ChangelogNormalization>} An array of normalization functions
 */
const TITLE_NORMALIZATIONS = ( config ) => [
	createOmitByTitlePrefix( [ '[rnmobile]' ] ),
	createOmitByLabel( config.labelsToOmit || [] ),
	removeRedundantTypePrefix( config ),
	reword( config ),
	capitalizeAfterColonSeparatedPrefix,
	addTrailingPeriod,
];

/**
 * Given an issue title, returns the title with normalization transforms
 * applied, or undefined to indicate that the entry should be omitted.
 *
 * @param {string}                        title Original title.
 * @param {IssuesListForRepoResponseItem} issue Issue object.
 * @param {ReleaseConfig}                 config Release configuration object.
 *
 * @return {string|undefined} Normalized title.
 */
function getNormalizedTitle( title, issue, config ) {
	/** @type {string|undefined} */
	let normalizedTitle = title;
	if ( /### Changelog\r\n\r\n> /.test( issue.body ) ) {
		const bodyParts = issue.body.split( '### Changelog\r\n\r\n> ' );
		const note = bodyParts[ bodyParts.length - 1 ];
		normalizedTitle = note
			// Remove comment prompt
			.replace( /<!---(.*)--->/gm, '' )
			// Remove new lines and whitespace
			.trim();
		normalizedTitle = ! normalizedTitle.length ? title : normalizedTitle;
	}
	for ( const normalize of TITLE_NORMALIZATIONS( config ) ) {
		normalizedTitle = normalize( normalizedTitle, issue );
		if ( normalizedTitle === undefined ) {
			break;
		}
	}

	return normalizedTitle;
}

/**
 * Returns a function that generates a formatted changelog entry for a given issue object, or undefined
 * if entry should be omitted.
 *
 * @param {ReleaseConfig} config The release configuration object.
 *
 * @return {function(IssuesListForRepoResponseItem)} Function handling issue entry
 */
function getEntry( config ) {
	/**
	 * @param {IssuesListForRepoResponseItem} issue Issue object.
	 *
	 * @return {string=} Formatted changelog entry, or undefined to omit.
	 */
	return ( issue ) => {
		const title = getNormalizedTitle( issue.title, issue, config );

		return title === undefined
			? title
			: `- ${ title } ([${ issue.number }](${ issue.html_url }))`;
	};
}

/**
 * Returns a promise resolving to an array of pull requests associated with the
 * changelog settings object.
 *
 * @param {GitHubContext}       context           Context object for the event.
 * @param {GitHub}              octokit           GitHub REST client.
 * @param {string} 				milestoneTitle    Title of milestone to match on.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to array of
 *                                            pull requests.
 */
async function fetchAllPullRequests( context, octokit, milestoneTitle ) {
	const milestone = await getMilestoneByTitle(
		context,
		octokit,
		milestoneTitle
	);

	if ( ! milestone ) {
		throw new Error(
			`Cannot find milestone by title: ${ milestoneTitle }`
		);
	}

	const { number } = milestone;
	const issues = await getIssuesByMilestone(
		context,
		octokit,
		number,
		'closed'
	);
	return issues.filter( ( issue ) => issue.pull_request );
}

/**
 * Returns a promise resolving to the changelog string for given settings.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {string} milestoneTitle
 * @param {ReleaseConfig} config
 * @return {Promise<string>} Promise resolving to changelog.
 */
async function getChangelogItems( context, octokit, milestoneTitle, config ) {
	core.debug( 'Config in getChangelogItems' + JSON.stringify( config ) );
	const pullRequests = await fetchAllPullRequests(
		context,
		octokit,
		milestoneTitle
	);
	if ( ! pullRequests.length ) {
		throw new Error(
			'There are no pull requests associated with the milestone.'
		);
	}

	return {
		...groupBy( pullRequests, getIssueType( config ) ),
		devNotes: getDevNoteNeeded( pullRequests, config.needsDevNoteLabel ),
	};
}

/**
 * Returns all the changelog items that require Dev Notes.
 *
 * @param {IssuesListForRepoResponseItem[]} changelogItems
 * @param {ReleaseConfig} config The Release configuration object.
 * @return {string} The dev note items as a string.
 */
function getDevNoteItems( changelogItems, config ) {
	return getEntriesForGroup( changelogItems, 'devNotes', config, false );
}

/**
 * Returns a formatted string of changelog entries for the given group.
 *
 * @param {IssuesListForRepoResponseItem[]} changelogItems
 * @param {string} group
 * @param {ReleaseConfig} config
 * @param {boolean} [withHeader=true] If provided the group will be listed as a
 *                                    title.
 * @return {string} The changelog items as a string.
 */
function getEntriesForGroup(
	changelogItems,
	group,
	config,
	withHeader = true
) {
	let entries = '';
	const items = changelogItems[ group ];
	const groupEntries = items.map( getEntry( config ) ).filter( Boolean );
	if ( ! groupEntries.length ) {
		return entries;
	}
	if ( withHeader ) {
		entries = '#### ' + group + '\n\n';
	}
	groupEntries.forEach( ( entry ) => ( entries += entry + '\n' ) );
	if ( withHeader ) {
		entries += '\n';
	}
	return entries;
}

/**
 * Returns a promise resolving to the changelog string for given grouped object
 * of changelog items (which are pull requests from the given milestone).
 *
 * @param {IssuesListForRepoResponseItem[]} changelogItems
 * @param {ReleaseConfig} config
 *
 * @return {string} The entire changelog as a string grouped by types in sections.
 */
async function getChangelog( changelogItems, config ) {
	let changelog = '';
	const sortedGroups = Object.keys( changelogItems ).sort(
		sortGroup( config )
	);
	for ( const group of sortedGroups ) {
		// exclude needs dev note items for generated changelog
		if ( group === 'devNotes' ) {
			continue;
		}
		changelog += getEntriesForGroup( changelogItems, group, config );
	}
	return changelog;
}

module.exports = {
	reword,
	capitalizeAfterColonSeparatedPrefix,
	createOmitByTitlePrefix,
	createOmitByLabel,
	addTrailingPeriod,
	getNormalizedTitle,
	getIssueType,
	sortGroup,
	fetchAllPullRequests,
	getTypesByLabels,
	getTypesByTitle,
	getChangelogItems,
	getChangelog,
	getDevNoteNeeded,
	getEntriesForGroup,
	getDevNoteItems,
};
