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
  if (!req.user) return res.redirect('/');

  Wallet.findOne({'_owner': req.user._id}).populate('transactions').exec(function(err, wallet) {
    if (err) return res.redirect('/');
    Wallet.find({}).populate('_owner transactions').exec(function(err, wallets) {
      if (err) return res.redirect('/');
      res.render('wallet/index', {
        title: 'wallets',
        wallet: wallet,
        wallets: wallets
      });
    });
  });
};

/**
 * GET /wallet/:id
 * wallet page.
 */
exports.getWallet = function(req, res) {
  Wallet.findOne({_id: req.params.id, '_owner': req.user._id }).populate('transactions').exec(function(err, wallet) {
    if (err) {
      req.flash({'errors': { msg: err} });
      return res.redirect('/');
    }
    res.render('wallet/index', {
      title: 'wallet',
      wallet: wallet,
      wallets: []
    });
  });
};


/**
 * POST /wallet
 * Create a new wallet.
 */
exports.postWallet = function(req, res, next) {
  var publicKey = auth.generatePublicKey();
  var privateKey = auth.generatePrivateKey();

  if (req.body.pin.length < 4) {
    req.flash({'errors': { msg: 'Pin lenght is too short'} });
    return res.redirect('/signup');
  }

  var wallet = new Wallet({
    _owner: req.user._id,
    pin: req.body.pin,
    publicKey: publicKey,
    privateKey: privateKey,
    currency: 'USD',
    rules: {
      twoFactorAuthentication: req.body.twofactor || false,
      emailAlert: req.body.emailAlert || false,
      textAlert: req.body.textAlert || false
    }
  });

  wallet.save(function(err) {
    if (err) return next(err);
    res.redirect('/wallet');
  });
};


/**
 * Update wallet details.
 */
exports.updateWallet = function(req, res, next) {
  if (!req.user) return next('No user logged in');

  Wallet.findById(req.wallet.id, function(err, wallet) {
    var wallet = {};
    if (err) return next(err);

    wallet._owner = req.body.userId;
    wallet.pin = req.body.pin;
    wallet.rules = {
      twoFactorAuthentication: req.body.twofactor,
      emailAlert: req.body.emailAlert,
      textAlert: req.body.textAlert
    };

    wallet.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Wallet information updated.' });
      res.redirect('/wallet/' + wallet._id);
    });
  });
};
