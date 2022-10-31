/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 9719:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * @typedef {import('./typedefs').AutomationTask} AutomationTask
 */

/**
 * @type {AutomationTask[]}
 */
module.exports = [
	__nccwpck_require__( 5852 ),
	__nccwpck_require__( 2498 ),
	__nccwpck_require__( 3762 ),
	__nccwpck_require__( 1450 ),
];


/***/ }),

/***/ 7381:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const { setFailed, getInput: coreGetInput } = __nccwpck_require__( 9590 );

const inputs = {
	bumpStrategy: {
		input: 'milestone_bump_strategy',
		allowed: [ 'none', 'patch', 'minor', 'major' ],
		default: 'minor',
		required: false,
	},
};

const getInput = ( input ) => {
	const value = coreGetInput( input.input ) || input.default;

	if ( input.required && ! value ) {
		throw new Error( `Missing required input ${ input.input }` );
	}

	if ( value && input.allowed && ! input.allowed.includes( value ) ) {
		throw new Error(
			`Input ${
				input.input
			} provided with value "${ value }" must be one of ${ JSON.stringify(
				input.allowed
			) }`
		);
	}

	return value;
};

module.exports = async () => {
	try {
		return {
			bumpStrategy: getInput( inputs.bumpStrategy ),
		};
	} catch ( error ) {
		setFailed( `assign-milestone: ${ error }` );
	}
};


/***/ }),

/***/ 7569:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const core = __nccwpck_require__( 9590 );

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 */

/**
 * Return the version found in package.json.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @return {string} Version
 */
module.exports = async ( context, octokit ) => {
	try {
		core.debug( 'Fetching `package.json` contents' );

		const response = await octokit.repos.getContent( {
			...context.repo,
			path: 'package.json',
		} );

		if (
			response.data &&
			response.data.content &&
			response.data.encoding
		) {
			const buffer = Buffer.from(
				response.data.content,
				response.data.encoding
			);
			const { version } = JSON.parse( buffer.toString( 'utf-8' ) );

			core.debug( `Found version: ${ version }` );

			return version;
		}

		throw new Error( 'No content found' );
	} catch ( error ) {
		core.debug(
			`Could not find version in package.json. Failed with error: ${ error }`
		);
	}

	return false;
};


/***/ }),

/***/ 3762:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const runner = __nccwpck_require__( 1390 );
const getConfig = __nccwpck_require__( 7381 );

module.exports = {
	name: 'assign-milestone',
	events: [ 'pull_request_review' ],
	actions: [ 'submitted', 'edited' ],
	runner,
	getConfig,
};


/***/ }),

/***/ 5663:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const debug = __nccwpck_require__( 1655 );
const { getMilestoneByTitle } = __nccwpck_require__( 675 );
const getVersion = __nccwpck_require__( 7569 );

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


/***/ }),

/***/ 1390:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const debug = __nccwpck_require__( 1655 );
const { setFailed } = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const pullRequestReviewHandler = __nccwpck_require__( 5663 );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

const runnerMatrix = {
	pull_request_review: {
		submitted: pullRequestReviewHandler,
		edited: pullRequestReviewHandler,
	},
};

/**
 * Whether or not this runner should run given the event and action.
 *
 * @param {string} eventName The event we want the runner for.
 * @param {string} [action]  The action we want the runner for.
 *
 * @return {AutomationTaskRunner} A runner function.
 */
const getRunnerTask = ( eventName, action ) => {
	if ( ! runnerMatrix[ eventName ] ) {
		return;
	}
	return action === undefined
		? runnerMatrix[ eventName ]
		: runnerMatrix[ eventName ][ action ];
};

/**
 * The task runner for this action
 *
 * @param {GitHubContext} context Context for the job run (github).
 * @param {GitHub}        octokit GitHub api helper.
 * @param {Object}        config  Config object.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit, config ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	if ( typeof task === 'function' ) {
		debug( `assignMilestoneRunner: Executing the ${ task.name } task.` );
		await task( context, octokit, config );
	} else {
		setFailed(
			`assignMilestoneRunner: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;


/***/ }),

/***/ 8601:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const { setFailed } = __nccwpck_require__( 9590 );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

/**
 * Extract only the changelog from the PR body.
 * Extract the content that is wrapped between backtips.
 * @param {string} pullRequestBody
 */
const parsePullRequestBody = ( pullRequestBody ) => {
	const body = pullRequestBody.match( /```([\s\S]*?)```/gm );

	if ( ! body || body.length === 0 ) {
		return pullRequestBody;
	}

	return body[ 0 ].replace( /```/gm, '' );
};

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {ReleaseConfig} config
 */
exports.attachChangelogHandler = async ( context, octokit ) => {
	const release = context.payload.release;
	const { repo } = context;

	const pullRequests = await octokit.search.issuesAndPullRequests( {
		q: `is:pr Release: ${ release.name } in:title repo:"${ repo.owner }/${ repo.repo }"`,
	} );

	if (
		pullRequests.data.items.length === 0 ||
		pullRequests.data.items.length > 1
	) {
		return setFailed(
			`Missing PR associated with the release ${ release.name } with tag ${ release.tag_name }`
		);
	}

	const pullRequest = await octokit.pulls.get( {
		...repo,
		pull_number: pullRequests.data.items[ 0 ].number,
	} );

	await octokit.repos.updateRelease( {
		...repo,
		release_id: release.id,
		body: parsePullRequestBody( pullRequest.data.body ),
	} );
};


/***/ }),

/***/ 3371:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const core = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const { getTemplate, TEMPLATES, compile } = __nccwpck_require__( 7921 );
const { lineBreak } = __nccwpck_require__( 675 );
const debug = __nccwpck_require__( 1655 );
const {
	getReleaseVersion,
	isPatchRelease,
	getReleaseBranch,
	duplicateChecker,
	hasMilestone: getHasMilestone,
} = __nccwpck_require__( 8037 );
const {
	getChangelog,
	getChangelogItems,
	getDevNoteItems,
} = __nccwpck_require__( 2981 );

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

	// Content comes from GH API in base64 so convert it to utf-8 string.
	const readmeBuffer = new Buffer.from( readmeResponse.data.content, 'base64' );
	const readmeContents = readmeBuffer.toString( 'utf-8' );

	// Need to convert back to base64 to write to the repo.
	const updatedReadmeContentBuffer = new Buffer.from( insertNewChangelogEntry( readmeContents, changelog, releaseVersion ), 'utf-8' );
	const updatedReadmeContent = updatedReadmeContentBuffer.toString( 'base64' );

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


/***/ }),

/***/ 7698:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const debug = __nccwpck_require__( 1655 );
const defaultConfig = __nccwpck_require__( 6736 );
const { validateConfig } = __nccwpck_require__( 7659 );

/**
 * External dependencies
 */
const core = __nccwpck_require__( 9590 );

/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

module.exports = {
	/**
	 * @param {GitHubContext} context
	 * @param {GitHub}        octokit
	 */
	getConfig: async ( context, octokit ) => {
		let repoConfig = {};
		// check if config file exists on GitHub repo.
		try {
			const response = await octokit.repos.getContent( {
				...context.repo,
				path: '.github/release-automation-config.json',
			} );
			core.debug( 'response: ' + JSON.stringify( response ) );
			if (
				response.data &&
				response.data.content &&
				response.data.encoding
			) {
				const buffer = Buffer.from(
					response.data.content,
					response.data.encoding
				);
				repoConfig = JSON.parse( buffer.toString( 'utf-8' ) );
			}
		} catch ( e ) {
			debug(
				`releaseRunner: Error retrieving the release-automation-config.json release config from the repository.`
			);
		}

		core.debug( 'retrieved config: ' + JSON.stringify( repoConfig ) );

		// validate config.
		validateConfig( repoConfig );

		// merge configs with defaultConfig back filling.
		return {
			...defaultConfig,
			...repoConfig,
		};
	},
};


/***/ }),

/***/ 7659:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const { setFailed } = __nccwpck_require__( 9590 );

const types = {
	labelTypeMap: {
		type: 'object',
		items: {
			type: 'string',
		},
	},
	groupTitleOrder: {
		type: 'array',
		items: {
			type: 'string',
		},
	},
	rewordTerms: {
		type: 'object',
		items: {
			type: 'string',
		},
	},
	labelTypePrefix: {
		type: 'string',
	},
	needsDevNoteLabel: {
		type: 'string',
	},
	labelsToOmit: {
		type: 'array',
		items: {
			type: 'string',
		},
	},
};

const failForType = ( configName, reason ) => {
	setFailed(
		`releaseAutomation: Validation for the config property ${ configName } failed because ${ reason }`
	);
};

module.exports = {
	/**
	 * If an invalid type is passed in then the action is failed with a message.
	 *
	 * @param {Object} config Incoming config object to validate against types.
	 */
	validateConfig: ( config ) => {
		Object.keys( types ).forEach( ( configKey ) => {
			// only validate if the configKey exists in the config.
			if ( config[ configKey ] ) {
				const configValue = config[ configKey ];
				const typeToCheck = types[ configKey ].type;
				// special case for Object because arrays are objects in JS
				if ( typeToCheck === 'object' ) {
					if ( Array.isArray( configValue ) ) {
						failForType(
							configKey,
							'its an Array when an object is expected'
						);
						throw new Error( 'Invalid type' );
					}
				}
				if ( typeToCheck === 'array' ) {
					if ( ! Array.isArray( configValue ) ) {
						failForType(
							configKey,
							'it is not an array when an array is expected'
						);
						throw new Error( 'Invalid type' );
					}
				}
				// all other type checks.
				if (
					typeToCheck !== 'array' &&
					typeof configValue !== typeToCheck
				) {
					failForType(
						configKey,
						`it is not an ${ typeToCheck } (but a ${ typeof configValue })`
					);
					throw new Error( 'Invalid type' );
				}
				if ( types[ configKey ].items ) {
					const expectedItemType = types[ configKey ].items.type;
					const values =
						typeToCheck === 'array'
							? configValue
							: Object.values( configValue );
					if (
						values.filter(
							( value ) => typeof value !== expectedItemType
						).length !== 0
					) {
						failForType(
							configKey,
							`it expects values in the ${ typeToCheck } for the ${ configKey } property to be of type ${ expectedItemType }. Something in the ${ typeToCheck } is not that type.`
						);
						throw new Error( 'Invalid type' );
					}
				}
			}
		} );
	},
};


/***/ }),

/***/ 2498:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const runner = __nccwpck_require__( 3233 );
const { getConfig } = __nccwpck_require__( 7698 );

module.exports = {
	name: 'release',
	events: [ 'create', 'release' ],
	runner,
	getConfig,
};


/***/ }),

/***/ 3233:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const debug = __nccwpck_require__( 1655 );
const { setFailed, debug: coreDebug } = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const branchCreateHandler = __nccwpck_require__( 3371 );
const {
	attachChangelogHandler,
} = __nccwpck_require__( 8601 );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 * @typedef {import('../../typedefs').ReleaseConfig} ReleaseConfig
 */

const runnerMatrix = {
	create: branchCreateHandler,
	release: {
		published: attachChangelogHandler,
	},
};

/**
 * Whether or not this runner should run given the event and action.
 *
 * @param {string} eventName The event we want the runner for.
 * @param {string} [action]  The action we want the runner for.
 *
 * @return {AutomationTaskRunner} A runner function.
 */
const getRunnerTask = ( eventName, action ) => {
	if ( ! runnerMatrix[ eventName ] ) {
		return;
	}
	return action === undefined
		? runnerMatrix[ eventName ]
		: runnerMatrix[ eventName ][ action ];
};

/**
 * The task runner for the Todos action
 *
 * @param {GitHubContext} context Context for the job run (github).
 * @param {GitHub}        octokit GitHub api helper.
 * @param {ReleaseConfig} config  The config for the release automation.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit, config ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	coreDebug( 'Received config: ' + JSON.stringify( config ) );
	if ( typeof task === 'function' ) {
		debug( `releaseRunner: Executing the ${ task.name } task.` );
		await task( context, octokit, config );
	} else {
		setFailed(
			`releaseRunner: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;


/***/ }),

/***/ 7921:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const fs = __nccwpck_require__( 7147 );
const path = __nccwpck_require__( 1017 );
const { handlebars } = __nccwpck_require__( 5320 );
const core = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const debug = __nccwpck_require__( 1655 );

/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

const TEMPLATES = {
	releasePullRequest: 'release-pull-request',
	patchReleasePullRequest: 'patch-release-pull-request',
	releaseInitialChecklist: 'release-initial-checklist',
	patchInitialChecklist: 'patch-initial-checklist',
};

const prFooter = `\n\n
###### :rocket: This pull request was generated by the [automations bot]({{ automationUrl }}) triggered by the creation of the branch: \`{{releaseBranch}}\`. cc @{{ username }}
`;

const commentFooter = `\n\n
###### :rocket: This comment was generated by the [automations bot]({{ automationUrl }}) triggered by the creation of the branch: \`{{releaseBranch}}\`. cc @{{ username }}
`;

handlebars.registerHelper(
	'githubHost',
	() => process.env.GHE_HOST || 'github.com'
);

handlebars.registerHelper(
	'automationUrl',
	() => 'https://github.com/woocommerce/automations'
);

module.exports = {
	TEMPLATES,
	/**
	 * @param {string}        name    Name of template to get
	 * @param {GitHubContext} context
	 * @param {GitHub}        octokit
	 */
	getTemplate: async ( name, context, octokit ) => {
		const templates = {
			[ TEMPLATES.releasePullRequest ]: {
				fallBack: 'release-pull-request.md',
				canOverride: true,
				footer: prFooter,
			},
			[ TEMPLATES.patchReleasePullRequest ]: {
				fallBack: 'patch-release-pull-request.md',
				canOverride: true,
				footer: prFooter,
			},
			[ TEMPLATES.releaseInitialChecklist ]: {
				fallBack: 'release-initial-checklist.md',
				canOverride: true,
				footer: commentFooter,
			},
			[ TEMPLATES.patchInitialChecklist ]: {
				fallBack: 'patch-initial-checklist.md',
				canOverride: true,
				footer: commentFooter,
			},
		};
		const templateObject = templates[ name ] || '';
		if ( ! templateObject ) {
			throw new Error(
				`There is no template supported for the given template named "${ name }"`
			);
		}
		// check if template exists on github repo
		let templateContents = '';
		if ( templateObject.canOverride ) {
			try {
				const response = await octokit.repos.getContent( {
					...context.repo,
					path: `.github/${ name }.md`,
				} );
				core.debug( 'template response:' + JSON.stringify( response ) );
				if (
					response.data &&
					response.data.content &&
					response.data.encoding
				) {
					const buffer = Buffer.from(
						response.data.content,
						response.data.encoding
					);
					templateContents = buffer.toString( 'utf-8' );
				}
			} catch ( e ) {
				debug(
					`releaseRunner: Error retrieving the ${ name } template from the repository.`
				);
			}
		}
		// if templateContents is empty (or template cannot be overridden) then let's fallback to
		// the default template
		if ( ! templateContents ) {
			templateContents = fs.readFileSync(
				path.resolve(
					`./lib/automations/release/templates/${ templateObject.fallBack }`
				),
				'utf-8'
			);
		}
		return templateContents + templateObject.footer;
	},
	compile: ( contents ) => handlebars.compile( contents, { noEscape: true } ),
};


/***/ }),

/***/ 2336:
/***/ ((module) => {

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub}  GitHub
 */

/**
 * Checks to see if a pull requests already exists with the given title.
 *
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 * @param {string}        title    The title being checked for.
 *
 * @return {boolean} Existing pr if found, title if already
 *                                   processed, or undefined if new issue can be
 *                                   created.
 */
const duplicateChecker = async ( context, octokit, title ) => {
	const openSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title type:pr is:open repo:${ context.payload.repository.full_name }`,
		per_page: 50,
	} );

	// if there's a match with open pr then abort early
	if (
		openSearch.data.items.filter( ( pr ) => pr.title === title ).length > 0
	) {
		return true;
	}

	const closedMergedSearch = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title is:closed type:pr repo:${ context.payload.repository.full_name } is:merged`,
		per_page: 50,
	} );

	// if we have a match to the title in these results, then that means we return true
	// because the pull request was merged and thus we should not end up creating
	// another pull request (the branch is reopened for another reason)
	if (
		closedMergedSearch.data.items.filter( ( pr ) => pr.title === title )
			.length > 0
	) {
		return true;
	}

	// otherwise there' no match considered (even if there are unmerged closed prs matching the title)
	return false;
};

module.exports = duplicateChecker;


/***/ }),

/***/ 1783:
/***/ ((module) => {

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 */

/**
 * Return release branch name for the given patchVersion.
 *
 * So if the patch version is 2.0.1, then this will check for any of the
 * following branches:
 *
 * - release/2.0
 * - release/2.0.0
 *
 * If any of the above exist then will return the actual branch name,
 * otherwise false.
 *
 * @param {string}        patchVersion
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 *
 * @return {boolean|string} If a branch is found then the branch.name is returned,
 *                        otherwise false.
 */
module.exports = async ( patchVersion, context, octokit ) => {
	const releaseVersion = patchVersion
		.split( '.' )
		.slice( 0, 2 )
		.join( '.' );
	let branch;
	try {
		branch = await octokit.repos.getBranch( {
			...context.repo,
			branch: `release/${ releaseVersion }`,
		} );
	} catch ( error ) {
		// if branch doesn't exist try the canonical `.0` version.
		try {
			if ( error && error.message ) {
				branch = await octokit.repos.getBranch( {
					...context.repo,
					branch: `release/${ releaseVersion }.0`,
				} );
			}
		} catch ( e ) {
			//pass thru
		}
	}

	return branch && branch.data && branch.data.name ? branch.data.name : false;
};


/***/ }),

/***/ 4200:
/***/ ((module) => {

const normalizeReleaseVersion = ( version ) => {
	const splitVersion = version.split( '.' );
	switch ( splitVersion.length ) {
		case 1:
			return `${ version }.0.0`;
		case 2:
			return `${ version }.0`;
	}
	return version;
};

/**
 * @param {Object} payload The webhook payload for the GitHub create event.
 */
module.exports = ( payload ) => {
	const ref = payload.ref || '';
	if ( ! ref || ! ref.includes( 'release/' ) ) {
		return '';
	}
	return normalizeReleaseVersion( ref.replace( 'release/', '' ) );
};


/***/ }),

/***/ 8865:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const { getMilestoneByTitle } = __nccwpck_require__( 675 );

/**
 * External dependencies
 */
const core = __nccwpck_require__( 9590 );

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').IssueState} IssueState
 */

/**
 * Return whether or not there is a milestone for the provided version.
 *
 * @param {string} version
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 * @param {IssueState} state
 * @return {boolean} True if there is a milestone.
 */
module.exports = async ( version, context, octokit, state = 'open' ) => {
	const milestone = await getMilestoneByTitle(
		context,
		octokit,
		version,
		state
	);
	core.debug( `Milestone retrieved: ${ milestone }` );
	return !! milestone;
};


/***/ }),

/***/ 8037:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = {
	getReleaseVersion: __nccwpck_require__( 4200 ),
	isPatchRelease: __nccwpck_require__( 6192 ),
	getReleaseBranch: __nccwpck_require__( 1783 ),
	duplicateChecker: __nccwpck_require__( 2336 ),
	hasMilestone: __nccwpck_require__( 8865 ),
};


/***/ }),

/***/ 6192:
/***/ ((module) => {

module.exports = ( version ) => {
	const splitVersion = version.split( '.' );
	let isPatchRelease = splitVersion.length > 2 && splitVersion[ 2 ] !== '0';
	if ( splitVersion.length > 3 ) {
		isPatchRelease = splitVersion[ 3 ] !== '0';
	}
	return isPatchRelease;
};


/***/ }),

/***/ 5852:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const runner = __nccwpck_require__( 2317 );

module.exports = {
	name: 'todos',
	events: [ 'pull_request', 'push', 'issues' ],
	actions: [ 'opened', 'synchronize', 'closed', 'edited' ],
	runner,
};


/***/ }),

/***/ 481:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const { titleChange } = __nccwpck_require__( 3125 );
const debug = __nccwpck_require__( 1655 );

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


/***/ }),

/***/ 8355:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const { comment } = __nccwpck_require__( 3125 );
const { lineBreak } = __nccwpck_require__( 675 );
const getTodos = __nccwpck_require__( 2743 );
const debug = __nccwpck_require__( 1655 );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async ( context, octokit ) => {
	const pullNumber = context.payload.number;
	const { data: comments } = await octokit.issues.listComments( {
		...context.repo,
		issue_number: pullNumber,
	} );

	/**
	 * @type {TodoItem[]}
	 */
	const todos = await getTodos( context, octokit );
	if ( ! todos || ! Array.isArray( todos ) ) {
		debug( `pullRequestHandler: No todos were found in the changeset.` );
		return;
	}
	todos.forEach(
		async ( {
			keyword,
			title,
			content,
			fileName,
			range,
			sha,
			username,
			number,
		} ) => {
			// Does PR already have a comment for this item?
			if (
				comments.some( ( issueComment ) =>
					issueComment.body.startsWith( `## ${ title }` )
				)
			) {
				debug( `Comment with title [${ title }] already exists` );
				return;
			}
			let body = comment( {
				...context.repo,
				title,
				body: content,
				sha,
				username,
				number,
				range,
				fileName,
				keyword,
			} );
			body = lineBreak( body );
			const { owner, repo } = context.repo;
			debug(
				`Creating comment [${ title }] in [${ owner }/${ repo }#${ number }]`
			);
			await octokit.issues.createComment( {
				...context.repo,
				issue_number: pullNumber,
				body,
			} );
		}
	);
};


/***/ }),

/***/ 8416:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const {
	duplicateChecker: checkForDuplicateIssue,
} = __nccwpck_require__( 9874 );
const reopenClosed = __nccwpck_require__( 2225 );
const { lineBreak, truncate } = __nccwpck_require__( 675 );
const { issueFromMerge } = __nccwpck_require__( 3125 );
const getTodos = __nccwpck_require__( 2743 );
const debug = __nccwpck_require__( 1655 );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async ( context, octokit ) => {
	// if the pull is closed but not merged, skip
	if ( ! context.payload.pull_request.merged ) {
		return;
	}

	/**
	 * @type {TodoItem[]}
	 */
	const todos = await getTodos( context, octokit );
	if ( ! todos || ! Array.isArray( todos ) ) {
		debug( `pullRequestHandler: No todos were found in the changeset.` );
		return;
	}
	todos.forEach(
		async ( {
			keyword,
			title,
			content,
			fileName,
			range,
			sha,
			username,
			number,
		} ) => {
			// Prevent duplicates!
			const existingIssue = await checkForDuplicateIssue(
				context,
				octokit,
				title
			);
			if ( existingIssue ) {
				debug( `Duplicate issue found with title [${ title }]` );
				return reopenClosed(
					{ context, octokit, issue: existingIssue },
					{ keyword, title, sha, fileName }
				);
			}
			let body = issueFromMerge( {
				...context.repo,
				sha,
				username,
				range,
				fileName,
				keyword,
				number,
				title,
				body: content,
			} );
			body = lineBreak( body );
			const { owner, repo } = context.repo;
			debug( `Creating issue [${ title }] in [${ owner }/${ repo }]` );
			return await octokit.issues.create( {
				...context.repo,
				title: truncate( title ),
				body,
			} );
		}
	);
};


/***/ }),

/***/ 2919:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const {
	duplicateChecker: checkForDuplicateIssue,
} = __nccwpck_require__( 9874 );
const { lineBreak, truncate } = __nccwpck_require__( 675 );
const reopenClosed = __nccwpck_require__( 2225 );
const { issue } = __nccwpck_require__( 3125 );
const getTodos = __nccwpck_require__( 2743 );
const debug = __nccwpck_require__( 1655 );

/**
 * @typedef {import('../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../typedefs').GitHub} GitHub
 * @typedef {import('../../typedefs').TodoItem} TodoItem
 */

/**
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 */
module.exports = async ( context, octokit ) => {
	// Only trigger on pushes to default branch
	if (
		context.payload.ref !==
		`refs/heads/${ context.payload.repository.master_branch }`
	) {
		return;
	}

	// Do not trigger on merge commits
	const commit = await octokit.git.getCommit( {
		...context.repo,
		commit_sha: context.payload.head_commit.id,
	} );
	if ( commit.data.parents.length > 1 ) {
		return;
	}

	/**
	 * @type {TodoItem[]}
	 */
	const todos = await getTodos( context, octokit );
	if ( ! todos || ! Array.isArray( todos ) ) {
		debug( `pullRequestHandler: No todos were found fin the changeset.` );
		return;
	}
	todos.forEach(
		async ( {
			keyword,
			title,
			content,
			fileName,
			range,
			sha,
			username,
		} ) => {
			// Prevent duplicates
			const existingIssue = await checkForDuplicateIssue(
				context,
				octokit,
				title
			);
			if ( existingIssue ) {
				debug( `Duplicate issue found with title [${ title }]` );
				return reopenClosed(
					{ context, octokit, issue: existingIssue },
					{ keyword, sha, fileName }
				);
			}
			// Actually create the issue
			const body = lineBreak(
				issue( {
					...context.repo,
					sha,
					username,
					range,
					fileName,
					keyword,
					body: content,
					title,
				} )
			);

			const { owner, repo } = context.repo;
			debug( `Creating issue [${ title }] in [${ owner }/${ repo }]` );
			return octokit.issues.create( {
				...context.repo,
				title: truncate( title ),
				body,
			} );
		}
	);
};


/***/ }),

/***/ 2317:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const debug = __nccwpck_require__( 1655 );
const { setFailed } = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const pullRequestHandler = __nccwpck_require__( 8355 );
const pullRequestMergeHandler = __nccwpck_require__( 8416 );
const pushHandler = __nccwpck_require__( 2919 );
const issueRenameHandler = __nccwpck_require__( 481 );

/**
 * @typedef {import('@actions/github').GitHub} GitHub
 * @typedef {import('@actions/github').context} GitHubContext
 * @typedef {import('../../typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

const runnerMatrix = {
	pull_request: {
		opened: pullRequestHandler,
		synchronize: pullRequestHandler,
		closed: pullRequestMergeHandler,
	},
	push: pushHandler,
	issues: {
		edited: issueRenameHandler,
	},
};

/**
 * Whether or not this runner should run given the event and action.
 *
 * @param {string} eventName The event we want the runner for.
 * @param {string} [action]  The action we want the runner for.
 *
 * @return {AutomationTaskRunner} A runner function.
 */
const getRunnerTask = ( eventName, action ) => {
	if ( ! runnerMatrix[ eventName ] ) {
		return;
	}
	return action === undefined
		? runnerMatrix[ eventName ]
		: runnerMatrix[ eventName ][ action ];
};

/**
 * The task runner for the Todos action
 *
 * @param {GitHubContext} context Context for the job run (github).
 * @param {GitHub}        octokit GitHub api helper.
 *
 * @return {AutomationTaskRunner} task runner.
 */
const runner = async ( context, octokit ) => {
	const task = getRunnerTask( context.eventName, context.payload.action );
	if ( typeof task === 'function' ) {
		debug( `todoRunner: Executing the ${ task.name } task.` );
		await task( context, octokit );
	} else {
		setFailed(
			`todoRunner: There is no configured task for the event = '${ context.eventName }' and the payload action = '${ context.payload.action }'`
		);
	}
};

module.exports = runner;


/***/ }),

/***/ 4351:
/***/ ((module) => {

module.exports = `## {{ title }}
{{#if body}}
{{ body }}

---
{{/if}}
{{#if range}}
https://{{ githubHost }}/{{ owner }}/{{ repo }}/blob/{{ sha }}/{{ fileName }}#{{ range }}
---
{{/if}}
###### :rocket: This comment was generated by the [automations bot]({{ todoUrl }}) based on a \`{{ keyword }}\` comment in {{ sha }} in #{{ number }}. cc @{{ username }}`;


/***/ }),

/***/ 3125:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const { handlebars } = __nccwpck_require__( 5320 );

/**
 * Internal dependencies
 */
const comment = __nccwpck_require__( 4351 );
const issue = __nccwpck_require__( 6656 );
const issueFromMerge = __nccwpck_require__( 5470 );
const titleChange = __nccwpck_require__( 7093 );
const reopenClosed = __nccwpck_require__( 3136 );

// Register a githubHost global helper to make links respect the GHE_HOST env var
handlebars.registerHelper(
	'githubHost',
	() => process.env.GHE_HOST || 'github.com'
);

handlebars.registerHelper(
	'todoUrl',
	() => 'https://github.com/woocommerce/automations'
);

const moduleMap = {
	comment,
	issue,
	issueFromMerge,
	titleChange,
	reopenClosed,
};

const compile = ( moduleName ) => handlebars.compile( moduleMap[ moduleName ] );

module.exports = {
	comment: compile( 'comment' ),
	issue: compile( 'issue' ),
	issueFromMerge: compile( 'issueFromMerge' ),
	titleChange: compile( 'titleChange' ),
	reopenClosed: compile( 'reopenClosed' ),
};


/***/ }),

/***/ 5470:
/***/ ((module) => {

module.exports = `{{#if body}}
{{ body }}

---
{{/if}}
{{#if range}}
https://{{ githubHost }}/{{ owner }}/{{ repo }}/blob/{{ sha }}/{{ fileName }}#{{ range }}
---
{{/if}}
###### :rocket: This issue was generated by the [automations bot]({{ todoUrl }}) based on a \`{{ keyword }}\` comment in {{ sha }} when #{{ number }} was merged. cc @{{ username }}`;


/***/ }),

/***/ 6656:
/***/ ((module) => {

module.exports = `{{#if body}}
{{ body }}

---
{{/if}}
{{#if range}}
https://{{ githubHost }}/{{ owner }}/{{ repo }}/blob/{{ sha }}/{{ fileName }}#{{ range }}
---
{{/if}}
###### :rocket: This issue was generated by the [automations bot]({{ todoUrl }}) based on a \`{{ keyword }}\` comment in {{ sha }}. cc @{{ username }}`;


/***/ }),

/***/ 3136:
/***/ ((module) => {

module.exports = `:rocket: This issue has been reopened because the **\`{{ keyword }}\`** comment still exists in [**{{ filename }}**](https://{{ githubHost }}/{{ owner }}/{{ repo }}/blob/{{ sha }}/{{ filename }}), as of {{ sha }}.

---
###### If this was not intentional, just remove the comment from your code.`;


/***/ }),

/***/ 7093:
/***/ ((module) => {

module.exports =
	':rocket: Please do not change this issue title! **The todo action** uses it to prevent duplicate issues from being opened. If you think this is an error, please [open an issue]({{ todoUrl }}/issues/new)!';


/***/ }),

/***/ 9874:
/***/ ((module) => {

/**
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub}  GitHub
 */

let todoTitlesVerified = [];

/**
 * Checks to see if an issue already exists with the given title.
 *
 * @param {GitHubContext} context
 * @param {GitHub}        octokit
 * @param {string}        title    The title being checked for.
 *
 * @return {string|Object|undefined} Existing issue if found, title if already
 *                                   processed, or undefined if new issue can be
 *                                   created.
 */
const duplicateChecker = async ( context, octokit, title ) => {
	if ( todoTitlesVerified.includes( title ) ) {
		return title;
	}
	todoTitlesVerified.push( title );

	const search = await octokit.search.issuesAndPullRequests( {
		q: `${ title } in:title repo:${ context.payload.repository.full_name }`,
		per_page: 100,
	} );

	if ( search.data.total_count !== 0 ) {
		const existingIssue = search.data.items.find(
			( issue ) => issue.title === title
		);
		return existingIssue;
	}
};

module.exports = {
	duplicateChecker,
	reset: () => ( todoTitlesVerified = [] ),
};


/***/ }),

/***/ 9799:
/***/ ((module) => {

/**
 * @typedef {import('../../../typedefs').TodoDetails} TodoDetails
 * @typedef {import('../../../typedefs').FileBoundaries} FileBoundaries
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').DiffChunk}  DiffChunk
 * @typedef {import('../../../typedefs').DiffChange} DiffChange
 */

/**
 * Get the file boundaries of the hunk
 *
 * @param {DiffChange} lastChange
 * @param {number} line
 * @param {number} [padding=2]
 * @return {FileBoundaries} An object.
 */
function getFileBoundaries( lastChange, line, padding = 2 ) {
	const end = Math.min( line + padding, lastChange.ln || lastChange.ln2 );
	return { start: line, end };
}

/**
 * Prepares some details about the TODO
 *
 * @param {Object} params
 * @param {GitHubContext} params.context
 * @param {DiffChunk} params.chunk
 * @param {Object} params.config
 * @param {number} params.line
 * @return {TodoDetails} Todo details.
 */
module.exports = ( { context, chunk, config, line, lineCount } ) => {
	const number = context.payload.pull_request ? context.payload.number : null;

	let username, sha;
	if ( context.payload.head_commit ) {
		// Get it from the head commit in this push
		username = context.payload.head_commit.author.username;
		sha = context.payload.head_commit.id;
	} else {
		// Get it from the head ref in this PR
		username = context.payload.pull_request.user.login;
		sha = context.payload.pull_request.head.sha;
	}

	const blobLines = ( config.blobLines || 10 ) + lineCount;
	const lastChange = chunk.changes[ chunk.changes.length - 1 ];
	const { start, end } = getFileBoundaries( lastChange, line, blobLines );
	const range = start === end ? `L${ start }` : `L${ start }-L${ end }`;

	return {
		username,
		sha,
		number,
		range,
	};
};


/***/ }),

/***/ 5378:
/***/ ((module) => {

/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').context} GitHubContext
 */

/**
 * Gets the commit using the diff header
 *
 * @param {GitHubContext} context GitHub context helper.
 * @param {GitHub}        octokit        GitHub helper.
 *
 * @return {Object} The diff response
 */
async function getCommit( context, octokit ) {
	if ( context.eventName === 'push' ) {
		return octokit.repos.getCommit( {
			...context.repo,
			ref: context.payload.head_commit.id,
			mediaType: {
				format: 'diff',
			},
		} );
	}
	return octokit.pulls.get( {
		...context.repo,
		pull_number: context.payload.number,
		mediaType: {
			format: 'diff',
		},
	} );
}

/**
 * Gets the commit using the diff header
 *
 * @param {GitHubContext} context GitHub context helper.
 * @param {GitHub}        octokit        GitHub helper.
 *
 * @return {string} The diff as a string.
 */
module.exports = async ( context, octokit ) => {
	const diff = await getCommit( context, octokit );
	return diff.data;
};


/***/ }),

/***/ 2743:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const parseDiff = __nccwpck_require__( 335 );

/**
 * Internal dependencies
 */
const getDiff = __nccwpck_require__( 5378 );
const parseTodoFromChunk = __nccwpck_require__( 1018 );

/**
 * @typedef {import('../../../typedefs').TodoDetails} TodoDetails
 * @typedef {import('../../../typedefs').FileBoundaries} FileBoundaries
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').TodoItem} TodoItem
 */

/**
 * Used to retrieve todo information for usage from the given context.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit
 *
 * @return {TodoItem[]} An array of todo items.
 */
module.exports = async ( context, octokit ) => {
	let todos = [];
	// Get the diff for this commit or PR
	const diff = await getDiff( context, octokit );
	if ( ! diff ) {
		return todos;
	}

	// Parse the diff as files
	const files = parseDiff( diff );
	files.forEach( ( file ) => {
		// loop through every chunk in a file
		file.chunks.forEach( ( chunk ) => {
			const todosForChunk = parseTodoFromChunk( chunk, context, file );
			todos = [ ...todos, ...todosForChunk ];
		} );
	} );
	return todos;
};


/***/ }),

/***/ 1018:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const getDetails = __nccwpck_require__( 9799 );
const debug = __nccwpck_require__( 1655 );

// local variables for parsing todos.
let inTodoBody = false;
let inListItem = false;
let todoBody = '';
let todos = [];
let line = null;
let lineCount = 0;
let index = null;

const fullReset = () => {
	inTodoBody = false;
	inListItem = false;
	todoBody = '';
	todos = [];
	lineCount = 0;
	line = null;
	index = null;
};

const parseTodo = ( change, currentIndex ) => {
	// regex pattern.
	const todoPattern = /.*(?<commentDelimiter>\*(?!\/)|\/\/)(\s((?<hasTodo>todo|@todo)\b|(?<hasParam>(@(?!todo).*?\s)))\s?:?\s*(?<title>.*)|\s*?(?<body>.*(?<!\/)))/gim;
	const matches = todoPattern.exec( change.content.trim() );
	switch ( true ) {
		case ! matches:
		case !! matches.groups.hasParam:
		case ! matches.groups.commentDelimiter:
			return false;
		case !! matches.groups.hasTodo:
			if ( inTodoBody ) {
				return null;
			}
			updateLineAndIndex( change, currentIndex );
			updateTodoBody( matches.groups.title );
			break;
		case !! matches.groups.body && inTodoBody:
			updateTodoBody( matches.groups.body );
			break;
		case !! matches.groups.commentDelimiter && inTodoBody:
			updateTodoWithLineBreak();
			break;
	}
	return true;
};

const getFirstSentence = ( content ) => {
	const pattern = /^.*?[.!?\:](?:\s|$)(?!.*\))/gim;
	const match = pattern.exec( content );
	const sentence = match !== null && match[ 0 ] ? match[ 0 ] : content;
	return sentence.length > 60
		? sentence.substring( 0, 57 ) + '...'
		: sentence;
};

const updateTodos = ( chunk, context, file, config ) => {
	if ( ! inTodoBody || ! todoBody ) {
		return;
	}
	const details = getDetails( {
		context,
		chunk,
		config,
		line,
		lineCount,
	} );
	debug(
		`todoParse: Todo item parsed [${ todoBody }] starting at line [${ line }] in [${ details.sha }]`
	);
	todos.push( {
		keyword: 'todo',
		title: getFirstSentence( todoBody ).trim(),
		content: todoBody.trim(),
		fileName: file.to,
		chunk,
		index,
		...details,
	} );
	todoBody = '';
	inTodoBody = false;
};

const updateLineAndIndex = ( change, newIndex ) => {
	line = change.ln || change.ln2;
	index = newIndex;
};

const updateTodoBody = ( content ) => {
	if ( ! content || content.length > 256 ) {
		updateTodos();
		return;
	}
	lineCount++;

	// possible dash indicating list item?
	if ( /^\s*?\-/.exec( content ) ) {
		todoBody += '\n' + content.trim();
		inListItem = true;
		// not a list item but in list item content? then add one more line break
		// and break out of list item content.
	} else if ( inListItem ) {
		todoBody += '\n' + content.trim();
		inListItem = false;
	} else {
		todoBody +=
			inTodoBody && /$\n\n/gim.exec( todoBody ) === null
				? ' ' + content.trim()
				: content.trim();
	}
	inTodoBody = true;
};

const updateTodoWithLineBreak = () => {
	inTodoBody = true;
	lineCount++;
	todoBody += '\n\n';
};

const parseTodoFromChunk = ( chunk, context, file, config = {} ) => {
	fullReset();
	chunk.changes.forEach( ( change, currentIndex ) => {
		if ( change.type !== 'add' ) {
			return;
		}
		let continueParsing = parseTodo( change, currentIndex );
		// if null, that means updateTodos then repeat the parse. This happens
		// when a todo breaks up the parsing of one in progress chunk.
		if ( continueParsing === null ) {
			updateTodos( chunk, context, file, config );
			continueParsing = parseTodo( change, currentIndex );
		}
		// if false, that means the parsing is done for a multi-line todo and
		// the current todo can be updated.
		if ( ! continueParsing ) {
			updateTodos( chunk, context, file, config );
		}
	} );
	updateTodos( chunk, context, file, config );
	return todos;
};

module.exports = parseTodoFromChunk;


/***/ }),

/***/ 2225:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const { reopenClosed } = __nccwpck_require__( 3125 );

/**
 * @typedef {import('../../../typedefs').ReopenClosedData} ReopenClosedData
 * @typedef {import('../../../typedefs').GitHub} GitHub
 * @typedef {import('../../../typedefs').GitHubContext} GitHubContext
 */

/**
 * Reopen a closed issue and post a comment saying what happened and why
 *
 * @param {Object} params
 * @param {GitHubContext} params.context
 * @param {GitHub} params.octokit
 * @param {Object} params.config
 * @param {Object} params.issue
 * @param {ReopenClosedData} data
 *
 * @return {Object} Github comment object.
 */
module.exports = async ( { context, octokit, config = {}, issue }, data ) => {
	const { reOpenClosed: reOpenIssue = true } = config;
	if ( typeof issue !== 'object' ) {
		return;
	}
	if ( issue.state === 'closed' && reOpenIssue ) {
		const body = reopenClosed( {
			...context.repo,
			...data,
		} );
		return Promise.all( [
			octokit.issues.update( {
				...context.repo,
				issue_number: issue.number,
				state: 'open',
			} ),
			octokit.issues.createComment( {
				...context.repo,
				issue_number: issue.number,
				body,
			} ),
		] );
	}
};


/***/ }),

/***/ 1450:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const runner = __nccwpck_require__( 7487 );

module.exports = {
	name: 'update-milestone',
	events: [ 'released' ],
	actions: [ 'update-milestone' ],
	runner,
};


/***/ }),

/***/ 7487:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const debug = __nccwpck_require__( 1655 );
//const { setFailed, debug: coreDebug } = require( '@actions/core' );

const runner = async ( context, octokit, config ) => {
	debug( `eventName: ${ context.eventName }.` );
	debug( `payload: ${ context.payload.action }.` );
};

module.exports = runner;


/***/ }),

/***/ 1655:
/***/ ((module) => {

/**
 * Prints a debug message to STDOUT in non-testing environments.
 *
 * @param {string} message The message to print.
 */
function debug( message ) {
	if ( process.env.NODE_ENV !== 'test' ) {
		process.stdout.write( message + '\n' );
	}
}

module.exports = debug;


/***/ }),

/***/ 4283:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const debug = __nccwpck_require__( 1655 );

/**
 * @typedef {import('./typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

/**
 * Higher-order function which executes and returns the result of the given
 * runner only if the enhanced function is called with a payload indicating a
 * pull request event which did not originate from a forked repository.
 *
 * This can wrap all runners but will only execute on payloads that have a
 * pull_request property.
 *
 * @param {AutomationTaskRunner} runner Original runner.
 * @return {AutomationTaskRunner} Enhanced task.
 */
function ifNotFork( runner ) {
	/** @type {AutomationTaskRunner} */
	const newRunner = ( payload, octokit, config ) => {
		if (
			! payload.pull_request ||
			payload.pull_request.head.repo.full_name ===
				payload.pull_request.base.repo.full_name
		) {
			return runner( payload, octokit, config );
		}
		debug( `main: Skipping ${ runner.name } because we are in a fork.` );
	};
	Object.defineProperty( newRunner, 'name', { value: runner.name } );
	return newRunner;
}

module.exports = ifNotFork;


/***/ }),

/***/ 8445:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Note: much of this was taken from and adapted from the changelog script in the Gutenberg
 * project
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/bin/plugin/commands/changelog.js
 */

/**
 * External dependencies
 */
const { groupBy, escapeRegExp, uniq } = __nccwpck_require__( 4199 );
const core = __nccwpck_require__( 9590 );

/**
 * Internal dependencies
 */
const {
	getMilestoneByTitle,
	getIssuesByMilestone,
} = __nccwpck_require__( 2815 );

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
	getTypesByLabels,
	getTypesByTitle,
	getChangelogItems,
	getChangelog,
	getDevNoteNeeded,
	getEntriesForGroup,
	getDevNoteItems,
};


/***/ }),

/***/ 2981:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const {
	getChangelog,
	getDevNoteItems,
	getChangelogItems,
} = __nccwpck_require__( 8445 );

module.exports = {
	getChangelog,
	getDevNoteItems,
	getChangelogItems,
};


/***/ }),

/***/ 616:
/***/ ((__unused_webpack_module, exports) => {

exports.lineBreak = ( body ) => {
	// Regular expression to match all occurences of '&lt;br&gt'
	const regEx = /\/?&lt;br(?:\s\/)?&gt;/g;
	return body.replace( regEx, '<br>' );
};

exports.truncate = ( str, maxLength = 80 ) => {
	if ( str.length < maxLength ) return str;
	return str.substring( 0, maxLength ) + '...';
};


/***/ }),

/***/ 675:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * Internal dependencies
 */
const { getMilestoneByTitle, getIssuesByMilestone } = __nccwpck_require__( 2815 );
const { lineBreak, truncate } = __nccwpck_require__( 616 );

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
	lineBreak,
	truncate,
};


/***/ }),

/***/ 2815:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const core = __nccwpck_require__( 9590 );

/**
 * @typedef {import('../typedefs').GitHubContext} GitHubContext
 * @typedef {import('../typedefs').GitHub} GitHub
 * @typedef {import('../typedefs').IssuesListForRepoResponseItem} IssuesListForRepoResponseItem
 * @typedef {import('../typedefs').IssuesListMilestonesForRepoResponseItem} IssuesListMilestonesForRepoResponseItem
 * @typedef {import('../typedefs').IssueState} IssueState
 */

/**
 * Returns an array of version possibilities to check
 *
 * @param {Array} version
 */
function getVersionsToCheck( version ) {
	const versionSplit = version.split( '.' );
	switch ( versionSplit.length ) {
		case 3:
			// patch version
			if ( versionSplit[ 2 ] !== '0' ) {
				return [ version ];
			}
			return [ version, `${ versionSplit[ 0 ] }.${ versionSplit[ 1 ] }` ];
		case 2:
			// minor version
			if ( versionSplit[ 1 ] !== '0' ) {
				return [ version, `${ version }.0` ];
			}
			return [ version, `${ versionSplit[ 0 ] }`, `${ version }.0` ];
		default:
			return [ version, `${ version }.0`, `${ version }.0.0` ];
	}
}

/**
 * Returns a promise resolving to a milestone by a given title, if exists.
 *
 * @param {GitHubContext} context
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} title   Milestone title.
 * @param {IssueState} state
 * @return {Promise<IssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getMilestoneByTitle( context, octokit, title, state = 'open' ) {
	const options = octokit.issues.listMilestones.endpoint.merge( {
		...context.repo,
		state,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListMilestonesForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const versionsToCheck = getVersionsToCheck( title );

	core.debug(
		'Versions being checked for milestone:' +
			JSON.stringify( versionsToCheck )
	);

	for await ( const response of responses ) {
		const milestones = response.data;
		for ( const milestone of milestones ) {
			if ( versionsToCheck.includes( milestone.title ) ) {
				return milestone;
			}
		}
	}
}

/**
 * Returns a promise resolving to pull requests by a given milestone ID.
 *
 * @param {GitHubContext} context
 * @param {GitHub}     octokit   Initialized Octokit REST client.
 * @param {number}     milestone Milestone ID.
 * @param {IssueState} [state]   Optional issue state.
 *
 * @return {Promise<IssuesListForRepoResponseItem[]>} Promise resolving to pull
 *                                                    requests for the given
 *                                                    milestone.
 */
async function getIssuesByMilestone( context, octokit, milestone, state ) {
	const options = octokit.issues.listForRepo.endpoint.merge( {
		...context.repo,
		milestone,
		state,
	} );

	/**
	 * @type {AsyncIterableIterator<import('@octokit/rest').Response<import('@octokit/rest').IssuesListForRepoResponse>>}
	 */
	const responses = octokit.paginate.iterator( options );

	const pulls = [];

	for await ( const response of responses ) {
		const issues = response.data;
		pulls.push( ...issues );
	}

	return pulls;
}

module.exports = {
	getMilestoneByTitle,
	getIssuesByMilestone,
};


/***/ }),

/***/ 9590:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 9513:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 5320:
/***/ ((module) => {

module.exports = eval("require")("hbs");


/***/ }),

/***/ 4199:
/***/ ((module) => {

module.exports = eval("require")("lodash");


/***/ }),

/***/ 335:
/***/ ((module) => {

module.exports = eval("require")("parse-diff");


/***/ }),

/***/ 7147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 1017:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 6736:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"labelTypePrefix":"type: ","labelTypeMap":{"bug":"Bug Fixes","regression":"Bug Fixes","feature":"Features","enhancement":"Enhancements","new api":"New APIs","experimental":"Experiments","task":"Various"},"groupTitleOrder":["Features","Enhancements","New APIs","Bug Fixes","Performance","Experiments","Documentation","Code Quality","undefined","Various"],"rewordTerms":{"e2e":"end-to-end","url":"URL","config":"configuration","docs":"documentation"},"needsDevNoteLabel":"status:needs-dev-note","labelsToOmit":["skip-changelog"]}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/**
 * External dependencies
 */
const { setFailed, getInput, debug: coreDebug } = __nccwpck_require__( 9590 );
const GitHub = __nccwpck_require__( 9513 );
const context = GitHub.context;

/**
 * Internal dependencies
 */
const debug = __nccwpck_require__( 1655 );
const ifNotFork = __nccwpck_require__( 4283 );
const automations = __nccwpck_require__( 9719 );

/**
 * @typedef {import('./typedefs').AutomationTaskRunner} AutomationTaskRunner
 */

( async function initialize() {
	const types = getInput( 'automations' ).split( ',' );

	debug( `The types value is ${ types }` );

	if ( types && ! Array.isArray( types ) ) {
		setFailed(
			'initialize: The provided `automations` configuration object must be a list.'
		);
		return;
	}

	const token = getInput( 'github_token' );

	if ( ! token ) {
		setFailed( 'initialize: Input `github_token` is required' );
		return;
	}

	const octokit = GitHub.getOctokit( token );

	debug(
		`initialize: Received event = '${ context.eventName }', action = '${ context.payload.action }'`
	);

	for ( const {
		name,
		events,
		actions,
		runner,
		getConfig = () => void null,
	} of automations ) {
		if (
			events.includes( context.eventName ) &&
			( actions === undefined ||
				actions.includes( context.payload.action ) )
		) {
			try {
				debug( `initialize: Starting runner ${ name }` );
				/**
				 * @type {AutomationTaskRunner}
				 */
				const task = ifNotFork( runner );
				const config = await getConfig( context, octokit );
				coreDebug(
					`Created config: ${ config } : ` + JSON.stringify( config )
				);
				await task( context, octokit, config );
			} catch ( error ) {
				setFailed(
					`initialize: Runner ${ name } failed with error: ${ error }`
				);
			}
		}
	}

	debug( 'initialize: All done!' );
} )();

})();

module.exports = __webpack_exports__;
/******/ })()
;