import gulp from "gulp";
import babel from 'gulp-babel';
import clean from 'gulp-clean';

const paths = {
    src:  { js: './src/**/*.js'},
    dest: { js: './dist'}
};

gulp.task('clean', function () {
  return gulp.src(paths.dest.js)
    .pipe(clean({force: true}));
});

gulp.task('build', ['clean'], ()=> {
    return gulp.src(paths.src.js)
		.pipe(babel())
		.pipe(gulp.dest(paths.dest.js));
});

gulp.task('watch', ()=> {
    gulp.watch('./src/**/*.js', ['build']);
});

gulp.task('default', ['build']);
