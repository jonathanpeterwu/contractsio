var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Wallet = require('../models/Wallet');
var secrets = require('../config/secrets');
var auth = require('../config/auth');

/**
 * GET /wallet
 * wallets page.
 */
exports.getWallets = function(req, res) {
  Wallet.find({}).populate('_owner transactions').exec(function(err, wallets) {
    console.log(wallets);
    res.render('wallet/index', {
      title: 'wallets',
      wallets: wallets
    });
  });
};

/**
 * GET /wallet/:id
 * wallet page.
 */
exports.getWallet = function(req, res) {
  Wallet.findOne({_id: req.body.id }).populate('transactions').exec(function(err, wallet) {
    console.log(wallet)
    res.render('wallet/index', {
      title: 'wallet',
      wallets: [wallet]
    });
  });
};


/**
* GET /wallet/new
* Create a new wallet.
*/
//
// exports.createWallet = function(req, res, next) {
//   res.render('wallet/new', {
//     title: 'wallet'
//   });
// };

/**
 * POST /wallet
 * Create a new wallet.
 */
exports.postWallet = function(req, res, next) {
  var publicKey = auth.generatePublicKey();
  var privateKey = auth.generatePrivateKey();

  var wallet = new Wallet({
    _owner: req.body.userId,
    balance: req.body.balance,
    transactions: [],
    pin: req.body.pin,
    publicKey: publicKey,
    privateKey: privateKey,
    currency: req.body.currency || 'USD',
    rules: {
      twoFactorAuthentication: req.body.twofactor || false,
      emailAlert: req.body.emailAlert || true,
      textAlert: req.body.textAlert || false
    }
  });

  // TODO add error checking
  wallet.save(function(err) {
    if (err) return next(err);
    res.redirect('/wallet');
  });
};


/**
 * Update profile information.
 */
exports.updateWallet = function(req, res, next) {
  Wallet.findById(req.wallet.id, function(err, wallet) {
    var wallet = {};
    // Add error checking to see if logged in / if authorized
    if (err) return next(err);

    wallet._owner = req.body.userId,
    wallet.balance = req.body.balance,
    wallet.transactions = [],
    wallet.pin = req.body.pin,
    wallet.publicKey = publicKey,
    wallet.privateKey = privateKey,
    wallet.currency = req.body.currency || 'USD',
    wallet.rules = {
      twoFactorAuthentication: req.body.twofactor || false,
      emailAlert: req.body.emailAlert || true,
      textAlert: req.body.textAlert || false
    }
    wallet.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'wallet information updated.' });
      res.redirect('/wallet/' + wallet._id);
    });
  });
};

// /**
//  * POST /account/delete
//  * Delete user account.
//  */
exports.deleteWallet = function(req, res, next) {
  // Do not allow for now;
  return req.flash('errors', { error: 'This is not alllowed'});

  // wallet.remove({ _id: req.wallet.id }, function(err) {
  //   if (err) return next(err);
  //   req.logout();
  //   req.flash('info', { msg: 'Your account has been deleted.' });
  //   res.redirect('/');
  // });
};
