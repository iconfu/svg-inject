'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');

gulp.task('default', function () {
  return gulp.src('src/svg-inject.js')
    .pipe(gulp.dest('dist/'))
    .pipe(gulp.dest('test/'))
    .pipe(gulp.dest('examples/'))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('examples/'))
    .pipe(gulp.dest('dist/'));
});
