import {config} from './conf';

export let paths = {
    img: {
        src: config.inputDir + '/img/**/*.{jpg,jpeg,png,gif}',
        dst: config.outputDir + 'img'
    },
    js: {
        src: config.inputDir + '/js/*.js',
        libs: config.inputDir + '/js/libs/**/*.js',
        dst: config.outputDir + 'js'
    },
    html: {
        src: config.inputDir + '/html/**/*.html',
        dst: config.outputDir,
        watch: config.outputDir + '**/*.html'
    },
    fonts: {
        src: config.inputDir + '/fonts/**/*.{eot,svg,ttf,woff,woff2}',
        dst: config.outputDir + 'fonts'
    },
    icons: {
        src: config.inputDir + '/icons/**/*',
        dst: config.outputDir
    },
    css: {
        src: [config.inputDir + '/scss/*.scss', config.inputDir + '/scss/**/_*.scss'],
        dst: config.outputDir + 'css'
    },
    svg: {
        src: config.inputDir + '/svg/**/*.svg',
        dst: config.inputDir + '/scss'
    },
    others: {
        src: config.inputDir + '/others/**/*',
        dst: config.outputDir
    }
};
