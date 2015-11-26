var async = require('async');
var Cinema = require('../../models/cinema');
var Movie = require('../../models/movie');
var Ticket = require('../../models/ticket');

exports.list = function (req, res) {
    var movieName = req.query.name;
    Movie.findOne({name: movieName}).exec(function (err, movie) {
        Cinema.find().exec(function (err, cinemas) {
            async.map(cinemas, function (cinema, callback) {
                Ticket.find({
                    movie: movie._id,
                    cinema: cinema._id,
                    time: {$gt: new Date()}
                }).exec(function (err, tickets) {
                    cinema.ticketCount = tickets.length;
                    var prices = [];
                    tickets.forEach(function (ticket) {
                        if(ticket.taobaoPrice){
                            prices.push(parseFloat(ticket.taobaoPrice));
                        }
                        if(ticket.nuomiPrice){
                            prices.push(parseFloat(ticket.nuomiPrice));
                        }
                    });
                    if (tickets.length == 0) {
                        cinema.minPrice = '';
                        callback(err, cinema);
                    } else {
                        cinema.minPrice = Math.min.apply({}, prices);
                        callback(err, cinema);
                    }
                });
            }, function (err, results) {
                res.render('cinemas', {
                    movie: movieName,
                    cinemas: results
                });
            });
        });
    });
};

exports.manage = function (req, res) {
    Cinema.find().exec(function (err, cinemas) {
        res.render('manage', {
            cinemas: cinemas
        });
    });
};

exports.edit = function (req, res) {
    var cinemaId = req.query.cinemaId;
    var taobaoId = req.query.taobaoId;
    var nuomiId = req.query.nuomiId;
    Cinema.findByIdAndUpdate(cinemaId, {
        $set: {
            taobaoId: taobaoId,
            nuomiId: nuomiId
        }
    }, {new: true}, function (err, cinema) {
        res.send(cinema);
    });
};

exports.delete = function (req, res) {
    var cinemaId = req.query.cinemaId;
    Cinema.findByIdAndRemove(cinemaId, function (err, cinema) {
        Ticket.remove({cinema: cinemaId}, function () {
            res.json({success: 1});
        })
    });
};
