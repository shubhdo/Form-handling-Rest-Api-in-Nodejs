const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let address =new Schema({
    state: {type: String},
    city: {type: String},
    pin: {type: Number}
});

let studyInfo =new Schema({
   graduate:Boolean,
   postGraduate:Boolean,
   degree:[String]
});

let userSchema = new Schema({
    name: {type: String},
    password: {type: String},
    dob: {type: Date},
    contact: {type: Number},
    email: {type: String, unique: true},
    address: {type: [address]},
    studyInfo:{type:studyInfo},
    marksId: {type: Schema.Types.ObjectId, ref: 'Marks', unique: true},

});
userSchema.set('collection', 'User');

module.exports = mongoose.model('User', userSchema, 'User');