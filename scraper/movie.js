var scraperjs = require('scraperjs');
var _ = require('underscore');
var async = require('async');
var Movie = require('../models/movie');

exports.updateMovies = function () {
    async.series([
        function (callback) {
            getMoviesFromTaobao(function (result) {
                async.parallel([
                    function (callback) {
                        var movies = _.union(result.isPlaying, result.willPlay).map(function (movie) {
                            return movie.name;
                        });
                        Movie.find({name: {$not: {$in: movies}}}).exec(function (err, movies) {
                            async.each(movies, function (movie, callback) {
                                movie.status = 0;
                                movie.save(function (err) {
                                    callback(err);
                                });
                            }, function (err) {
                                callback(err);
                            });
                        });
                    },
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    name: movie.name,
                                    poster: movie.poster,
                                    updateTime: new Date(),
                                    status: 1,
                                    taobaoId: movie.taobaoId
                                }
                            }, {
                                new: true,
                                upsert: true
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    name: movie.name,
                                    poster: movie.poster,
                                    updateTime: new Date(),
                                    status: 2,
                                    taobaoId: movie.taobaoId
                                }
                            }, {
                                new: true,
                                upsert: true
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        },
        function (callback) {
            getMoviesFromNuomi(function (result) {
                async.parallel([
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    nuomiId: movie.nuomiId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        })
                    },
                    function (callback) {
                        async.each(result.willPlay, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    nuomiId: movie.nuomiId
                                }
                            }, function (err) {
                                callback(err);
                            });
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    callback(err);
                });
            });
        }
    ], function (err) {

    });
};

var getMoviesFromTaobao = function (callback) {
    scraperjs.StaticScraper
        .create('https://dianying.taobao.com/showList.htm?n_s=new')
        .scrape(function ($) {
            var $movieList = $(".tab-movie-list");
            var isPlaying = $($movieList[0])
                .find('.movie-card-wrap')
                .map(function () {
                    var href = $(this).find('a.movie-card').attr('href');
                    var taobaoId = href.substring(href.indexOf('showId=') + 7, href.indexOf('&n_s'));
                    var name = $(this).find('.movie-card-name .bt-l').text();
                    if (name == '名侦探柯南2015：业火的向日葵') {
                        name = '名侦探柯南：业火的向日葵'
                    }
                    return {
                        name: name,
                        poster: $(this).find('.movie-card-poster img').attr('src'),
                        taobaoId: taobaoId
                    };
                }).get();
            var willPlay = $($movieList[1])
                .find('.movie-card-wrap')
                .map(function () {
                    var href = $(this).find('a.movie-card').attr('href');
                    var taobaoId = href.substring(href.indexOf('showId=') + 7, href.indexOf('&n_s'));
                    return {
                        name: $(this).find('.movie-card-name .bt-l').text(),
                        poster: $(this).find('.movie-card-poster img').attr('src'),
                        taobaoId: taobaoId
                    };
                }).get();
            return {
                isPlaying: isPlaying,
                willPlay: willPlay
            }
        })
        .then(function (movies) {
            callback(movies);
        });
};

var getMoviesFromNuomi = function (callback) {
    scraperjs.StaticScraper
        .create('http://nj.nuomi.com/pcindex/main/filmlist?type=1')
        .scrape(function ($) {
            var isPlaying = $("#showing-movies-j")
                .find(".item-box a.item")
                .map(function () {
                    return {
                        name: $(this).attr('title'),
                        nuomiId: $(this).attr('href').substring(6)
                    };
                }).get();
            var willPlay = $("#upcoming-movies-j")
                .find(".item-box a.item")
                .map(function () {
                    return {
                        name: $(this).attr('title'),
                        nuomiId: $(this).attr('href').substring(6)
                    };
                }).get();
            return {
                isPlaying: isPlaying,
                willPlay: willPlay
            }
        })
        .then(function (movies) {
            callback(movies);
        });
};