var scraperjs = require('scraperjs');

var Cinema = require('../models/cinema');

exports.updateCinemas = function () {
    getCinemasFromTaobao(function (cinemas) {
        cinemas.forEach(function (cinema) {
            Cinema.findOneAndUpdate({
                name: cinema.name
            }, {
                $set: {
                    name: cinema.name,
                    address: cinema.address,
                    taobaoId: cinema.taobaoId
                }
            }, {
                new: true,
                upsert: true
            }, function (err, cinema) {
                console.log(cinema);
            });
        });
    });
};

var getCinemasFromTaobao = function (callback) {
    scraperjs.StaticScraper.create('https://dianying.taobao.com/ajaxCinemaList.htm?page=1&cinemaName=&pageSize=100')
        .scrape(function ($) {
            return $("li").map(function () {
                var href = $(this).find('.middle-hd a').attr('href');
                return {
                    name: $(this).find('.middle-hd').text().trim(),
                    address: $(this).find('.limit-address').text().trim(),
                    taobaoId: href.substring(href.indexOf('cinemaId') + 9, href.indexOf('&n_s'))
                };
            }).get();
        })
        .then(function (cinemas) {
            callback(cinemas);
        });
};