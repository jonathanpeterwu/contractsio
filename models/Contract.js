var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contractSchema = new mongoose.Schema({
  rules: [{type: Schema.Type.ObjectId, ref: 'Rule'}],
  authenticator: {type: Schema.Types.ObjectId, ref: 'User' },
  receiver: {type: Schema.Types.ObjectId, ref: 'User' },
  status: {type: String, enum: ['initiated', 'pending', 'completed'] },
});

module.exports = mongoose.model('Contract', contractSchema);
