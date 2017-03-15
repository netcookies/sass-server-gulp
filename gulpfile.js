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
    boolean: ['https', 'nolocal', 'nolithium'],
    default: { proxy: 'none' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var config = {
    bowerDir: './bower_components',
    inputDir: './src',
    outputDir: './public/'
};


if(options.nolithium){
    var sassOptions = {
        errLogToConsole: true,
        style: 'compressed',
        outputStyle: 'expanded',
        includePaths: [
            config.bowerDir + '/bootstrap-sass/assets/stylesheets'
        ]
    };
} else {
    var sassOptions = {
        errLogToConsole: true,
        style: 'compressed',
        outputStyle: 'expanded'
    };
}

function browserSync(){
        if(options.proxy === 'none'){
            if(options.nolocal){
                browserSync({
                    server: {
                        baseDir: [config.outputDir],
                        directory: true
                    }
                    ,https: options.https
                    ,open: false
                    ,port: 8080
                });
            } else {
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
            }
        }else {
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
};


function sass(){
    var sourcemaps   = require('gulp-sourcemaps');
    var autoprefixer = require('gulp-autoprefixer');
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
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(sourcemaps.write({
            sourceRoot: '../scss'
        }))
        .pipe(gulp.dest(config.outputDir +'/css'))
        .pipe(stream({match: '**/*.css'}));
};

function bootstrap_fonts(){
    return gulp.src(config.bowerDir + '/bootstrap-sass/assets/fonts/**/*')
        .pipe(gulp.dest(config.outputDir + '/fonts'));
};

function bootstrap_js(){
    return gulp.src(config.bowerDir + '/bootstrap-sass/assets/javascripts/bootstrap.min.js')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

function jquery(){
    return gulp.src(config.bowerDir + '/jquery-1.11.3/dist/jquery.min.*')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

function fontawesome_fonts(){
    return gulp.src([
        config.bowerDir + '/font-awesome/fonts/*'])
        .pipe(gulp.dest(config.outputDir + '/fonts/font-awesome/fonts'));
};

function fontawesome_css(){
    return gulp.src([
        config.bowerDir + '/font-awesome/css/*'])
        .pipe(gulp.dest(config.outputDir + '/fonts/font-awesome/css'));
};

function html_assets(){
    return gulp.src(config.inputDir + 'html/assets/**/*')
        .pipe(gulp.dest(config.outputDir + '/html/assets'));
};

function image(){
    gulp.src([
        config.inputDir + '/html/assets/*.{jpg,jpeg,png}'])
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(config.outputDir + '/html/assets'))
        .pipe(stream());
    return gulp.src([
        config.inputDir + '/img/*.{jpg,jpeg,png}'])
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(config.outputDir + '/img'))
        .pipe(stream());
};

function svg(){
    return gulp.src([
        config.inputDir + '/svg/*.svg',
        config.inputDir + '/html/assets/*.svg'])
        .pipe(svgmin())
        .pipe(inlineSvg())
        .pipe(gulp.dest(config.inputDir + '/scss/'));
};

function html(){
    gulp.src(config.outputDir + '/*.html')
        .pipe(reload);
};

function watch(){
    gulp.watch([config.outputDir + '/*.html'], html);
    gulp.watch(config.inputDir + '/scss/**/*.scss', sass);
    gulp.watch([config.inputDir + '/img/*.{jpg,jpeg,png}', config.inputDir + '/html/assets/*.{jpg,jpeg,png}'], image);
    gulp.watch([config.inputDir + '/svg/*.svg', config.inputDir + '/html/assets/*.svg'], svg);
};


exports.svg               = svg;
exports.sass              = sass;
exports.html              = html;
exports.html_assets       = html_assets;
exports.jquery            = jquery;
exports.bootstrap_fonts   = bootstrap_fonts;
exports.bootstrap_js      = bootstrap_js;
exports.fontawesome_fonts = fontawesome_fonts;
exports.fontawesome_css   = fontawesome_css;
exports.image             = image;
exports.browserSync       = browserSync;
exports.watch             = watch;

if(options.nolithium){
    var build = gulp.series(svg, gulp.parallel(sass, html, html_assets, image, bootstrap_js, bootstrap_fonts, fontawesome_css, fontawesome_fonts), browserSync);
} else {
    var build = gulp.series(svg, gulp.parallel(sass, html_assets, image), browserSync);
}

gulp.task('build', build);
gulp.task('default', build);

