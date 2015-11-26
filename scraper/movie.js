var scraperjs = require('scraperjs');
var _ = require('underscore');
var async = require('async');
var Movie = require('../models/movie');

exports.updateMovies = function () {
    async.series([
        function (callback) {
            getMoviesFromMeituan(function (result) {
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
                                    meituanId: movie.meituanId
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
                                    meituanId: movie.meituanId
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
                                    poster: movie.poster,
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
                                    poster: movie.poster,
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
        },
        function (callback) {
            getMoviesFromTaobao(function (result) {
                async.parallel([
                    function (callback) {
                        async.each(result.isPlaying, function (movie, callback) {
                            Movie.findOneAndUpdate({
                                name: movie.name
                            }, {
                                $set: {
                                    poster: movie.poster,
                                    taobaoId: movie.taobaoId
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
                                    poster: movie.poster,
                                    taobaoId: movie.taobaoId
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
        if (err) {
            console.log(err);
        }
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
                        poster: $(this).find('img').attr('src'),
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

var getMoviesFromMeituan = function (callback) {
    async.series([
        function (callback) {
            scraperjs.StaticScraper
                .create('http://www.meituan.com/dianying/zuixindianying')
                .scrape(function ($) {
                    return $("#content")
                        .find(".movie-cell")
                        .map(function () {
                            var $cover = $(this).find('.movie-cell__cover');
                            return {
                                name: $cover.attr("title"),
                                meituanId: /dianying\/(\d+)$/.exec($cover.attr("href"))[1],
                                poster: $cover.find('img').attr('src')
                            };
                        }).get();
                })
                .then(function (movies) {
                    callback(null, movies);
                });
        },
        function (callback) {
            scraperjs.StaticScraper
                .create('http://www.meituan.com/dianying/zuixindianying/coming')
                .scrape(function ($) {
                    var movies = [];
                    $("#content").find(".movie-cell")
                        .each(function (i) {
                            // 只要前20个
                            if (i < 20) {
                                var $cover = $(this).find('.movie-cell__cover');
                                movies.push({
                                    name: $cover.attr("title"),
                                    meituanId: /dianying\/(\d+)$/.exec($cover.attr("href"))[1]
                                });
                            }
                        });
                    return movies;
                })
                .then(function (movies) {
                    callback(null, movies);
                });
        }
    ], function (err, results) {
        callback({
            isPlaying: results[0],
            willPlay: results[1]
        });
    });
};