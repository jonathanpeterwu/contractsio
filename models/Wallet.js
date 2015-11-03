var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var walletSchema = new mongoose.Schema({
  sender: { type: String, default: ''},
  receiver: { type: String, default: ''},
  value: { type: Number, default : 0},
  currency: { type: String, default: 'USD'},
  status: {type: String, enum: ['initiated', 'pending', 'completed'] },
  rules: {
    multiSignature: { type: Boolean, default: false},
    fileUpload: { type: Boolean, default: false},
    packageConfirmation: { type: Boolean, default: false},
    thirdPartyAuthentication: { type: Boolean, default: false},
    escrowPeriod: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('Wallet', walletSchema);
