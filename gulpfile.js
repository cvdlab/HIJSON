var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var nodemon = require('gulp-nodemon');

gulp.task('browserify', function() {
  return watchify(browserify('./c3d/c3d_client.js', {
		cache: {},
		packageCache: {},
		fullPaths: true,
		standalone: 'c3dclient',
	    debug: true
	})).bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // optional, remove if you dont want sourcemaps
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      .pipe(sourcemaps.write('./')) // writes .map file
    //
    .pipe(gulp.dest('./public/libs'));
});

gulp.task('nodemon', ['browserify'], function () {
  return nodemon({
    ignore: [
      'gulpfile.js',
      'node_modules/',
      'public/libs/bundle.js',
      'public/libs/bundle.js.map',
      '.git/',
      'geojson_output'
    ],
	ext: "js,jade,json"
  })
  .on('change', ['browserify']);
});