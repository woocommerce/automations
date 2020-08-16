module.exports = {
	getReleaseVersion: require( './get-release-version' ),
	isPatchRelease: require( './is-patch-release' ),
	getReleaseBranch: require( './get-release-branch' ),
	duplicateChecker: require( './duplicate-pr-checker' ),
	hasMilestone: require( './has-milestone' ),
};
