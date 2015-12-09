var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var TicketSchema = new Schema({
    movie: {type: ObjectId, ref: 'Movie'},
    cinema: {type: ObjectId, ref: 'Cinema'},
    time: Date,
    type: String,
    taobaoPrice: String,
    nuomiPrice: String,
    meituanPrice: String,
    weipiaoPrice: String,
    dianpingPrice:String
});

module.exports = mongoose.model('Ticket', TicketSchema);