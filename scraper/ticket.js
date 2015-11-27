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
        async.parallel([
            function (callback) {
                async.eachSeries(results[0], function (movie, callback) {
                    async.eachSeries(results[1], function (cinema, callback) {
                        if (movie.taobaoId && cinema.taobaoId) {
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
                        if (movie.nuomiId && cinema.nuomiId) {
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
            },
            function (callback) {
                async.eachSeries(results[1], function (cinema, callback) {
                    if (cinema.meituanId) {
                        getTicketsFromMeituan(cinema.meituanId, function (err, tickets) {
                            async.each(tickets, function (ticket, callback) {
                                Movie.findOne({meituanId: ticket.movieMeituanId})
                                    .exec(function (err, movie) {
                                        if (movie) {
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
                                                    meituanPrice: ticket.price
                                                }
                                            }, {new: true, upsert: true}, function (err, ticket) {
                                                console.log(moment().format('MM-DD HH:mm') + movie.name + ' Meituan');
                                                callback(err);
                                            });
                                        } else {
                                            callback(err);
                                        }
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
                    callback(err);
                });
            }
        ], function (err) {
            if (err) {
                console.log(err);
            }
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

var getTicketsFromMeituan = function (cinemaMeituanId, callback) {
    request({url: 'http://nj.meituan.com/shop/' + cinemaMeituanId},
        function (err, response, body) {
            if (body) {
                var $ = cheerio.load(body);
                var tickets = [];
                $('.movie-info').each(function () {
                    var movieMeituanId = $(this).find('header a.movie-info__name').attr("href").split('/')[2];
                    var name = $(this).find('header a.movie-info__name').attr("title");
                    var $dateList = $(this).find('.show-time .show-time-tag');
                    $(this).find('table.time-table').each(function (i) {
                        var date = $($dateList[i]).attr('data-date');
                        $(this).find('tr').each(function (i) {
                            if (i > 0) {
                                var time = $(this).find('.start-time').text();
                                if (time) {
                                    var type = $($(this).find('td')[1]).text();
                                    console.log(name);
                                    console.log(date + ' ' + time);
                                    console.log(type);
                                    var $mobilePrice = $(this).find('.promotion-active');
                                    if ($mobilePrice.length == 0) {
                                        var price = $(this).find('.price-wrapper strong.price').html();
                                    } else {
                                        price = $($mobilePrice.find('.trigger__price')).html();
                                    }
                                    tickets.push({
                                        movieMeituanId: movieMeituanId,
                                        time: moment(date + ' ' + time, 'YYYY-MM-DD HH:mm'),
                                        type: type,
                                        price: price
                                    });
                                }
                            }
                        });
                    });
                });
                callback(err, tickets);
            } else {
                callback(err, []);
            }
        });
};
