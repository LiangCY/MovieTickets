var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var MovieSchema = new Schema({
    name: String,
    poster: String,
    status: Number,
    updateTime: Date,
    taobaoId: String,
    nuomiId: String,
    meituanId:String
});

module.exports = mongoose.model('Movie', MovieSchema);