/**
 * Internal dependencies
 */
const debug = require( './debug' );

/** @typedef {import('./typedefs').AutomationTaskRunner} AutomationTaskRunner */

/**
 * Higher-order function which executes and returns the result of the given
 * runner only if the enhanced function is called with a payload indicating a
 * pull request event which did not originate from a forked repository.
 *
 * This can wrap all runners but will only execute on payloads that have a
 * pull_request property.
 *
 * @param {AutomationTaskRunner} runner Original runner.
 *
 * @return {AutomationTaskRunner} Enhanced task.
 */
function ifNotFork( runner ) {
	/** @type {AutomationTaskRunner} */
	const newRunner = ( payload, octokit ) => {
		if (
			! payload.pull_request ||
			payload.pull_request.head.repo.full_name ===
				payload.pull_request.base.repo.full_name
		) {
			return runner( payload, octokit );
		}
		debug( `main: Skipping ${ runner.name } because we are in a fork.` );
	};
	Object.defineProperty( newRunner, 'name', { value: runner.name } );
	return newRunner;
}

module.exports = ifNotFork;
