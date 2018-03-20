exports.convert = convert;
exports.getWatcher = getWatcher;

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var choki = require('chokidar');
var watcher = null;

function convert(logger, projectDir, appDir, options) {
	options = options || {};
	var sassPath = getSassPath();
	var data = {
		sassPath: sassPath,
		projectDir: projectDir,
		appDir: appDir,
		logger: logger,
		options: options
	};
	
	if (options.watch) {
		createWatcher(data);
	}

	return spawnNodeSass(data);
}

function getWatcher() {
	return watcher;
}

function createWatcher(data) {
	var appDir = data.appDir;
	var watcherOptions = {
		ignoreInitial: true,
		cwd: appDir,
		awaitWriteFinish: {
			pollInterval: 100,
			stabilityThreshold: 500
		},
		ignored: ['**/.*', '.*'] // hidden files
	};
	
	watcher = choki.watch(['**/*.scss', '**/*.sass'], watcherOptions)
		.on('all', (event, filePath) => {
			spawnNodeSass(data);
		});
}

function getSassPath() {
	var sassPath = require.resolve('node-sass/bin/node-sass');
	if (fs.existsSync(sassPath)) {
		try {
			logger.info('Found peer node-sass');
		} catch (err) { }
	} else {
		throw Error('node-sass installation local to project was not found. Install by executing `npm install node-sass`.');
	}

	return sassPath;
}

function spawnNodeSass(data) {
	return new Promise(function (resolve, reject) {
		var sassPath = data.sassPath,
			projectDir = data.projectDir,
			appDir = data.appDir,
			logger = data.logger,
			options = data.options;

		var importerPath = path.join(__dirname, "importer.js");

		// Node SASS Command Line Args (https://github.com/sass/node-sass#command-line-interface)
		// --ouput : Output directory
		// --output-style : CSS output style (nested | expanded | compact | compresed)
		// -q : Supress log output except on error
		// --follow : Follow symlinked directories
		// -r : Recursively watch directories or files
		// --watch : Watch a directory or file
		var nodeArgs = [sassPath, appDir, '--output', appDir, '--output-style', 'compressed', '-q', '--follow', '--importer', importerPath];
		logger.trace(process.execPath, nodeArgs.join(' '));

		var env = Object.create( process.env );
		env.PROJECT_DIR = projectDir;
		env.APP_DIR = appDir;

		var currentSassProcess = spawn(process.execPath, nodeArgs, { env: env });

		var isResolved = false;
		var watchResolveTimeout;

		currentSassProcess.stdout.on('data', function (data) {
			var stringData = data.toString();
			logger.info(stringData);
		});

		currentSassProcess.stderr.on('data', function (err) {
			var message = '';
			var stringData = err.toString();

			try {
				var parsed = JSON.parse(stringData);
				message = parsed.formatted || parsed.message || stringData;
			} catch (e) {
				message = err.toString();
			}

			logger.info(message);
		});

		currentSassProcess.on('error', function (err) {
			logger.info(err.message);
			if (!isResolved) {
				isResolved = true;
				reject(err);
			}
		});

		// TODO: Consider using close event instead of exit
		currentSassProcess.on('exit', function (code, signal) {
			currentSassProcess = null;
			if (!isResolved) {
				isResolved = true;
				if (code === 0) {
					resolve();
				} else {
					reject(Error('SASS compiler failed with exit code ' + code));
				}
			}
		});

		// SASS does not recompile on watch, so directly resolve.
		if (options.watch && !isResolved) {
			isResolved = true;
			resolve();
		}
	});
}
