/**
 *
 *  Material Design Lite
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var fs = require('fs');
var merge = require('merge-stream');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var codeFiles = '';
var reload = browserSync.reload;
var path = require('path');
var pkg = require('./package.json');
var through = require('through2');
var swig = require('swig');
var MaterialCustomizer = require('./material-design-lite/docs/_assets/customizer.js');
var hostedLibsUrlPrefix = 'https://storage.googleapis.com/code.getmdl.io';
var bucketProd = 'gs://www.getmdl.io';
var bucketStaging = 'gs://mdl-staging';
var bucketCode = 'gs://code.getmdl.io';
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @license <%= pkg.license %>',
  ' * @copyright 2015 Google, Inc.',
  ' * @link https://github.com/google/material-design-lite',
  ' */',
  ''].join('\n');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Concatenate And Minify JavaScript
gulp.task('scripts', function () {
  var sources = [
    // Component handler
    'material-design-lite/src/mdlComponentHandler.js',
    // Polyfills/dependencies
    'material-design-lite/src/third_party/**/*.js',
    // Base components
    'material-design-lite/src/button/button.js',
    'material-design-lite/src/checkbox/checkbox.js',
    'material-design-lite/src/icon-toggle/icon-toggle.js',
    'material-design-lite/src/menu/menu.js',
    'material-design-lite/src/progress/progress.js',
    'material-design-lite/src/radio/radio.js',
    'material-design-lite/src/slider/slider.js',
    'material-design-lite/src/spinner/spinner.js',
    'material-design-lite/src/switch/switch.js',
    'material-design-lite/src/tabs/tabs.js',
    'material-design-lite/src/textfield/textfield.js',
    'material-design-lite/src/tooltip/tooltip.js',
    // Complex components (which reuse base components)
    'material-design-lite/src/layout/layout.js',
    'material-design-lite/src/data-table/data-table.js',
    // And finally, the ripples
    'material-design-lite/src/ripple/ripple.js'
  ];
  return gulp.src(sources)
    .pipe($.sourcemaps.init())
    // Concatenate Scripts
    .pipe($.concat('material.js'))
    .pipe(gulp.dest('./dist'))
    // Minify Scripts
    .pipe($.uglify({
      sourceRoot: '.',
      sourceMapIncludeSources: true
    }))
    .pipe($.header(banner, {pkg: pkg}))
    .pipe($.concat('material.min.js'))
    // Write Source Maps
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'))
    .pipe($.size({title: 'scripts'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['dist', '.publish', '_site'], {dot: true}));

// Build Production Files, the Default Task
gulp.task('default', ['clean', 'blog']);

gulp.task('blog:mdl', function() {
  return gulp.src([
    '_site/**/*.scss'
  ])
    .pipe($.sass({
      precision: 10,
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.cssInlineImages({
      webRoot: 'material-design-lite/src'
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.csso())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('blog:styles', function() {
  return gulp.src([
    '_site/**/*.css'
  ])
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    // FIXME: This crashes. It's a bug in gulp-csso,
    // not csso itself.
    //.pipe($.csso())
    .pipe(gulp.dest('dist'));
});

gulp.task('blog:static', function() {
  return gulp.src([
    '_site/**/*.html',
  ])
  .pipe(gulp.dest('dist'));
});

gulp.task('blog:images', function() {
  return gulp.src([
    '_site/images/**/*'
  ])
  .pipe($.imagemin({
    progressive: true,
    interlaced: true
  }))
  .pipe(gulp.dest('dist/images/'));
});

gulp.task('blog:fonts', function() {
  return gulp.src([
    '_site/*/fonts/**/*'
  ])
  .pipe(gulp.dest('dist/'));
});

gulp.task('blog:feed', function (gulpCallBack) {
  return gulp.src([
    '_site/*.xml'
  ])
  .pipe(gulp.dest('dist/'));
});

gulp.task('blog:jekyll', function (gulpCallBack){
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) {
     gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
  });
});

gulp.task('blog', function (cb) {
  runSequence('blog:jekyll', ['blog:static', 'blog:images', 'blog:mdl',
      'blog:fonts', 'blog:styles', 'blog:feed', 'scripts'], cb)
});
