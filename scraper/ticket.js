var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var Cinema = require('../models/cinema');
var Movie = require('../models/movie');
var Ticket = require('../models/ticket');

exports.updateTickets = function () {
    async.parallel([
        function (callback) {
            Movie.find({status: {$gt: 0}})
                .sort('-_id')
                .exec(callback)
        },
        function (callback) {
            Cinema.find().exec(callback);
        }
    ], function (err, results) {
        async.parallel(
            [
                function (callback) {
                    async.eachSeries(results[0], function (movie, callback) {
                        async.eachSeries(results[1], function (cinema, callback) {
                            if (movie.taobaoId) {
                                getTicketsFromTaobao(movie.taobaoId, cinema.taobaoId, function (err, tickets) {
                                    async.each(tickets, function (ticket, callback) {
                                        Ticket.findOneAndUpdate({
                                            movie: movie._id,
                                            cinema: cinema._id,
                                            time: moment(ticket.date + " " + ticket.time, "YYYY-MM-DD HH:mm")
                                        }, {
                                            $set: {
                                                movie: movie._id,
                                                cinema: cinema._id,
                                                time: moment(ticket.date + " " + ticket.time, "YYYY-MM-DD HH:mm"),
                                                type: ticket.type,
                                                taobaoPrice: ticket.price
                                            }
                                        }, {new: true, upsert: true}, function (err, ticket) {
                                            console.log(moment().format('MM-DD HH:mm') + movie.name + ' Taobao:' + ticket.taobaoPrice);
                                            callback(err);
                                        });
                                    }, function (err) {
                                        setTimeout(function () {
                                            callback(err);
                                        }, 1000);
                                    });
                                });
                            } else {
                                callback(null);
                            }
                        }, function (err) {
                            movie.updateTime = moment();
                            movie.save();
                            callback(err);
                        });
                    }, function (err) {
                        callback(err);
                    });
                },
                function (callback) {
                    async.eachSeries(results[0], function (movie, callback) {
                        async.eachSeries(results[1], function (cinema, callback) {
                            if (movie.nuomiId) {
                                getTicketsFromNuomi(movie.nuomiId, cinema.nuomiId, function (err, tickets) {
                                    async.each(tickets, function (ticket, callback) {
                                        Ticket.findOneAndUpdate({
                                            movie: movie._id,
                                            cinema: cinema._id,
                                            time: ticket.time
                                        }, {
                                            $set: {
                                                movie: movie._id,
                                                cinema: cinema._id,
                                                time: ticket.time,
                                                type: ticket.type,
                                                nuomiPrice: ticket.price
                                            }
                                        }, {new: true, upsert: true}, function (err, ticket) {
                                            console.log(moment().format('MM-DD HH:mm') + movie.name + ' Nuomi:' + ticket.nuomiPrice);
                                            callback(err);
                                        });
                                    }, function (err) {
                                        setTimeout(function () {
                                            callback(err);
                                        }, 1000);
                                    });
                                });
                            } else {
                                callback(null);
                            }
                        }, function (err) {
                            movie.updateTime = moment();
                            movie.save();
                            callback(err);
                        });
                    }, function (err) {
                        callback(err);
                    });
                }
            ], function (err) {
            });
    });
};

var getTicketsFromTaobao = function (movieTaobaoId, cinemaTaobaoId, callback) {

    request({
            url: 'https://dianying.taobao.com/showDetailSchedule.htm?showId=' + movieTaobaoId + '&cinemaId=' + cinemaTaobaoId
        },
        function (error, response, body) {
            var $ = cheerio.load(body);
            var days = $($('.filter-select li')[2]).find('a')
                .map(function () {
                    var params = /date=(\d+\-\d+\-\d+)&n_s/.exec($(this).attr('data-param'));
                    return params[1];
                }).get();
            async.map(days, function (date, callback) {
                request('https://dianying.taobao.com/showDetailSchedule.htm?showId=' + movieTaobaoId + '&cinemaId=' + cinemaTaobaoId + '&date=' + date,
                    function (error, response, body) {
                        var $ = cheerio.load(body);
                        var tickets = $('.hall-table tbody').find('tr')
                            .map(function () {
                                return {
                                    date: date,
                                    time: $(this).find('.hall-time em').text(),
                                    type: $(this).find('.hall-type').text().trim(),
                                    price: $(this).find('.hall-price em').text()
                                };
                            }).get();
                        callback(error, tickets);
                    });
            }, function (err, results) {
                var tickets = [];
                results.forEach(function (result) {
                    result.forEach(function (ticket) {
                        tickets.push(ticket);
                    });
                });
                callback(err, tickets);
            });
        });
};

var getTicketsFromNuomi = function (movieNuomiId, cinemaNuomiId, callback) {

    request({url: 'http://nj.nuomi.com/pcindex/main/timetable?cinemaid=' + cinemaNuomiId + '&mid=' + movieNuomiId},
        function (err, response, body) {
            if (body) {
                var $ = cheerio.load(body);
                var tickets = [];
                $('#j-choose-list').find('.list')
                    .each(function (i) {
                        var params = /(\d+)\.(\d+)/g.exec($($('#j-movie-date').find('a.movie-date').get(i)).text());
                        var month = params[1];
                        var day = params[2];
                        if (month - 1 < moment().month()) {
                            var year = moment().year() + 1;
                        } else {
                            year = moment().year();
                        }
                        $(this).find('.table table tr').each(function () {
                            var type = $($(this).find('td')[1]).text().trim().replace('\/', '');
                            var price = $(this).find('.nuomi-price').text().trim().substring(1);

                            var params = /(\d+:\d+)/.exec($(this).find('td').first().text());
                            var time = moment(year + '-' + month + '-' + day + ' ' + params[1], 'YYYY-MM-DD HH:mm');
                            if (time.isValid()) {
                                tickets.push({
                                    time: time,
                                    type: type,
                                    price: price
                                });
                            }

                        });
                    });
                callback(err, tickets);
            } else {
                callback(err, []);
            }
        });
};
