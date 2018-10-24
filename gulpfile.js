'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const pump = require('pump');

gulp.task('svg-inject', function (cb) {
  pump([
    gulp.src('src/svg-inject.js'),
    gulp.dest('dist/'),
    gulp.dest('examples/'),
    gulp.dest('test/js/'),
    uglify({
      output: {
        preamble: "/* MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE */"
      },
      ie8: true,
      output: {
        max_line_len: 500
      }
    }),
    rename({ extname: '.min.js' }),
    gulp.dest('examples/'),
    gulp.dest('test/js/'),
    gulp.dest('dist/')
  ], cb);
});

gulp.task('xhr-check', function (cb) {
  pump([
    gulp.src('test/js/xhr-check.js'),
    gulp.dest('examples/_example_helpers/')
  ], cb);
});

gulp.task('default', ['svg-inject', 'xhr-check']);