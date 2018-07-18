'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const closureCompiler = require('google-closure-compiler').gulp();

gulp.task('default', function () {
  return gulp.src('src/svg-inject.js')
    .pipe(gulp.dest('dist/'))
    .pipe(gulp.dest('test/'))
    .pipe(closureCompiler({
        compilation_level: 'ADVANCED',
        warning_level: 'VERBOSE',
        language_in: 'ECMASCRIPT6_STRICT',
        language_out: 'ECMASCRIPT5',
        //output_wrapper: '(function(){\n%output%\n}).call(this)',
        js_output_file: 'svg-inject.min.js'
      }, {
        platform: ['native', 'java', 'javascript']
      }))
    .pipe(gulp.dest('examples/'))
    .pipe(gulp.dest('dist/'));
});
