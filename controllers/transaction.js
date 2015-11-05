var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Transaction = require('../models/Transaction');
var Wallet = require('../models/Wallet');
var User = require('../models/User');
var secrets = require('../config/secrets');

/**
 * GET /transaction
 * Transactions page.
 */
exports.getTransactions = function(req, res) {
  Transaction.find({}, function(err, transactions) {
    console.log(transactions)
    res.render('transaction/index', {
      title: 'Transactions',
      transactions: transactions
    });
  });
};

/**
 * GET /transaction/:id
 * Transaction page.
 */
exports.getTransaction = function(req, res) {
  Transaction.findOne({_id: req.body.id }, function(err, transaction) {
    console.log(transaction)
    res.render('transaction/index', {
      title: 'Transaction',
      transactions: [transaction]
    });
  });
};


/**
* GET /transaction/new
* Create a new transaction.
*/

exports.createTransaction = function(req, res, next) {
  res.render('transaction/new', {
    title: 'Transaction'
  });
};


/**
 * POST /transaction
 * Create a new transaction.
 */
exports.postTransaction = function(req, res, next) {
  // Attach wallet ID based on logged in user
  if (!req.session.id) return next('User is not logged in');
  if (!req.user._id)  return next('User is not logged in');


  var transaction = new Transaction({
    sender: req.user.email,
    receiver: req.body.receiver,
    value: req.body.value,
    currency: req.body.currency,
    status: 'initiated',
    rules: {
      multiSignature: req.body.multiSignature || false,
      fileUpload: req.body.fileUpload || false,
      packageConfirmation: req.body.packageConfirmation || false,
      thirdPartyAuthentication: req.body.thirdPartyAuthentication || false,
      escrowPeriod: req.body.escrowPeriod || false
    }
  });

  User.findOne({email: req.body.email}, function(err, user) {
    if (!user) return user = 'New user';
    if (user === 'New user') console.log('new user send email to them');
  });

  transaction.save(function(err) {
    if (err) return next(err);

    Wallet.findOne({ "_owner": req.user._id}, function(err, wallet) {
      if (err || !wallet) return callback(err);
      if (!req.user.email) return callback('No user email');
      // Add reference to user wallet
      wallet.transactions.push(transaction._id);

      wallet.save(function(err) {
        if (err) return next(err);
        res.redirect('/transaction');
      });
    });
  });
};


/**
 * Update profile information.
 */
exports.updateTransaction = function(req, res, next) {
  Transaction.findById(req.transaction.id, function(err, transaction) {
    // Add error checking to see if logged in / if authorized
    if (err) return next(err);

    transaction.receiver = req.body.receiver || transaction.receiver;
    transaction.value = req.body.value || transaction.vaue;
    transaction.currency = req.body.currency || transaction.currency;

    transaction.rules.multiSignature = req.body.multiSignature || transaction.receiver;
    transaction.rules.packageConfirmation = req.body.packageConfirmation;
    transaction.rules.fileUpload = req.body.fileUpload;
    transaction.rules.thirdPartyAuthentication = req.body.thirdPartyAuthentication;
    transaction.rules.escrowPeriod = req.body.escrowPeriod;

    transaction.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Transaction information updated.' });
      res.redirect('/transaction/' + transaction._id);
    });
  });
};

// /**
//  * POST /account/delete
//  * Delete user account.
//  */
exports.deleteTransaction = function(req, res, next) {
  // Do not allow for now;
  return req.flash('errors', { error: 'This is not alllowed'});

  // Transaction.remove({ _id: req.transaction.id }, function(err) {
  //   if (err) return next(err);
  //   req.logout();
  //   req.flash('info', { msg: 'Your account has been deleted.' });
  //   res.redirect('/');
  // });
};
