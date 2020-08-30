/**
 * External dependencies
 */
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
const { getTemplate, TEMPLATES, compile } = require( './templates' );
const { lineBreak } = require( '../../utils' );
const debug = require( '../../debug' );
const {
	getReleaseVersion,
	isPatchRelease,
	getReleaseBranch,
	duplicateChecker,
	hasMilestone: getHasMilestone,
} = require( './utils' );
const {
	getChangelog,
	getChangelogItems,
	getDevNoteItems,
} = require( '../../utils/changelog' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {ReleaseConfig} config
 */
const branchHandler = async ( context, octokit, config ) => {
	core.debug(
		'Received config in branchHandler: ' + JSON.stringify( config )
	);
	// get release version.
	const releaseVersion = getReleaseVersion( context.payload );
	if ( ! releaseVersion ) {
		debug( `releaseAutomation: branch created is not a release` );
		return;
	}

	let base,
		pullRequestTemplate,
		initialChecklistTemplate,
		changelog = '',
		devNoteItems = '';

	const prTitle = `Release: ${ releaseVersion }`;

	// if there's already a pull request for this release, then bail.
	const matchingPullRequest = await duplicateChecker(
		context,
		octokit,
		prTitle
	);

	if ( matchingPullRequest ) {
		debug(
			`releaseAutomation: Already have a pr for the branch with title: ${ prTitle }`
		);
		return;
	}

	// is this a patch release?
	if ( isPatchRelease( releaseVersion ) ) {
		base =
			( await getReleaseBranch( releaseVersion, context, octokit ) ) ||
			context.payload.master_branch;
		pullRequestTemplate = await getTemplate(
			TEMPLATES.patchReleasePullRequest,
			context,
			octokit
		);
		initialChecklistTemplate = await getTemplate(
			TEMPLATES.patchInitialChecklist,
			context,
			octokit
		);
	} else {
		base = context.payload.master_branch;
		pullRequestTemplate = await getTemplate(
			TEMPLATES.releasePullRequest,
			context,
			octokit
		);
		initialChecklistTemplate = await getTemplate(
			TEMPLATES.releaseInitialChecklist,
			context,
			octokit
		);
	}

	// get changelog
	const hasMilestone = await getHasMilestone(
		releaseVersion,
		context,
		octokit
	);
	core.debug( `Has milestone: ${ hasMilestone }` );
	try {
		if ( ! hasMilestone ) {
			throw new Error(
				'Changelog could not be generated because there is no milestone for the release branch that was pushed. Double-check the spelling on the release branch and ensure that you have a milestone corresponding to the version in the branch name. If you found the error, you can restart by deleting the branch and this pull and pushing a new branch.'
			);
		}
		const changelogItems = await getChangelogItems(
			context,
			octokit,
			releaseVersion,
			config
		);
		changelog = await getChangelog( changelogItems, config );
		devNoteItems = getDevNoteItems( changelogItems, config );
	} catch ( e ) {
		core.debug( `Error ${ e }` );
		// @todo Handle re-attempting creation of changelog after resolving error.
		//
		// Currently, the changelog error is a consistent error message string
		// so that future pushes where the pull already exists can optionally retry.
		changelog =
			`> Changelog Error: ${ e.message }` +
			'\n' +
			"> You'll need to edit this section manually";
		devNoteItems =
			`> Devnotes Error: ${ e.message }` +
			'\n' +
			"> PRs tagged for dev notes cannot be found, you'll need to edit this section manually.";
	}

	const templateData = {
		...context.repo,
		changelog,
		devNoteItems,
		version: releaseVersion,
		releaseBranch: context.payload.ref,
		username: context.payload.sender.login,
	};

	const body = lineBreak( compile( pullRequestTemplate )( templateData ) );

	const { owner, repo } = context.repo;

	debug(
		`releaseAutomation: Creating release pull request in [${ owner }/${ repo }] for ${ context.payload.ref }`
	);

	const prCreated = await octokit.pulls.create( {
		...context.repo,
		title: prTitle,
		head: context.payload.ref,
		base,
		body,
	} );

	if ( ! prCreated ) {
		debug( `releaseAutomation: Creation of pull request failed.` );
		return;
	}

	// Add initial Action checklist as comment.
	const commentBody = lineBreak(
		compile( initialChecklistTemplate )( templateData )
	);

	await octokit.issues.createComment( {
		...context.repo,
		issue_number: prCreated.data.number,
		body: commentBody,
	} );
};

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {ReleaseConfig} config
 */
module.exports = async ( context, octokit, config ) => {
	const type = context.payload.ref_type;
	core.debug( 'Received config in runner: ' + JSON.stringify( config ) );
	let handler;
	switch ( type ) {
		case 'branch':
			handler = branchHandler;
			break;
		case 'tag':
			handler = () => void null;
			break;
		default:
			return null;
	}
	await handler( context, octokit, config );
};
