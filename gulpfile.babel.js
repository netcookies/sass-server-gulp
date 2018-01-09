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
import concat       from 'gulp-concat';
import autoprefixer from 'gulp-autoprefixer';
import del          from 'del';

import net          from 'net';
import http         from 'http';
import https        from 'https';
import httpProxy    from 'http-proxy';

// console arguments

const knownOptions = {
    boolean: ['nolocal']
};

const options = minimist(process.argv.slice(2), knownOptions);

// configs

import {ports, config} from 'conf/conf';
import paths from 'conf/paths';

// sass options

let sassOptions = {
    errLogToConsole: true,
    style: 'compressed',
    outputStyle: 'expanded',
    precision: 8
};

// browserSync options

let browserSyncOptions = {
    server: {
        baseDir: [config.outputDir],
        directory: true
    },
    open: false,
    port: ports.browserSyncPort
};

if(!options.nolocal){
    browserSyncOptions["socket"] = {
        domain: 'localhost:' + ports.basePort
    }
}

// http/https proxy opionts

const httpProxyOptions = {
    target: {
        host: 'localhost',
        port: ports.browserSyncPort
    }
};

const sslCerts = {
    key: fs.readFileSync('certs/localhost.key.pem', 'utf8'),
    cert: fs.readFileSync('certs/localhost.cert.pem', 'utf8')
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
            let address = (buf[0] === 22) ? ports.httpsPort : ports.httpPort;
            let proxy = net.createConnection(address, function () {
                proxy.write(buf);
                conn.pipe(proxy).pipe(conn);
            });
        });
    }

    net.createServer(tcpConnection).listen(ports.basePort);
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

    httpServer.listen(ports.httpPort).on('listening', () => {
        console.log('HTTP Server listening at ' + ports.httpPort + ' port');
    });
    httpsServer.listen(ports.httpsPort).on('listening', () => {
        console.log('HTTPS Server listening at ' + ports.httpPort + ' port');
    });

    done();
};

// Task: compile sass through lib-sass
export function sass(){
    let autoprefixerOptions = {
        browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    };

    return gulp.src(paths.css.src)
        .pipe(sourcemaps.init())
        .pipe(sassCompiler(sassOptions).on('error', function (error) {
            sassCompiler.logError(error);
            this.emit('end');
        }))
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
        .pipe(gulp.dest(paths.css.dst))
        .pipe(stream());
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
        .pipe(sourcemaps.init())
        .pipe(minifyJs().on('error', function(e) {
            console.error(e.message);
            this.emit('end');
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write( '.' ))
        .pipe(gulp.dest(paths.js.dst));
};

// Task: concat JS libs files into one file then put them into dist
export function js_bundle(){
    return gulp.src(paths.js.libs)
        .pipe(concat('bundle.js'))
        .pipe(sourcemaps.init())
        .pipe(minifyJs().on('error', function(e) {
            console.error(e.message);
            this.emit('end');
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write( '.' ))
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
let build = gulp.parallel(sass, html, minifyImg, minifyImg_assets, js_min, js_bundle);
const dev = gulp.series(clean, svg, html_assets, build, gulp.parallel(liveReload, watch));

export default dev;
