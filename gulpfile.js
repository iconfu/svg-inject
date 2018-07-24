'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const pump = require('pump');

gulp.task('default', function (cb) {
  pump([
    gulp.src('src/svg-inject.js'),
    gulp.dest('dist/'),
    gulp.dest('test/'),
    gulp.dest('examples/'),
    uglify({
      output: {
        preamble: "/* MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE */"
      },
      ie8: true
    }),
    rename({ extname: '.min.js' }),
    gulp.dest('examples/'),
    gulp.dest('dist/')
  ], cb);
});