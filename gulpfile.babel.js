/**
 * Gulp Configuration
 * @author Chris Burnell
 * @version 2.8.2
 */


'use strict';


// Define gulp-centric objects
import gulp from 'gulp';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import imagemin from 'gulp-imagemin';
import newer from 'gulp-newer';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import watch from 'gulp-watch';

// Define other objects
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import reporter from 'postcss-reporter';
import sassdoc from 'sassdoc';
import scss_syntax from 'postcss-scss';
import stylelint from 'stylelint';
import webp from 'imagemin-webp';

// Define paths
const paths = {
    root: '.',
    css: {
        src: 'src/sass',
        dest: 'css'
    },
    js: {
        src: 'src/js',
        dest: 'js'
    },
    images: {
        src: 'src/images',
        dest: 'images'
    },
    includes: '_includes',
    sassdoc: 'sassdoc'
};

// Define Stylelint Rules
const stylelintRules = {
    'rules': {
        'color-hex-case': 'lower',
        'color-hex-length': 'long',
        'color-no-invalid-hex': true,
        'declaration-block-no-duplicate-properties': [true, {
            ignore: ["consecutive-duplicates-with-different-values"]
        }],
        'font-weight-notation': 'numeric',
        'function-url-quotes': 'always',
        // 'max-nesting-depth': 3,
        'number-leading-zero': 'always',
        'number-max-precision': 4,
        'property-case': 'lower',
        'property-no-unknown': true,
        'keyframe-declaration-no-important': true,
        'length-zero-no-unit': true,
        'time-min-milliseconds': 100,
        'block-opening-brace-newline-after': 'always',
        'selector-no-id': true,
        'shorthand-property-no-redundant-values': true,
        'string-quotes': 'double',
        'unit-blacklist': ['pc', 'pt', 'ex', 'ch', 'mm', 'cm', 'in'],
        'unit-case': 'lower',
        'unit-no-unknown': true
    }
};

// -----------------------------------------------------------------------------

// Lint Sass
gulp.task('css-lint', () => {
    return gulp.src([`!${paths.css.src}/vendors/*.scss`,
                     `${paths.css.src}/**/*.scss`])
        .pipe(plumber())
        .pipe(postcss([
            stylelint(stylelintRules),
            reporter({
                plugins: ['!postcss-discard-empty'],
                clearMessages: true,
                throwError: false
            })
        ], { syntax: scss_syntax }));
});

// Compile CSS from Sass
gulp.task('css-main', ['css-lint'], () => {
    return gulp.src(`${paths.css.src}/main.scss`)
        .pipe(plumber())
        .pipe(newer(`${paths.css.dest}`))
        .pipe(sourcemaps.init())
        .pipe(sass({
            errLogToConsole: true,
            indentWidth: 4,
            outputStyle: 'expanded',
            sourceMap: paths.css.src
        }))
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    'last 2 versions',
                    '> 1%'
                ]
            }),
            reporter({
                plugins: ['!postcss-discard-empty'],
                clearMessages: true,
                throwError: true
            })
        ]))
        .pipe(gulp.dest(`${paths.css.dest}/`))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(postcss([
            cssnano(),
            reporter({
                plugins: ['!postcss-discard-empty'],
                clearMessages: true,
                throwError: true
            })
        ]))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${paths.css.dest}/`));
});

// Generate inline Critical CSS include
gulp.task('css-critical', () => {
    return gulp.src(`${paths.css.src}/critical.scss`)
        .pipe(plumber())
        .pipe(newer(`${paths.includes}/generated/`))
        .pipe(sass({
            errLogToConsole: true,
            indentWidth: 4,
            outputStyle: 'expanded'
        }))
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    'last 2 versions',
                    '> 1%'
                ]
            }),
            reporter({
                plugins: ['!postcss-discard-empty'],
                clearMessages: true,
                throwError: true
            })
        ]))
        .pipe(gulp.dest(`${paths.css.dest}/`))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(postcss([
            cssnano(),
            reporter({
                plugins: ['!postcss-discard-empty'],
                clearMessages: true,
                throwError: true
            })
        ]))
        .pipe(gulp.dest(`${paths.css.dest}/`))
        .pipe(rename({
            basename: 'critical-css',
            extname: '.html'
        }))
        .pipe(gulp.dest(`${paths.includes}/generated/`));
});

// Generate Sass documentation
gulp.task('css-sassdoc', () => {
    return gulp.src(`${paths.css.src}/**/*.scss`)
        .pipe(plumber())
        .pipe(newer(`${paths.sassdoc}`))
        .pipe(sassdoc({
            dest: `${paths.sassdoc}/`
        }));
});

// -----------------------------------------------------------------------------

// Compile JavaScript
gulp.task('js-compile', () => {
    return gulp.src([`!${paths.js.src}/vendors/loadcss.js`,
                     `!${paths.js.src}/vendors/loadcss-preload-polyfill.js`,
                     `!${paths.js.src}/outdated/*.js`,
                     `!${paths.js.src}/serviceworker.js`,
                     `${paths.js.src}/**/*.js`])
        .pipe(plumber())
        .pipe(newer(`${paths.js.dest}/`))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('main.js'))
        .pipe(gulp.dest(`${paths.js.dest}/`))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(`${paths.js.dest}/`));
});

// Generate inline LoadCSS include
gulp.task('js-loadcss', () => {
    return gulp.src([`${paths.js.src}/vendors/loadcss.js`,
                     `${paths.js.src}/vendors/loadcss-preload-polyfill.js`])
        .pipe(plumber())
        .pipe(newer(`${paths.includes}/generated/`))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(concat('loadcss.html'))
        .pipe(gulp.dest(`${paths.includes}/generated/`));
});

// Place the Service Worker at the root
gulp.task('js-serviceworker', () => {
    return gulp.src(`${paths.js.src}/serviceworker.js`)
        .pipe(plumber())
        .pipe(newer(`${paths.root}/`))
        .pipe(gulp.dest(`${paths.root}/`));
});

// -----------------------------------------------------------------------------

// Compress src images
gulp.task('compress-images', () => {
    return gulp.src(`${paths.images.src}/**/*`, { base: paths.images.src })
        .pipe(plumber())
        .pipe(newer(`${paths.images.dest}/`))
        .pipe(imagemin())
        .pipe(gulp.dest(`${paths.images.dest}/`));
});

// Generate WebP-format counterparts for all PNG images
gulp.task('png-to-webp', () => {
    return gulp.src(`${paths.images.src}/**/*.png`, { base: paths.images.src })
        .pipe(plumber())
        .pipe(newer(`${paths.images.dest}/`))
        .pipe(imagemin([
            webp({
                lossless: true
            })
        ]))
        .pipe(rename({
            extname: '.webp'
        }))
        .pipe(gulp.dest(`${paths.images.dest}/`));
});

// -----------------------------------------------------------------------------

// Default task
gulp.task('default', () => {
    gulp.start('css');
    gulp.start('js');
    gulp.start('images');
});

// CSS task
gulp.task('css', () => {
    gulp.start('css-main');
    gulp.start('css-critical');
    gulp.start('css-sassdoc');
});

// JS task
gulp.task('js', ['js-compile'], () => {
    gulp.start('js-loadcss');
    gulp.start('js-serviceworker');
});

// Images task
gulp.task('images', ['compress-images'], () => {
    gulp.start('png-to-webp');
});

// -----------------------------------------------------------------------------

// Watch files and perform the appropriate tasks
gulp.task('watch', ['css', 'js'], () => {
    watch(`${paths.css.src}/**/*`, () => {
        gulp.start('css');
    });
    watch(`${paths.js.src}/**/*`, () => {
        gulp.start('js');
    });
    watch(`${paths.images.src}/**/*`, () => {
        gulp.start('images');
    });
});
