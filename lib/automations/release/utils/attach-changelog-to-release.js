const debug = require( '../../../debug' );

const attachChangelogToRelease = async ( context, octokit, changelog ) => {
	const releases = await octokit.repos.listReleases( {
		...context.repo,
	} );

	if ( releases.data.length === 0 ) {
		debug(
			`releaseAutomation: No releases found for ${ context.repo.owner }/${ context.repo.repo }`
		);
	} else {
		await octokit.repos.updateRelease( {
			...context.repo,
			release_id: releases.data[ 0 ].id,
			body: changelog,
		} );
	}
};

module.exports = attachChangelogToRelease;
