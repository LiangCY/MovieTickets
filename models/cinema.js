var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CinemaSchema = new Schema({
    name: String,
    address: String,
    taobaoId: String,
    nuomiId: String,
    meituanId: String,
    weipiaoId:String
});

module.exports = mongoose.model('Cinema', CinemaSchema);