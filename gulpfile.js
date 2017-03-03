// Include gulp
var gulp = require('gulp');


// Include plugins
var sass = require('gulp-sass');
var minifyCss = require('gulp-clean-css');
var rename = require('gulp-rename');
var connect = require('gulp-connect');
const image = require('gulp-image');
var inlineSvg = require('gulp-inline-svg');
var svgmin = require('gulp-svgmin');


var config = {
    bowerDir: './bower_components',
    inputDir: './src',
    outputDir: './public/assets'
};


var sassOptions = {
    errLogToConsole: true,
    style: 'compressed',
    outputStyle: 'expanded',
    includePaths: [
        config.bowerDir + '/bootstrap-sass/assets/stylesheets'
    ]
};

gulp.task('connect', function() {
    connect.server({
        root: 'public',
        port: 8000,
        livereload: true
    });
});


gulp.task('sass', function () {
    var postcss      = require('gulp-postcss');
    var sourcemaps   = require('gulp-sourcemaps');
    var autoprefixer = require('autoprefixer');
    var autoprefixerOptions = {
        browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    };

    return gulp.src(config.inputDir + '/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(minifyCss({
            specialComments: 0,
            compatibility: 'ie8',
            { format: 'keep-breaks' }
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(postcss([ autoprefixer(autoprefixerOptions) ]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.outputDir +'/css'))
        .pipe(connect.reload());
});

gulp.task('bootstrap_fonts', function() {
    return gulp.src(config.bowerDir + '/bootstrap-sass/assets/fonts/**/*')
        .pipe(gulp.dest(config.outputDir + '/fonts'));
});

gulp.task('bootstrap_js', function() {
    //return gulp.src(config.bowerDir + '/bootstrap-sass/assets/javascripts/**/*')
    return gulp.src(config.bowerDir + '/bootstrap-sass/assets/javascripts/bootstrap.min.js')
        .pipe(gulp.dest(config.outputDir + '/js'));
});

gulp.task('jquery', function() {
    return gulp.src(config.bowerDir + '/jquery-1.11.3/dist/jquery.min.*')
        .pipe(gulp.dest(config.outputDir + '/js'));
});

gulp.task('fontawesome-fonts', function() {
    return gulp.src([
        config.bowerDir + '/font-awesome/fonts/*'])
        .pipe(gulp.dest(config.outputDir + '/fonts/font-awesome/fonts'));
});

gulp.task('fontawesome-css', function() {
    return gulp.src([
        config.bowerDir + '/font-awesome/css/*'])
        .pipe(gulp.dest(config.outputDir + '/fonts/font-awesome/css'));
});

gulp.task('image', function () {
    return gulp.src([
        config.inputDir + '/img/*'])
        .pipe(image())
        .pipe(gulp.dest(config.outputDir + '/img'))
        .pipe(connect.reload());
});

gulp.task('svg', function(){
    return gulp.src([
        config.inputDir + '/svg/*.svg'])
        .pipe(svgmin())
        .pipe(inlineSvg())
        .pipe(gulp.dest(config.inputDir + '/scss/'));
});

gulp.task('html', function () {
    gulp.src('./public/*.html')
        .pipe(connect.reload());
});

gulp.task('copy_to_wp', ['sass'], function(){
    gulp.src([
        config.outputDir + '/css/*'
    ])
        .pipe(gulp.dest('./wp_assets/css'));
});

gulp.task('watch', function() {
    gulp.watch(['./public/*.html'], ['html']);
    gulp.watch(config.inputDir + '/scss/**/*.scss',
        ['sass'
        //, 'copy_to_wp'
        ]);
    gulp.watch(config.inputDir + '/img/*', ['image']);
});



gulp.task('default', [
    'svg',
    'sass',
    'bootstrap_fonts',
    'bootstrap_js',
    'jquery',
    'fontawesome-fonts',
    'fontawesome-css',
    'image',
    //'copy_to_wp',
    'connect',
    'watch'
]);
