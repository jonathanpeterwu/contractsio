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
  if (!req.session.id) return next('User is not logged in');
  if (!req.user._id)  return next('User is not logged in');

  async.parallel([
    function(callback){
      User.findOne({email: req.body.email}, function(err, user) {
        if (!user) user = 'New user';
        callback(null, user);
      });
    },
    function(callback){
      User.findOne({email: req.user.email}, function(err, user) {
        if (!user) user = 'New user';
        callback(null, user);
      });
    }
  ],
  function(err, results){
    var receiverUser = results[0];
    var senderUser = results[1];

    async.parallel([
      function(callback){
        Wallet.findOne({"_owner": receiverUser._id}, function(err, receiverWallet) {
          if (err || !receiverWallet) return callback(err);
          callback(null, receiverWallet);
        });
      },
      function(callback){
        Wallet.findOne({ "_owner": senderUser._id}, function(err, senderWallet) {
          if (err || !senderWallet) return callback(err);
          if (!req.user.email) return callback('No user email');
          if (senderWallet.balance < req.body.value) return callback('Not enough money!!');
          callback(null, senderWallet);
        });
      }
    ],
    function(err, results){
      var receiverWallet = results[0];
      var senderWallet = results[1];

      console.log(receiverWallet, senderWallet)
      console.log(senderUser.email, receiverUser.email, req.body.value)
      var transaction = new Transaction({
        sender: senderUser._id,
        receiver: receiverUser._id,
        value: req.body.value,
        status: 'initiated',
        rules: {
          multiSignature: req.body.multiSignature || false,
        //   fileUpload: req.body.fileUpload || false,
        //   packageConfirmation: req.body.packageConfirmation || false,
        //   thirdPartyAuthentication: req.body.thirdPartyAuthentication || false,
        //   escrowPeriod: req.body.escrowPeriod || false
        }
      });

      // Add reference to user wallet
      senderWallet.transactions.push(transaction._id);
      receiverWallet.transactions.push(transaction._id);
      console.log('sender', senderWallet.balance, receiverWallet.balance)
      //Update wallet value
      senderWallet.balance -= req.body.value;
      receiverWallet.balance = parseInt(receiverWallet.balance) + parseInt(req.body.value)
      console.log('receiver', senderWallet.balance, receiverWallet.balance)

      transaction.save(function(err) {
        if (err) return next(err);
        senderWallet.save(function(err) {
          if (err) return next(err);
          receiverWallet.save(function(err){
            console.log('got here')
            if (err) return next(err);
            res.redirect('/transaction');
          });
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
