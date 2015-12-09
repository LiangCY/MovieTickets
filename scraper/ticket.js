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
                .sort('status')
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
                                        console.log(moment().format('MM-DD HH:mm') + movie.name + ' ' + cinema.name + ' Taobao:' + ticket.taobaoPrice);
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
                                    callback(err);
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
            },
            function (callback) {
                async.eachSeries(results[0], function (movie, callback) {
                    if (movie.weipiaoId) {
                        getTicketsFromWeipiao(movie.weipiaoId, function (err, tickets) {
                            async.each(tickets, function (ticket, callback) {
                                Ticket.findOneAndUpdate({
                                    movie: movie._id,
                                    cinema: ticket.cinemaId,
                                    time: ticket.time
                                }, {
                                    $set: {
                                        movie: movie._id,
                                        cinema: ticket.cinemaId,
                                        time: ticket.time,
                                        type: ticket.type,
                                        weipiaoPrice: ticket.price
                                    }
                                }, {new: true, upsert: true}, function (err, ticket) {
                                    console.log(moment().format('MM-DD HH:mm') + movie.name + ' Weipiao:' + ticket.weipiaoPrice);
                                    callback(err);
                                });
                            }, function (err) {
                                movie.updateTime = moment();
                                movie.save();
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
            },
            function (callback) {
                async.eachSeries(results[0], function (movie, callback) {
                    async.eachSeries(results[1], function (cinema, callback) {
                        if (movie.dianpingId && cinema.dianpingId) {
                            getTicketsFromDianping(movie.dianpingId, cinema.dianpingId, function (err, tickets) {
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
                                            dianpingPrice: ticket.price
                                        }
                                    }, {new: true, upsert: true}, function (err, ticket) {
                                        console.log(moment().format('MM-DD HH:mm') + movie.name + ' ' + cinema.name + ' Dianping:' + ticket.dianpingPrice);
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
                    var $dateList = $(this).find('.show-time .show-time-tag');
                    $(this).find('table.time-table').each(function (i) {
                        var date = $($dateList[i]).attr('data-date');
                        $(this).find('tr').each(function (i) {
                            if (i > 0) {
                                var time = $(this).find('.start-time').text();
                                if (time) {
                                    var type = $($(this).find('td')[1]).text();
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

var getTicketsFromWeipiao = function (movieWeipiaoId, callback) {
    request({url: 'http://www.wepiao.com/film_show_' + movieWeipiaoId + '.html'},
        function (err, response, body) {
            if (body) {
                var $ = cheerio.load(body);
                var tickets = [];
                var dates = $('.fs.fs_date .list').find('span').map(function () {
                    return $(this).attr('id');
                }).get();
                async.eachSeries(dates, function (date, callback) {
                    request({
                            url: 'http://www.wepiao.com/film_area.html',
                            method: 'POST',
                            form: {
                                fid: movieWeipiaoId,
                                date: date
                            }
                        },
                        function (err, response, body) {
                            try {
                                var results = JSON.parse(body)[0];
                            } catch (e) {
                                return callback(e);
                            }
                            if (!results || !results.cinema) {
                                return callback(err);
                            }
                            var cinemas = results.cinema.map(function (item) {
                                return item.id;
                            });
                            Cinema.find({
                                weipiaoId: {$in: cinemas}
                            }).exec(function (err, cinemas) {
                                async.each(cinemas, function (cinema, callback) {
                                    request({
                                            url: 'http://www.wepiao.com/film_scheseat.html',
                                            method: 'POST',
                                            form: {
                                                fid: movieWeipiaoId,
                                                date: date,
                                                cid: cinema.weipiaoId
                                            }
                                        },
                                        function (err, response, body) {
                                            var schedules = JSON.parse(body);
                                            if (!schedules || schedules.length == 0) {
                                                return callback(err);
                                            }
                                            schedules.forEach(function (schedule) {
                                                tickets.push({
                                                    cinemaId: cinema._id,
                                                    time: moment(date + schedule.time, 'YYYYMMDDHH:mm'),
                                                    type: schedule.lagu + schedule.type,
                                                    price: schedule.price
                                                });
                                            });
                                            callback(err);
                                        });
                                }, function (err) {
                                    callback(err);
                                });
                            })
                        });
                }, function (err) {
                    callback(err, tickets);
                });
            } else {
                callback(err, []);
            }
        });
};

var getTicketsFromDianping = function (movieDianpingId, cinemaDianpingId, callback) {
    request({
        url: 'http://t.dianping.com/movie/ajax/movieDetail?movieId=' + movieDianpingId + '&cinemaId=' + cinemaDianpingId,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
        }
    }, function (err, response, body) {
        if (body) {
            var tickets = [];
            var $ = cheerio.load(body);
            var dates = $('.date-box dd.J_item').map(function () {
                return $(this).attr('data-id');
            }).get();
            async.eachSeries(dates, function (date, callback) {
                request({
                    url: 'http://t.dianping.com/movie/ajax/movieDetail?movieId=' + movieDianpingId + '&cinemaId=' + cinemaDianpingId + '&date=' + date,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
                    }
                }, function (err, response, body) {
                    if (body) {
                        var $ = cheerio.load(body);
                        $('.sessions-body .tbody tr').each(function () {
                            var time = $(this).find('.s-ses').text();
                            var type = $(this).find('.s-ver').text().replace('/', '');
                            var price = $(this).find('.s-price').text().replace('¥', '');
                            tickets.push({
                                time: moment(date + time, 'YYYY-MM-DDHH:mm'),
                                type: type,
                                price: price
                            });
                        });
                    }
                    callback(err);
                });
            }, function (err) {
                callback(err, tickets);
            });
        } else {
            callback(err, []);
        }
    })
};

exports.removeTickets = function (callback) {
    Ticket.remove({
        time: {$lt: moment()}
    }, function (err) {
        callback(err);
    })
};
