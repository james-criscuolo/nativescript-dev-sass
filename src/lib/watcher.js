var choki = require('chokidar');
var path = require('path');
var compiler = require('./compiler');
var LogProvider = require('./log-provider');

var args = JSON.parse(process.argv[2]);
var appDir = args.appDir;
var projectDir = args.projectDir;
var appResourcesDir = args.appResourcesDir;
var watchPromisesChain = Promise.resolve();

var watcherOptions = {
    ignoreInitial: true,
    cwd: appDir,
    awaitWriteFinish: {
        pollInterval: 100,
        stabilityThreshold: 300
    },
    followSymlinks: false,
    ignored: ['**/.*', '.*', appResourcesDir] // hidden files and App_Resources folder
};

watcher = choki.watch('**/*.s[ac]ss', watcherOptions)
    .on('all', (event, filePath) => {
        watchPromisesChain = watchPromisesChain
            .then(() => compiler.compile({appDir, projectDir}))
            .catch(err => {
                if (!err.stopExecution && err.errorAsWarning) {
                    var logger = new LogProvider(null);
                    logger.warn(err.message);
                } else {
                    throw err;
                }
            });
    });
