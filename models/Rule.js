var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ruleSchema = new mongoose.Schema({
  description: {type: String, required: true},
  event: { type: String, required: true }
});

module.exports = mongoose.model('Rule', ruleSchema);
