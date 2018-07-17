'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
  return gulp.src('src/svg-inject.js')
    .pipe(gulp.dest('dist/'))
    .pipe(gulp.dest('test/'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('examples/'))
    .pipe(gulp.dest('dist/'));
});