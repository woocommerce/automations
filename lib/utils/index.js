/**
 * Internal dependencies
 */
const { getMilestoneByTitle, getIssuesByMilestone } = require( './milestones' );
const { lineBreak, truncate } = require( './helpers' );

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
	lineBreak,
	truncate,
};
