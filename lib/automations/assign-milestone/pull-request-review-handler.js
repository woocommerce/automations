/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const { getMilestoneByTitle } = require( '../../utils' );
const getVersion = require( './get-version' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 */

const getTargetMilestone = ( major, minor, patch, bumpStrategy = 'none' ) => {
	if ( bumpStrategy === 'patch' ) {
		patch += 1;
		return `${ major }.${ minor }.${ patch }`;
	}

	if ( bumpStrategy === 'minor' ) {
		if ( minor === 9 ) {
			major += 1;
			minor = 0;
		} else {
			minor += 1;
		}
	}

	if ( bumpStrategy === 'major' ) {
		major += 1;
	}

	return `${ major }.${ minor }`;
};

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {Object} config
 */
module.exports = async ( context, octokit, config ) => {
	const pullNumber = context.payload.pull_request.number;
	const reviewState = context.payload.review.state;

	debug(
		`assign-milestone: Received config [${ JSON.stringify( config ) }].`
	);
	debug( `assign-milestone: Pull Request number is [${ pullNumber }].` );
	debug( `assign-milestone: Review state is [${ reviewState }].` );

	// Check state
	if ( reviewState !== 'approved' ) {
		debug( `assign-milestone: Review state is not approved--bailing.` );
		return;
	}

	// Check current milestone
	if ( context.payload.pull_request.milestone !== null ) {
		debug(
			`assign-milestone: Pull request already has a milestone--bailing.`
		);
		return;
	}

	const version = await getVersion( context, octokit );

	if ( ! version ) {
		debug(
			`assign-milestone: Unable to find current version number--bailing.`
		);
		return;
	}

	const [ major = 0, minor = 0, patch = 0 ] = version
		.split( '.' )
		.map( Number );

	debug(
		`assign-milestone: Current plugin version is ${ major }.${ minor }.${ patch }`
	);

	// Calculate next milestone
	const nextMilestone = getTargetMilestone(
		major,
		minor,
		patch,
		config.bumpStrategy
	);

	// Get next milestone
	const milestone = await getMilestoneByTitle(
		context,
		octokit,
		nextMilestone
	);

	if ( ! milestone ) {
		debug(
			`assign-milestone: Could not rediscover milestone by title: ${ nextMilestone }`
		);
		return;
	}

	// Assign milestone
	debug(
		`assign-milestone: Adding issue #${ pullNumber } to milestone #${ milestone.number }`
	);

	const milestoneAssigned = await octokit.issues.update( {
		...context.repo,
		issue_number: pullNumber,
		milestone: milestone.number,
	} );

	if ( ! milestoneAssigned ) {
		debug(
			`assign-milestone: Could not assign milestone [${ milestone.number }] to pull request [${ pullNumber }].`
		);
	}
};
