var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Transaction = require('../models/Transaction');
var Wallet = require('../models/Wallet');
var User = require('../models/User');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');

/**
 * GET /transaction
 * Transactions page.
 */
exports.getTransactions = function(req, res) {
  Transaction.find({'sender': req.user._id}, function(err, transactions) {
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
  User.find({}, function(err, users) {
    console.log(users)
    if (err) return next(err);
    res.render('transaction/new', {
      title: 'Transaction',
      users: users
    });
  });

};


/**
 * POST /transaction
 * Create a new transaction.
 */
exports.postTransaction = function(req, res, next) {
  if (!req.session.id) return next('User is not logged in');
  if (!req.user._id)  return next('User is not logged in');

  async.parallel([
    function(callback){
      User.findOne({email: req.body.email}).populate('wallets').exec(function(err, user) {
        if (!user) user = 'New user';
        callback(null, user);
      });
    },
    function(callback){
      User.findOne({email: req.user.email}).populate('wallets').exec(function(err, user) {
        if (!user) user = 'New user';
        callback(null, user);
      });
    }
  ],
  function(err, results){
    var receiver = results[0];
    var sender = results[1];
    var receiverWallet = receiver.wallets[0];
    var senderWallet = sender.wallets[0];
    var wait = false;

    if (senderWallet.balance < req.body.value) return done('Not enough money!!');

    var transaction = new Transaction({
      sender: sender._id,
      receiver: receiver._id,
      value: req.body.value,
      status: 'initiated',
      rules: {
        multiSignature: req.body.multiSignature || false,
        fileUpload: req.body.fileUpload || false,
        packageConfirmation: req.body.packageConfirmation || false,
        thirdPartyAuthentication: req.body.thirdPartyAuthentication || false,
        escrowPeriod: req.body.escrowPeriod || false
      }
    });

    // Add reference to user wallet
    senderWallet.transactions.push(transaction._id);
    receiverWallet.transactions.push(transaction._id);

    var rules = [];
    if (req.body.multiSignature) {
      wait = true;
      transaction.status = 'pending';
      rules.push('multiSignature');
    }
    if (req.body.fileUpload) {
      wait = true;
      transaction.status = 'pending';
      rules.push('fileUpload');
    }
    if (req.body.packageConfirmation) {
      wait = true;
      transaction.status = 'pending';
      rules.push('packageConfirmation');
    }
    if (req.body.thirdPartyAuthentication) {
      wait = true;
      transaction.status = 'pending';
      rules.push('thirdPartyAuthentication');
    }
    if (req.body.escrowPeriod) {
      wait = true;
      transaction.status = 'pending';
      rules.push('escrowPeriod');
    }

    // Complete Transaction
    if (!wait) {
      senderWallet.balance -= req.body.value;
      receiverWallet.balance = parseInt(receiverWallet.balance) + parseInt(req.body.value)
      transaction.status = 'completed';
    }

    transaction.save(function(err) {
      if (err) return next(err);
      senderWallet.save(function(err) {
        if (err) return next(err);
        receiverWallet.save(function(err){
          if (err) return next(err);

          // Create Notification
          if (transaction.status === 'pending') {
            Notification.create({
              sender: sender._id,
              receiver: receiver._id,
              transaction: transaction._id,
              rules: rules
            }, function(err, notification) {
              console.log(notification);
              if (err) return next(err);
              res.redirect('/transaction');
            });
          } else {
            res.redirect('/transaction');
          }
        });
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
