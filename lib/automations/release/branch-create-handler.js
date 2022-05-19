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
 * Inserts the new changelog entry into the readme file contents
 * @param {string} contents The contents of the readme.txt file
 * @param {string} changelog The changelog to insert into the readme.txt file
 * @param {string} releaseVersion The version being released.
 * @return {string} The new content of the readme.txt file containing the new changelog.
 */
const insertNewChangelogEntry = ( contents, changelog, releaseVersion ) => {
	const regex = /== Changelog ==\n/;
	return contents.replace(
		regex,
		`== Changelog ==\n\n= ${ releaseVersion } - ${ new Date().toISOString().split('T')[0] } =\n\n${ changelog }`
	);
}

const updateMinRequiredVersionsReadme = ( contents, latestWPVersion ) => {
	const versionList = latestWPVersion.split( '.' );
	const version = `${ versionList[ 0 ] }.${ versionList[ 1 ] }`;
	const regexRequiresAtLeast = /Requires at least:.*/;
	const regexTestedUpTo = /Tested up to:.*/;
	return contents
		.replace( regexRequiresAtLeast, `Requires at least: ${ version }` )
		.replace( regexTestedUpTo, `Tested up to: ${ version }` );
};

const updateMinRequiredVersionsWooBlockPHP = (
	contents,
	latestWPVersion,
	latestWCVersion
) => {
	const wpVersionList = latestWPVersion.split( '.' );
	const wpVersion = `${ wpVersionList[ 0 ] }.${ wpVersionList[ 1 ] }`;
	const wcVersionList = latestWCVersion.split( '.' );
	const wcVersion = `${ wcVersionList[ 0 ] }.${ wcVersionList[ 1 ] }`;
	const previousWCVersion =
		wcVersionList[ 1 ] === '0'
			? `${ +wcVersionList[ 0 ] - 1 }.9`
			: `${ wcVersionList[ 0 ] }.${ +wcVersionList[ 1 ] - 1 }`;
	const regexRequiresAtLeast = /\* Requires at least:.*/;
	const regexWCRequiresAtLeast = /\* WC requires at least:.*/;
	const regexWCTestedUpTo = /\* WC tested up to:.*/;
	return contents
		.replace( regexRequiresAtLeast, `* Requires at least: ${ wpVersion }` )
		.replace(
			regexWCRequiresAtLeast,
			`* WC requires at least: ${ wcVersion }`
		)
		.replace(
			regexWCTestedUpTo,
			`* WC tested up to: ${ previousWCVersion }`
		);
};

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

	const readmeResponse = await octokit.repos.getContent({
		...context.repo,
		path: 'readme.txt',
	});

	if ( ! readmeResponse ) {
		debug( `releaseAutomation: Could not read readme.txt file from repository.` );
		return;
	}

	const wpTags = await octokit.request(
		'GET /repos/WordPress/WordPress/tags',
		{
			owner: 'WordPress',
			repo: 'WordPress',
		}
	);
	const wpLatestReleaseVersion = wpTags.data[ 0 ].name;

	// Content comes from GH API in base64 so convert it to utf-8 string.
	const readmeBuffer = new Buffer.from( readmeResponse.data.content, 'base64' );
	const readmeContents = readmeBuffer.toString( 'utf-8' );

	const updatedReadmeChangeLog = insertNewChangelogEntry(
		readmeContents,
		changelog,
		releaseVersion
	);

	const updatedReadmeMinRequiredVersion = updateMinRequiredVersionsReadme(
		updatedReadmeChangeLog,
		wpLatestReleaseVersion
	);

	// Need to convert back to base64 to write to the repo.
	const updatedReadmeBuffer = new Buffer.from(
		updatedReadmeMinRequiredVersion,
		'utf-8'
	);
	const updatedReadmeContent = updatedReadmeBuffer.toString( 'base64' );

	const readmeSha = readmeResponse.data.sha;
	const updatedReadmeCommit = await octokit.repos.createOrUpdateFileContents({
		...context.repo,
		message: 'Update changelog in readme.txt',
		path: 'readme.txt',
		content: updatedReadmeContent,
		sha: readmeSha,
		branch: context.payload.ref,
	});

	if ( ! updatedReadmeCommit ) {
		debug( `releaseAutomation: Automatic update of readme failed.` );
		return;
	}

	// Get WooCommerce data
	const wcLatestRelease = await octokit.request(
		'GET /repos/woocommerce/woocommerce/releases/latest',
		{
			owner: 'woocommerce',
			repo: 'woocommerce',
		}
	);

	const wcLatestReleaseVersion = wcLatestRelease.data.name;

	const wooBlockPHPResponse = await octokit.repos.getContent( {
		...context.repo,
		path: 'woocommerce-gutenberg-products-block.php',
	} );

	if ( ! wooBlockPHPResponse ) {
		debug(
			`releaseAutomation: Could not read woocommerce-gutenberg-products-block.php file from repository.`
		);
		return;
	}

	// Content comes from GH API in base64 so convert it to utf-8 string.
	const wooBlockPHPBuffer = new Buffer.from(
		wooBlockPHPResponse.data.content,
		'base64'
	);
	const wooBlockPHPContents = wooBlockPHPBuffer.toString( 'utf-8' );

	// Need to convert back to base64 to write to the repo.
	const updatedWooBlockPHPContentBuffer = new Buffer.from(
		updateMinRequiredVersionsWooBlockPHP(
			wooBlockPHPContents,
			wpLatestReleaseVersion,
			wcLatestReleaseVersion
		),
		'utf-8'
	);
	const updatedWooBlockPHPContent = updatedWooBlockPHPContentBuffer.toString(
		'base64'
	);

	const wooBlockPHPSha = wooBlockPHPResponse.data.sha;
	const updatedWooBlockPHPCommit = await octokit.repos.createOrUpdateFileContents(
		{
			...context.repo,
			message:
				'Update minimum required wc & wp versions in woocommerce-gutenberg-products-block.php',
			path: 'woocommerce-gutenberg-products-block.php',
			content: updatedWooBlockPHPContent,
			sha: wooBlockPHPSha,
			branch: context.payload.ref,
		}
	);

	if ( ! updatedWooBlockPHPCommit ) {
		debug(
			`releaseAutomation: Automatic update of woocommerce-gutenberg-products-block.php failed.`
		);
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
