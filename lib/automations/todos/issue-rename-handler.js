/**
 * Internal dependencies
 */
const { titleChange } = require( './templates' );
const debug = require( '../../debug' );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

const botName = 'github-actions[bot]';

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async ( context, octokit ) => {
	const { issue, changes, sender } = context.payload;
	debug(
		`issueRenameHandler: context.actor = [${ context.actor }] issue.user.login = [${ issue.user.login }]`
	);
	if (
		sender.login !== botName &&
		issue.user.login === botName &&
		changes.title
	) {
		debug(
			`Renaming issue #${ issue.number } in ${ context.repo.owner }/${ context.repo.repo }`
		);
		return Promise.all( [
			octokit.issues.update( {
				...context.repo,
				issue_number: issue.number,
				title: changes.title.from,
			} ),
			octokit.issues.createComment( {
				...context.repo,
				issue_number: issue.number,
				body: titleChange(),
			} ),
		] );
	}
};
