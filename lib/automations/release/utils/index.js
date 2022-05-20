module.exports = {
	getReleaseVersion: require( './get-release-version' ),
	getWPAndWCReleaseVersions: require( './get-wp-wc-release-versions' ),
	isPatchRelease: require( './is-patch-release' ),
	getReleaseBranch: require( './get-release-branch' ),
	duplicateChecker: require( './duplicate-pr-checker' ),
	hasMilestone: require( './has-milestone' ),
};
