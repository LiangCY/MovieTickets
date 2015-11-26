var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('serve', function () {
    nodemon({
        script: 'app.js',
        env: {
            "NODE_ENV": "development"
        }
    });
});
