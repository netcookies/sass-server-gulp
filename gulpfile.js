// Include gulp
var gulp = require('gulp');


// Include plugins
var sassCompiler = require('gulp-sass');
var minifyCss    = require('gulp-clean-css');
var minifyJs     = require('gulp-uglify-es').default;
var rename       = require('gulp-rename');
var browserSync  = require('browser-sync').create();
const image      = require('gulp-image');
var inlineSvg    = require('gulp-inline-svg');
var svgmin       = require('gulp-svgmin');
var minimist     = require('minimist');
var fs           = require('fs');
var sourcemaps   = require('gulp-sourcemaps');
var cache        = require('gulp-cached');
var concat       = require('gulp-concat');
var remember     = require('gulp-remember');

var stream       = browserSync.stream;
var reload       = browserSync.reload;


var knownOptions = {
    string: 'proxy',
    boolean: ['nolocal', 'nolithium'],
    default: { proxy: 'none' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var config = {
    componentDir: './node_modules',
    inputDir: './src',
    outputDir: './public/'
};

const paths = {
    image: {
        src: config.inputDir + '/img/*.{jpg,jpeg,png,gif}',
        dst: config.outputDir + 'img'
    },
    css: {
        src: [config.inputDir + '/scss/*.scss', config.inputDir + '/scss/**/_*.scss'],
        dst: config.outputDir + 'css'
    },
    js: {
        src: config.inputDir + '/js/*.js',
        libs: config.inputDir + '/js/libs/**/*.js',
        dst: config.outputDir + 'js'
    },
    html: {
        src: config.inputDir + '/html/**/*.html',
        dst: config.outputDir + 'html',
        watch: config.outputDir + '**/*.html'
    },
    assets: {
        src: config.inputDir + '/html/assets/**/*',
        imgSrc: config.inputDir + '/html/assets/*.{jpg,jpeg,png,gif}',
        dst: config.outputDir + 'html/assets'
    },
    fonts: {
        src: config.inputDir + '/html/assets/*.{eot,svg,ttf,woff}',
        dst: config.outputDir + 'html/assets'
    },
    svg: {
        src: [config.inputDir + '/svg/*.svg', config.inputDir + '/html/assets/*.svg'],
        dst: config.inputDir + '/scss'
    }
}

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
            config.componentDir + '/bootstrap/scss',
            config.componentDir + '/font-awesome/scss'
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
                dir: [paths.css.dst]
            },
            {
                route: '/img',
                dir: [paths.image.dst]
            },
            {
                route: '/fonts',
                dir: [paths.fonts.dst]
            },
            {
                route: '/js',
                dir: [paths.js.dst]
            },
            {
                route: '/html/assets',
                dir: [paths.assets.dst]
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
    browserSync.init(browserSyncOptions);

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

    return gulp.src(paths.css.src)
        .pipe(cache('sass'))    // only pass through changed files
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
        .pipe(sourcemaps.write('.'))
        .pipe(remember('sass')) // add back all files to the stream
        .pipe(gulp.dest(paths.css.dst))
        .pipe(stream());
};

function bootstrap_js(){
    return gulp.src(config.componentDir + '/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

function jquery(){
    return gulp.src(config.componentDir + '/jquery-1.11.3/dist/jquery.min.*')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

function fontawesome_fonts(){
    return gulp.src([
        config.componentDir + '/font-awesome/fonts/*'])
        .pipe(gulp.dest(paths.fonts.dst));
};

function html_assets(){
    return gulp.src(paths.assets.src)
        .pipe(gulp.dest(paths.assets.dst));
};

function minifyImg_assets() {
    return gulp.src(paths.assets.imgSrc, {since: gulp.lastRun(minifyImg_assets)})
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(paths.assets.dst))
        .pipe(stream());
}

function minifyImg(){
    return gulp.src(paths.image.src, {since: gulp.lastRun(minifyImg)})
        .pipe(image({zopflipng: false}))
        .pipe(gulp.dest(paths.image.dst))
        .pipe(stream());
};

function js_min(){
    return gulp.src(paths.js.src)
        .pipe(cache('js_min'))    // only pass through changed files
        .pipe(sourcemaps.init())
        .pipe(minifyJs().on('error', function(e) {
            console.error(e.message);
            this.emit('end');
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write( '.' ))
        .pipe(remember('js_min')) // add back all files to the stream
        .pipe(gulp.dest(paths.js.dst));
};

function js_bundle(){
    return gulp.src(paths.js.libs)
        .pipe(concat('bundle.js'))
        .pipe(cache('js_bundle'))    // only pass through changed files
        .pipe(sourcemaps.init())
        .pipe(minifyJs().on('error', function(e) {
            console.error(e.message);
            this.emit('end');
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write( '.' ))
        .pipe(remember('js_bundle')) // add back all files to the stream
        .pipe(gulp.dest(paths.js.dst))
        .pipe(stream());
};

function svg(){
    return gulp.src(paths.svg.src)
        .pipe(svgmin())
        .pipe(inlineSvg())
        .pipe(gulp.dest(paths.svg.dst));
};

function html(){
    return gulp.src(paths.html.src)
        .pipe(gulp.dest(paths.html.dst));
};

function watch(){
    gulp.watch(paths.html.src, html);
    gulp.watch(paths.html.watch).on('change', function(path, stats) {
        console.log('File ' + path + ' was changed');
        reload();
    });
    gulp.watch(paths.js.src, js_min);
    gulp.watch(paths.css.src, sass);
    gulp.watch(paths.image.src, minifyImg);
    gulp.watch(paths.assets.imgSrc, minifyImg_assets);
    gulp.watch(paths.svg.src, svg);
};


exports.svg               = svg;
exports.sass              = sass;
exports.html              = html;
exports.html_assets       = html_assets;
exports.minifyImg_assets  = minifyImg_assets;
exports.jquery            = jquery;
exports.bootstrap_js      = bootstrap_js;
exports.fontawesome_fonts = fontawesome_fonts;
exports.minifyImg         = minifyImg;
exports.js_min            = js_min;
exports.js_bundle         = js_bundle;
exports.liveReload        = liveReload;
exports.watch             = watch;

if(options.nolithium){
    var build = gulp.series(svg, html_assets, gulp.parallel(sass, html, minifyImg, js_min, js_bundle, bootstrap_js, fontawesome_fonts));
} else {
    var build = gulp.series(svg, html_assets, gulp.parallel(sass, minifyImg, minifyImg_assets, js_min, js_bundle));
}

gulp.task('build', build);
gulp.task('default', gulp.series(build, gulp.parallel(liveReload, watch)));

