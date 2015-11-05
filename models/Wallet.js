var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var auth  = require('../config/auth');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var walletSchema = new mongoose.Schema({
  _owner: {type: Schema.Types.ObjectId, ref: 'User' },
  balance: {type: Number, default: 0 },
  transactions: [{ type: Schema.ObjectId, ref: 'Transaction' }],
  pin: { type: Number, minlength: 4 },
  publicKey:  { type: String },
  privateKey:  { type: String },
  currency: { type: String, default: 'USD'},
  rules: {
    twoFactorAuthentication: { type: Boolean, default: false},
    emailAlert: { type: Boolean, default: true},
    textAlert: { type: Boolean, default: false}
  }
});

walletSchema.statics.create = function(data, cb) {
  var publicKey = auth.generatePublicKey();
  var privateKey = auth.generatePrivateKey();

  console.log(data.balance);

  var wallet = new this({
    _owner: data._owner,
    balance: data.balance || 0,
    transactions: [],
    pin: data.pin,
    publicKey: publicKey,
    privateKey: privateKey,
    currency: data.currency || 'USD',
    rules: {
      twoFactorAuthentication: data.twofactor || false,
      emailAlert: data.emailAlert || true,
      textAlert: data.textAlert || false
    }
  });

  // TODO add error checking
  wallet.save(function(err) {
    if (err) return console.log(err);
    cb();
  });
};


module.exports = mongoose.model('Wallet', walletSchema);
