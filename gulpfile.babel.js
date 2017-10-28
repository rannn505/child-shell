import gulp from "gulp"
import del from 'del'
import babel from 'gulp-babel'
import header from 'gulp-header'

const paths = {
    src:  { js: './src/**/*.js'},
    dest: { js: './dist'}
};
const pkg = require('./package.json');
const banner = ['/*********************************************************',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @copyright Copyright (c) 2017 <%= pkg.author %>',
  ' * @license <%= pkg.license %> (http://www.opensource.org/licenses/mit-license.php)',
  ' * @Compiled At: ' + new Date().toLocaleDateString(),
  '  *********************************************************/',
  ''].join('\n');

  gulp.task('clean', () => {
    return del(paths.dest.js);
  });

gulp.task('build', ['clean'], ()=> {
    return gulp.src(paths.src.js)
		.pipe(babel())
    .pipe(header(banner, { pkg : pkg } ))
		.pipe(gulp.dest(paths.dest.js));
});

gulp.task('watch', ()=> {
    gulp.watch('./src/**/*.js', ['build']);
});

gulp.task('default', ['build']);
