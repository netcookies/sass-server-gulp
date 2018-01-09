import config from './conf'

export const paths = {
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
        dst: config.outputDir,
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

