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

gulp.task('nodemon', ['browserify'], function () {
  return nodemon({
    ignore: [
      'gulpfile.js',
      'node_modules/',
      'public/libs/bundle.js',
      '.git/'
    ],
	ext: "js,jade,json",
	verbose: true
  })
  .on('restart', ['browserify'])
});