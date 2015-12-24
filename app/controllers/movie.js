var async = require('async');
var Movie = require('../../models/movie');
var Ticket = require('../../models/ticket');

exports.list = function (req, res) {
    async.parallel([
        function (callback) {
            Movie.find({
                    status: 1
                })
                .lean()
                .exec(function (err, movies) {
                    async.each(movies, function (movie, callback) {
                        Ticket.count({
                            movie: movie._id,
                            time: {$gt: Date.now()}
                        }).exec(function (err, count) {
                            movie.ticketCount = count;
                            callback(err);
                        })
                    }, function (err) {
                        callback(err, movies.sort(function (a, b) {
                            return b.ticketCount - a.ticketCount
                        }));
                    })
                });
        },
        function (callback) {
            Movie.find({
                status: 2
            }).exec(function (err, movies) {
                async.each(movies, function (movie, callback) {
                    Ticket.count({
                        movie: movie._id
                    }).exec(function (err, count) {
                        movie.ticketCount = count;
                        callback(err);
                    })
                }, function (err) {
                    callback(err, movies.sort(function (a, b) {
                        return b.ticketCount - a.ticketCount
                    }));
                });
            });
        }
    ], function (err, results) {
        res.render('index', {
            isPlaying: results[0],
            willPlay: results[1]
        })
    });
};