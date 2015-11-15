var gulp = require('gulp'),
    eslint = require('gulp-eslint');

var jsFiles = ['*.js', 'src/**/*.js'];

gulp.task('lint', function() {
   return gulp.src(jsFiles)
       .pipe(eslint())
       .pipe(eslint.format())
       .pipe(eslint.failAfterError());
});
