const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let marksSchema = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'User', unique: true},
    hindi: Number,
    english: Number,
    maths: Number,
    science: Number,
    geography: Number
});
marksSchema.set('collection', 'Marks');

module.exports = mongoose.model('Marks', marksSchema, 'Marks');