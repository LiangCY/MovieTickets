var mongoose = require('mongoose');
var dbConnectionString = 'mongodb://lcy:lcy@localhost/tickets';
mongoose.connect(dbConnectionString);
var schedule = require('node-schedule');

var Ticket = require('./ticket');
var Movie = require('./movie');

//schedule.scheduleJob('0 0 2 * * *', Movie.updateMovies);

//schedule.scheduleJob('0 0 */6 * * *', Ticket.updateTickets);

Ticket.updateTickets();