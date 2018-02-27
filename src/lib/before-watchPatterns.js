module.exports = function (hookArgs) {
	if (hookArgs.liveSyncData && !hookArgs.liveSyncData.bundle) {
		return (args, originalMethod) => {
			return originalMethod().then(originalPatterns => {
				originalPatterns.push("!app/**/*.scss");

				return originalPatterns;
			});
		};
	}
}
