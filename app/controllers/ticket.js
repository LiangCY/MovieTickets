var async = require('async');
var moment = require('moment');
var Movie = require('../../models/movie');
var Cinema = require('../../models/cinema');
var Ticket = require('../../models/ticket');

exports.getTickets = function (req, res) {
    var movieName = req.query.movie;
    var cinemaName = req.query.cinema;
    async.parallel([
        function (callback) {
            Movie.findOne({name: movieName})
                .exec(callback);
        },
        function (callback) {
            Cinema.findOne({name: cinemaName})
                .exec(callback);
        }
    ], function (err, results) {
        Ticket.find({
            movie: results[0]._id,
            cinema: results[1]._id,
            time: {$gt: new Date()}
        }).sort('time')
            .exec(function (err, tickets) {
                res.render('tickets', {
                    movie: results[0].name,
                    cinema: results[1].name,
                    tickets: tickets
                })
            });
    });

};