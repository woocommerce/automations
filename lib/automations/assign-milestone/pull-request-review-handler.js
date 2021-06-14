/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const { getMilestoneByTitle } = require( '../../utils' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async ( context, octokit ) => {
	const pullNumber = context.payload.pull_request.number;
	const reviewState = context.payload.review.state;

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

	// Get version.
	debug( 'assign-milestone: Fetching `package.json` contents' );

	const {
		data: { content, encoding },
	} = await octokit.repos.getContents( {
		...context.repo,
		path: 'package.json',
	} );

	const { version } = JSON.parse(
		Buffer.from( content, encoding ).toString()
	);

	let [ major, minor ] = version.split( '.' ).map( Number );

	debug(
		`assign-milestone: Current plugin version is ${ major }.${ minor }`
	);

	// Calculate next milestone
	if ( minor === 9 ) {
		major += 1;
		minor = 0;
	} else {
		minor += 1;
	}

	const nextMilestone = `${ major }.${ minor }`;

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
