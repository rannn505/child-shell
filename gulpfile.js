var gulp  = require("gulp");
var babel = require("gulp-babel");

var paths = {
    src:  { js: 'app.js'},
    dest: { js: 'dist/'}
};

gulp.task("default", function () {
  return gulp.src("src/index.js")
    .pipe(babel())
    .pipe(gulp.dest("./"));
});
