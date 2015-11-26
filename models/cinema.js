var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var CinemaSchema = new Schema({
    name: String,
    address: String,
    taobaoId: String,
    nuomiId: String
});

module.exports = mongoose.model('Cinema', CinemaSchema);