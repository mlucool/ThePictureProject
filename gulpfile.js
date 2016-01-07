const gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    gutil = require('gulp-util'),
    Promise = require('bluebird'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    jsdoc = require('gulp-jsdoc3');

var jsFiles = ['*.js', 'src/**/*.js', 'src/**/*.jsx', '!./**/node_modules/**/*' , '!./src/parser/compiled/**/*'];
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

gulp.task('build-parser', function() {
    return gulp.src(parserSrcCode)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('src/parser/compiled'));
});

gulp.task('watch-build-parser', function(cb) { // eslint-disable-line no-unused-vars
    var runSequence = require('run-sequence');

    runSequence('build-parser', function () {
        gulp.watch(parserSrcCode, ['build-parser']);
    });
});

gulp.task('webpack-dev-server', function (cb) {
    SpawnTask('node', ['./node_modules/webpack-dev-server/bin/webpack-dev-server.js'])
        .then(cb, cb);
});

function SpawnTask(cmd, args) {
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
