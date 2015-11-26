var Movie = require('./controllers/movie');
var Cinema = require('./controllers/cinema');
var Ticket = require('./controllers/ticket');

module.exports = function (app) {
    app.get('/', Movie.list);

    app.get('/cinemas', Cinema.list);

    app.get('/tickets', Ticket.getTickets);

    app.get('/cinemas/manage', Cinema.manage);
    app.get('/cinemas/edit', Cinema.edit);
    app.get('/cinemas/delete', Cinema.delete);
};