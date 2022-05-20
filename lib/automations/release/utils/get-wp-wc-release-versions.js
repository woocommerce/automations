/**
 * @typedef {import('../../../typedefs').GitHub} GitHub
 */

/**
 * @param {GitHub} octokit
 */
module.exports = async ( octokit ) => {
	const wpTags = await octokit.request(
		'GET /repos/WordPress/WordPress/tags',
		{
			owner: 'WordPress',
			repo: 'WordPress',
		}
	);
	const wpLatestReleaseVersion = wpTags.data[ 0 ].name;

	const wcLatestRelease = await octokit.request(
		'GET /repos/woocommerce/woocommerce/releases/latest',
		{
			owner: 'woocommerce',
			repo: 'woocommerce',
		}
	);

	const wcLatestReleaseVersion = wcLatestRelease.data.name;

	return {
		wpLatestReleaseVersion,
		wcLatestReleaseVersion,
	};
};
