var async = require('async');
var Movie = require('../../models/movie');

exports.list = function (req, res) {
    async.parallel([
        function (callback) {
            Movie.find({
                status: 1
            }).exec(callback);
        },
        function (callback) {
            Movie.find({
                status: 2
            }).exec(callback);
        }
    ], function (err, results) {
        res.render('index', {
            isPlaying: results[0],
            willPlay: results[1]
        })
    });
};