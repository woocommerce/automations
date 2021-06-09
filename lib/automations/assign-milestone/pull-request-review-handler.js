/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

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

	debug(
		`pullRequestReviewHandler: Pull Request number is [${ pullNumber }].`
	);
	debug( `pullRequestReviewHandler: Review state is [${ reviewState }].` );

	// Check state
	if ( reviewState !== 'approved' ) {
		debug(
			`pullRequestReviewHandler: Review state is not approved--bailing.`
		);
		return;
	}

	// Check current milestone
	if ( context.payload.pull_request.milestone !== null ) {
		debug(
			`pullRequestReviewHandler: Pull request already has a milestone--bailing.`
		);
		return;
	}

	// Get next milestone
	const milestones = await octokit.issues.listMilestones( {
		...context.repo,
		sort: 'due_on',
		direction: 'asc',
	} );

	if ( ! milestones.data || ! milestones.data[ 0 ] ) {
		debug(
			`pullRequestReviewHandler: There are no milestones available to assign to this PR.`
		);
		return;
	}

	const milestoneNumber = milestones.data[ 0 ].number;

	// Assign milestone
	const milestoneAssigned = await octokit.issues.update( {
		...context.repo,
		issue_number: pullNumber,
		milestone: milestoneNumber,
	} );

	if ( ! milestoneAssigned ) {
		debug(
			`pullRequestReviewHandler: Could not assign milestone [${ milestoneNumber }] to pull request [${ pullNumber }].`
		);
	}
};
