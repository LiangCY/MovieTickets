var express = require('express');
var mongoose = require('mongoose');
var moment = require('moment');
var dbConnectionString = 'mongodb://lcy:lcy@localhost/tickets';
mongoose.connect(dbConnectionString);

var port = process.env.PORT || 3030;
var app = express();

app.set('view engine', 'ejs');
app.set('views', './app/views');

app.locals.moment = moment;

require('./app/router')(app);

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
});

app.listen(port);