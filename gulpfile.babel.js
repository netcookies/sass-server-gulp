// Include gulp and es6 support
import gulp from 'gulp';
import babel from 'gulp-babel';


// Include plugins
import sassCompiler from 'gulp-sass';
import minifyCss    from 'gulp-clean-css';
import uglifyJs     from 'gulp-uglify';
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
    boolean: ['nolocal', 'static']
};

const options = minimist(process.argv.slice(2), knownOptions);

// configs

import {ports, config} from './conf/conf';
import {paths}         from './conf/paths';

if(!options.static) {
    const liPath    = config.outputDir + 'html/assets';
    paths.img.dst   = liPath;
    paths.js.dst    = liPath;
    paths.fonts.dst = liPath;
    paths.html.dst  = config.outputDir + 'html';
}

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
    paths.img.dst,
    paths.js.dst + '/**',
    '!' + paths.js.dst,
    '!' + paths.js.dst + '/libs/**'
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

// Task: compress images in /img
export function minifyImg(){
    return gulp.src(paths.img.src, {since: gulp.lastRun(minifyImg)})
        .pipe(imagemin())
        .pipe(gulp.dest(paths.img.dst))
        .pipe(stream());
};

// Task: minify Js put them into dist
export function minifyJs(){
    return gulp.src(paths.js.src)
        .pipe(babel())
        .pipe(sourcemaps.init())
        .pipe(uglifyJs().on('error', function(e) {
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
export function jsCombiner(){
    return gulp.src(paths.js.libs)
        .pipe(concat('bundle.js'))
        .pipe(sourcemaps.init())
        .pipe(uglifyJs().on('error', function(e) {
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

// Task: copy fonts files in /fonts to dist
export function fonts(){
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dst));
};

// Task: copy fav icons files in to dist
export function icons(){
    return gulp.src(paths.icons.src)
        .pipe(gulp.dest(paths.icons.dst));
};

// Task: Watch files change and fire event
export function watch(){
           gulp.watch(paths.html.src,        html);
           gulp.watch(paths.icons.src,       icons);
           gulp.watch(paths.fonts.src,       fonts);
           gulp.watch(paths.html.watch,      reload);
           gulp.watch(paths.js.src,          minifyJs);
           gulp.watch(paths.js.libs,         jsCombiner);
           gulp.watch(paths.img.src,         minifyImg);
           gulp.watch(paths.css.src,         sass);
           gulp.watch(paths.svg.src,         svg);
};

// Gulp: bring them all together
let build = gulp.parallel(sass, html, fonts, icons, minifyImg, minifyJs, jsCombiner);
const dev = gulp.series(clean, svg, build, gulp.parallel(liveReload, watch));

export const dist = gulp.series(clean, svg, build);
export default dev;
