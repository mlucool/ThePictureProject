const gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    gutil = require('gulp-util'),
    Promise = require('bluebird'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    env = require('gulp-env'),
    webpack = require('webpack'),
    WebpackDevServer = require('webpack-dev-server'),
    _ = require('lodash'),
    jsdoc = require('gulp-jsdoc3');

var jsFiles = ['*.js', 'src/**/*.js', 'src/**/*.jsx', '!./**/node_modules/**/*', '!./src/parser/compiled/**/*'];
var assets = ['assets/**/*'];
var parserSrcCode = ['src/parser/**.js'];

gulp.task('lint', function () {
    return gulp.src(jsFiles)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('doc', function (cb) {
    gulp.src(['README.md', './src/**/*.js'], {read: false})
        .pipe(jsdoc({}, cb));
});

gulp.task('lint-watch', function () {
    var runSequence = require('run-sequence');

    runSequence('lint', function () {
        gulp.watch(jsFiles, ['lint']);
    });
});

gulp.task('build-parser', function () {
    return gulp.src(parserSrcCode)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .on('error', function (error) {
            gutil.log(error.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/parser/compiled'));
});

gulp.task('watch-build-parser', function (cb) { // eslint-disable-line no-unused-vars
    var runSequence = require('run-sequence');

    runSequence('build-parser', function () {
        gulp.watch(parserSrcCode, ['build-parser']);
    });
});

gulp.task('copy', function () {
    return gulp.src(assets)
        .pipe(gulp.dest('dist/'));
});

gulp.task('webpack-dev-server', function (callback) { //eslint-disable-line no-unused-vars
    env.set({
        vars: {
            'DEBUG': '', // Debugger logging if we need it
            'NODE_ENV': 'development'
        }
    });
    const config = require('./webpack.config');
    const port = _.last(config.entry[0].split(':'));
    const compiler = webpack(config);
    new WebpackDevServer(compiler, {
        // Needs to be here and in webpack
        contentBase: config.devServer.contentBase,
        hot: true,
        stats: {colors: true, timings: true, reasons: true}
        // server and middleware options
    }).listen(port, '0.0.0.0', function (error) {
        if (error) {
            throw new gutil.PluginError('webpack-dev-server', error);
        }
        gutil.log('[webpack-dev-server]', 'http://localhost:' + port + '/webpack-dev-server/');
    });
    // Ignore callback
});

function SpawnTask(cmd, args) { //eslint-disable-line no-unused-vars
    // You could get an error then a close or just an error.
    // So we use promises and ignore the second
    return new Promise(function (resolve, reject) {
        args = args || [];
        gutil.log(cmd + ' ' + args.join(' '));

        const child = require('child_process').spawn(cmd, args, {cwd: process.cwd()});
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', function (data) {
            gutil.log(data);
        });
        child.stderr.on('data', function (data) {
            gutil.log(gutil.colors.red(data));
            gutil.beep();
        });
        child.on('close', function (code) {
            if (code === 0) {
                gutil.log('Finished with exit code 0');
                resolve();
            } else {
                gutil.log(gutil.colors.red('Closed with error code: ' + code));
                gutil.beep();
                reject(code);
            }
        });
        child.on('error', function (error) {
            gutil.log(gutil.colors.red(error));
            gutil.beep();
            reject(error);
        });
    });
}
