// Include gulp and es6 support
import gulp from 'gulp';
import babel from 'gulp-babel';


// Include plugins
import sassCompiler from 'gulp-sass';
import minifyCss    from 'gulp-clean-css';
import minifyJs     from 'gulp-uglify';
import rename       from 'gulp-rename';
import browserSync  from 'browser-sync';
import imagemin     from 'gulp-imagemin';
import inlineSvg    from 'gulp-inline-svg';
import minimist     from 'minimist';
import fs           from 'fs';
import sourcemaps   from 'gulp-sourcemaps';
import cache        from 'gulp-cached';
import concat       from 'gulp-concat';
import remember     from 'gulp-remember';
import autoprefixer from 'gulp-autoprefixer';
import del          from 'del';

import net          from 'net';
import http         from 'http';
import https        from 'https';
import httpProxy    from 'http-proxy';

// configs

const basePort        = 8080;
const httpPort        = 8081;
const httpsPort       = 8082;
const browserSyncPort = 8088;
const localDomain = 'localhost:' + basePort;

const knownOptions = {
    string: 'proxy',
    boolean: ['nolocal', 'vendors'],
    default: { proxy: 'none' }
};

const options = minimist(process.argv.slice(2), knownOptions);

const config = {
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
};

let sassOptions = {
    errLogToConsole: true,
    style: 'compressed',
    outputStyle: 'expanded',
    precision: 8
};

let browserSyncOptions = {
    server: {
        baseDir: [config.outputDir],
        directory: true
    },
    open: false,
    port: browserSyncPort
};

if(options.vendors){
        sassOptions["includePaths"] = [
            config.componentDir + '/bootstrap/scss',
            config.componentDir + '/font-awesome/scss'
        ];
};

if(!options.nolocal){
    browserSyncOptions["socket"] = {
        domain: localDomain
    }
}

if(options.proxy !== 'none'){
    let browserSyncOptions = {
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

const httpProxyOptions = {
    target: {
        host: 'localhost',
        port: browserSyncPort
    }
};

const sslCerts = {
    key: fs.readFileSync('localhost.key.pem', 'utf8'),
    cert: fs.readFileSync('localhost.cert.pem', 'utf8')
}

// Task: clean assets before run
export const clean = () => del([
    paths.css.dst,
    paths.image.dst,
    paths.js.dst + '/**',
    '!' + paths.js.dst,
    '!' + paths.js.dst + '/vendor/**'
]).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
});

// Task: BrowserSync init & options
const server = browserSync.create();
const stream = server.stream;

function reload(done) {
  server.reload();
  done();
}

export function liveReload(done){
    server.init(browserSyncOptions);

    function tcpConnection(conn) {
        conn.once('data', function (buf) {
            // A TLS handshake record starts with byte 22.
            let address = (buf[0] === 22) ? httpsPort : httpPort;
            let proxy = net.createConnection(address, function () {
                proxy.write(buf);
                conn.pipe(proxy).pipe(conn);
            });
        });
    }

    net.createServer(tcpConnection).listen(basePort);
    let proxy = new httpProxy.createProxyServer(httpProxyOptions);
    let httpServer = http.createServer(function(req, res){
        proxy.web(req, res);
        req.on('error', (e) => {
            console.log('HTTP Server through a request error!');
            console.error(e.message);
            this.emit('end');
        });
    });
    let httpsServer = https.createServer(sslCerts, function(req, res){
        proxy.web(req, res);
        req.on('error', (e) => {
            console.log('HTTPS Server through a request error!');
            console.error(e.message);
            this.emit('end');
        });
    });

    httpServer.on('upgrade', function(req, socket, head){
        proxy.ws(req, socket, head);
        //console.log('HTTP Server upgrading!');
        req.on('error', (e) => {
            console.log('HTTP Server through a request error!');
            console.error(e.message);
            this.emit('end');
        });
    });

    httpsServer.on('upgrade', function(req, socket, head){
        proxy.ws(req, socket, head);
        //console.log('HTTPS Server upgrading!');
        req.on('error', (e) => {
            console.log('HTTPS Server through a request error!');
            console.error(e.message);
            this.emit('end');
        });
    });

    httpServer.listen(httpPort).on('listening', () => {
        console.log('HTTP Server listening at ' + httpPort + ' port');
    });
    httpsServer.listen(httpsPort).on('listening', () => {
        console.log('HTTPS Server listening at ' + httpPort + ' port');
    });

    done();
};

// Task: compile sass through lib-sass
export function sass(){
    let autoprefixerOptions = {
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

// Task: copy bootstrap js to dist
export function bootstrap_js(){
    return gulp.src(config.componentDir + '/bootstrap/dist/js/bootstrap.min.js')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

// Task: copy jquery to dist
export function jquery(){
    return gulp.src(config.componentDir + '/jquery-1.11.3/dist/jquery.min.*')
        .pipe(gulp.dest(config.outputDir + '/js'));
};

// Task: copy fontawesome fonts to dist
export function fontawesome_fonts(){
    return gulp.src([
        config.componentDir + '/font-awesome/fonts/*'])
        .pipe(gulp.dest(paths.fonts.dst));
};

// Task: copy src: html/assets to dist
export function html_assets(){
    return gulp.src(paths.assets.src)
        .pipe(gulp.dest(paths.assets.dst));
};

// Task: compress images in html/assets
export function minifyImg_assets() {
    return gulp.src(paths.assets.imgSrc, {since: gulp.lastRun(minifyImg_assets)})
        .pipe(imagemin())
        .pipe(gulp.dest(paths.assets.dst))
        .pipe(stream());
}

// Task: compress images in /img
export function minifyImg(){
    return gulp.src(paths.image.src, {since: gulp.lastRun(minifyImg)})
        .pipe(imagemin())
        .pipe(gulp.dest(paths.image.dst))
        .pipe(stream());
};

// Task: minify Js put them into dist
export function js_min(){
    return gulp.src(paths.js.src)
        .pipe(babel())
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

// Task: concat JS libs files into one file then put them into dist
export function js_bundle(){
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

// Task: compress svg in /svg and concat them into one file;
export function svg(){
    return gulp.src(paths.svg.src)
        .pipe(imagemin())
        .pipe(inlineSvg())
        .pipe(gulp.dest(paths.svg.dst));
};

// Task: copy html files in /html to dist
export function html(){
    return gulp.src(paths.html.src)
        .pipe(gulp.dest(paths.html.dst));
};

// Task: Watch files change and fire event
export function watch(){
    gulp.watch(paths.html.src, html);
    gulp.watch(paths.html.watch, reload);
    gulp.watch(paths.js.src, js_min);
    gulp.watch(paths.js.libs, js_bundle);
    gulp.watch(paths.css.src, sass);
    gulp.watch(paths.image.src, minifyImg);
    gulp.watch(paths.assets.imgSrc, minifyImg_assets);
    gulp.watch(paths.svg.src, svg);
};

// Gulp: bring them all together
let build;
if(options.vendors){
    build = gulp.parallel(sass, html, minifyImg, js_min, js_bundle, bootstrap_js, fontawesome_fonts);
} else {
    build = gulp.parallel(sass, minifyImg, minifyImg_assets, js_min, js_bundle);
}

const dev = gulp.series(clean, svg, html_assets, build, gulp.parallel(liveReload, watch));

export default dev;
