/**
 * Module Dependencies
 */
 
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var nodemon = require('gulp-nodemon');

/**
 * Gulp Tasks
 */

gulp.task('browserify', function() {
    return browserify('./c3d/c3d_client.js', {
    	standalone: 'c3dclient'
    })
    .bundle()
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('bundle.js'))
    // Start piping stream to tasks!
    .pipe(gulp.dest('./public/libs'));
});

gulp.task('nodemon', ['browserify'], function (cb) {
  var called = false;
  return nodemon({
    script: './bin/www',
    ignore: [
      'gulpfile.js',
      'node_modules/'
    ],
	ext: "js,jade,json",
	verbose: true
  })
  .on('start', function () {
    if (!called) {
      called = true;
      cb();
    }
  });
});

gulp.task('default', ['nodemon'], function () {
  gulp.watch(['./**/*'], ['nodemon']);
});
