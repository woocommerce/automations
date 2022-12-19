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
 * @param {Object} config
 */
module.exports = async ( context, octokit, config ) => {
	const targetMilestone = await getMilestoneByTitle(
		context,
		octokit,
		config.targetMilestone,
		'closed'
	);

	if ( ! targetMilestone ) {
		debug(
			`Update Milestone: Could not find the target milestone: ${ config.targetMilestone }`
		);
		return;
	}
	debug(
		`Update Milestone: Found the target milestone: ${ config.targetMilestone }`
	);

	if ( targetMilestone.due_on !== null ) {
		debug(
			`Update Milestone: Target milestone: ${ config.targetMilestone } already has a due date.`
		);
		return;
	}

	const updateDueDate = ( milestoneNumber, dueDate ) => {
		return octokit.issues.updateMilestone( {
			owner: context.repo.owner,
			repo: context.repo.repo,
			milestone_number: milestoneNumber,
			due_on: dueDate,
		} );
	};

	const date = new Date();
	const dueDate = date.toISOString();

	const milestoneUpdate = await updateDueDate(
		targetMilestone.number,
		dueDate
	);

	if ( ! milestoneUpdate ) {
		debug(
			`Update Milestone: Could not update the due date of the milestone: ${ config.targetMilestone }`
		);
		return;
	}

	debug(
		`Update Milestone: Milestone ${ config.targetMilestone } successfully updated with the ${ dueDate } due date.`
	);
};
