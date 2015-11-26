const gulp = require('gulp'),
    eslint = require('gulp-eslint');

var jsFiles = ['*.js', 'src/**/*.js', 'src/**/*.jsx'];

gulp.task('lint', function () {
    return gulp.src(jsFiles)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lint-watch', function () {
    var runSequence = require('run-sequence');

    runSequence('lint', function () {
        gulp.watch(jsFiles, ['lint']);
    });
});


