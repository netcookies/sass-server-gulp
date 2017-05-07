// Include gulp
var gulp = require('gulp');


// Include plugins
var sassCompiler = require('gulp-sass');
var minifyCss    = require('gulp-clean-css');
var minifyJs     = require('gulp-uglify');
var rename       = require('gulp-rename');
var browserSync  = require('browser-sync');
const image      = require('gulp-image');
var inlineSvg    = require('gulp-inline-svg');
var svgmin       = require('gulp-svgmin');
var minimist     = require('minimist');
var fs           = require('fs');
var sourcemaps   = require('gulp-sourcemaps');
var stream       = browserSync.stream;
var reload       = browserSync.reload;

var knownOptions = {
    string: 'proxy',
    boolean: ['nolocal', 'nolithium'],
    default: { proxy: 'none' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var config = {
    bowerDir: './bower_components',
    inputDir: './src',
    outputDir: './public/'
};

var basePort        = 8080;
var httpPort        = 8081;
var httpsPort       = 8082;
var browserSyncPort = 8088;
var localDomain = 'localhost:' + basePort;

if(options.nolithium){
    var sassOptions = {
        errLogToConsole: true,
        style: 'compressed',
        outputStyle: 'expanded',
        precision: 8,
        includePaths: [
            config.bowerDir + '/bootstrap-sass/assets/stylesheets'
        ]
    };
} else {
    var sassOptions = {
        errLogToConsole: true,
        style: 'compressed',
        outputStyle: 'expanded',
        precision: 8
    };
}

if(options.proxy === 'none'){
    if(options.nolocal){
        var browserSyncOptions = {
            server: {
                baseDir: [config.outputDir],
                directory: true
            },
            open: false,
            port: browserSyncPort
        };
    } else {
        var browserSyncOptions = {
            server: {
                baseDir: [config.outputDir],
                directory: true
            },
            socket:{
                domain: localDomain
            },
            open: false,
            port: browserSyncPort
        };
    }
} else {
    var browserSyncOptions = {
        proxy: options.proxy,
        port: browserSyncPort,
        serveStatic: [
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
    };
}

var httpProxyOptions = {
    target: {
        host: 'localhost',
        port: browserSyncPort
    }
};

var httpsOptions = {
    key: fs.readFileSync('localhost.key.pem', 'utf8'),
    cert: fs.readFileSync('localhost.cert.pem', 'utf8')
}


function liveReload(){
    browserSync(browserSyncOptions);

    var net = require('net');
    var http = require('http');
    var https = require('https');
    var httpProxy = require('http-proxy');

    function tcpConnection(conn) {
        conn.once('data', function (buf) {
            // A TLS handshake record starts with byte 22.
            var address = (buf[0] === 22) ? httpsPort : httpPort;
            var proxy = net.createConnection(address, function () {
                proxy.write(buf);
                conn.pipe(proxy).pipe(conn);
            });
        });
    }

    net.createServer(tcpConnection).listen(basePort);
    var proxy = new httpProxy.createProxyServer(httpProxyOptions);
    var httpServer = http.createServer(function(req, res){
        proxy.web(req, res);
    });
    var proxyServer = https.createServer(httpsOptions, function(req, res){
        proxy.web(req, res);
    });

    httpServer.on('upgrade', function(req, socket, head){
        proxy.ws(req, socket, head);
    });

    proxyServer.on('upgrade', function(req, socket, head){
        proxy.ws(req, socket, head);
    });

    httpServer.listen(httpPort);
    proxyServer.listen(httpsPort);
};


function sass(){
    var autoprefixer = require('gulp-autoprefixer');
    var autoprefixerOptions = {
        browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    };

    return gulp.src(config.inputDir + '/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sassCompiler(sassOptions).on('error', sassCompiler.logError))
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

function image_min(){
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

function js_min(){
    return gulp.src([
        config.inputDir + '/js/*.js'])
        .pipe(sourcemaps.init())
        .pipe(minifyJs())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write( '.' ))
        .pipe(gulp.dest(config.outputDir + '/js'))
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
    return gulp.src([
        config.inputDir + '/html/**/*.html'])
        .pipe(gulp.dest(config.outputDir + '/html'));
};

function watch(){
    gulp.watch(config.inputDir + '/html/**/*.html', html);
    gulp.watch(config.outputDir + '/html/**/*.html').on('change', reload);
    gulp.watch(config.inputDir + '/js/*.js', js_min);
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
exports.image_min         = image_min;
exports.js_min            = js_min;
exports.liveReload        = liveReload;
exports.watch             = watch;

if(options.nolithium){
    var build = gulp.series(svg, html_assets, gulp.parallel(sass, html, image_min, js_min, bootstrap_js, bootstrap_fonts, fontawesome_css, fontawesome_fonts));
} else {
    var build = gulp.series(svg, html_assets, gulp.parallel(sass, image_min, js_min));
}

gulp.task('build', build);
gulp.task('default', gulp.series(build, gulp.parallel(liveReload, watch)));

