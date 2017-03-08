// Include gulp
var gulp = require('gulp');


// Include plugins
var sass = require('gulp-sass');
var minifyCss = require('gulp-clean-css');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');
const image = require('gulp-image');
var inlineSvg = require('gulp-inline-svg');
var svgmin = require('gulp-svgmin');
var minimist = require('minimist');
var stream = browserSync.stream;
var reload = browserSync.reload;

var knownOptions = {
    string: 'proxy',
    boolean: 'https',
    default: { proxy: 'none' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var config = {
    bowerDir: './bower_components',
    inputDir: './src',
    outputDir: './public/'
};


var sassOptions = {
    errLogToConsole: true,
    style: 'compressed',
    outputStyle: 'expanded'
};

gulp.task('browserSync', function() {
        if(options.proxy === 'none'){
            browserSync({
                server: {
                    baseDir: [config.outputDir],
                    directory: true
                }
                ,https: options.https
                ,socket:{
                    domain: 'localhost:8080'
                }
                ,open: false
                ,port: 8080
            });
        } else {
            browserSync({
                proxy: options.proxy
                ,port: 8000
                ,serveStatic: [
                    {
                    route: '/css',
                    dir: [config.outputDir + '/css']
                    },
                    {
                    route: '/img',
                    dir: [config.outputDir + '/img']
                    },
                    {
                    route: '/fonts',
                    dir: [config.outputDir + '/fonts']
                    },
                    {
                    route: '/js',
                    dir: [config.outputDir + '/js']
                    },
                    {
                    route: '/html/assets',
                    dir: [config.outputDir + '/html/assets']
                    }
                ]
            });
        }
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
            compatibility: 'ie8'
            ,specialComments: 0
            //,format: 'keep-breaks'
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(postcss([ autoprefixer(autoprefixerOptions) ]))
        .pipe(sourcemaps.write({
            sourceRoot: '../scss'
        }))
        .pipe(gulp.dest(config.outputDir +'/css'))
        .pipe(stream({match: '**/*.css'}));
});

gulp.task('bootstrap_fonts', function() {
    return gulp.src(config.bowerDir + '/bootstrap-sass/assets/fonts/**/*')
        .pipe(gulp.dest(config.outputDir + '/fonts'));
});

gulp.task('bootstrap_js', function() {
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
    gulp.src([
        config.inputDir + '/html/assets/*'])
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(config.outputDir + '/html/assets'))
        .pipe(stream());
    return gulp.src([
        config.inputDir + '/img/*'])
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(config.outputDir + '/img'))
        .pipe(stream());
});

gulp.task('svg', function(){
    return gulp.src([
        config.inputDir + '/svg/*.svg',
        config.inputDir + '/html/assets/*.svg'])
        .pipe(svgmin())
        .pipe(inlineSvg())
        .pipe(gulp.dest(config.inputDir + '/scss/'));
});

gulp.task('html', function () {
    gulp.src(config.outputDir + '/*.html')
        .pipe(reload);
});

gulp.task('watch', function() {
    gulp.watch([config.outputDir + '/*.html'], ['html']);
    gulp.watch(config.inputDir + '/scss/**/*.scss',
        ['sass']);
    gulp.watch(config.inputDir + '/img/*', ['image']);
});



gulp.task('default', [
    'svg',
    'sass',
    'bootstrap_fonts',
    'fontawesome-fonts',
    'image',
    'browserSync',
    'watch'
]);
