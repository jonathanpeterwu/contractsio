var _ = require('underscore');
var async = require('async');
var Transaction = require('../models/Transaction');
var Wallet = require('../models/Wallet');
var User = require('../models/User');
var Signature = require('../models/User');
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

  User.findOne({email: req.user.email}).populate('wallets').exec(function(err, user) {
    if (err) return console.log(err);
    if (!user) console.log('No user found');
    User.findOne({email: req.body.email}).populate('wallets').exec(function(err, newUser) {
      if (err) return console.log(err);
      if (!newUser) console.log('No newUser found');

      var sender = user;
      var receiver = newUser;
      var senderWallet = sender.wallets[0];
      var receiverWallet = receiver.wallets[0];

      // Error check
      if (senderWallet.balance < req.body.value) console.log('Not enough value on wallet');

      Wallet.update({id: senderWallet._id}, { $inc : { 'balance': -parseInt(req.body.value)}}, function(err, wallet) {
        console.log(err, wallet)
      });
      Wallet.update({id: receiverWallet._id}, { $inc : { 'balance': parseInt(req.body.value)}}, function(err, wallet) {
        console.log(err, wallet)
      });

    });
  });


  //
  // //Query users and populate wallets
  // async.parallel = ([
  //   function(callback) {
  //     User.findOne({email: req.user.email}).populate('wallets').exec(function(err, user) {
  //       if (err) return callback(err);
  //       if (!user) callback('No user found');
  //       callback(null, user);
  //     });
  //   },
  //   function(callback) {
  //     User.findOne({email: req.body.email}).populate('wallets').exec(function(err, user) {
  //       if (err) return callback(err);
  //       if (!user) callback('No user found');
  //       callback(null, user);
  //     });
  //   }
  // ], function(err, results) {
  //   var sender = results[0];
  //   var receiver = results[1];
  //   var senderWallet = sender.wallets[0];
  //   var receiverWallet = receiver.wallets[0];
  //
  //   console.log(sender, receiver);
  //   // Error check
  //   if (senderWallet.balance < req.body.value) next('Not enough value on wallet');
  //
  //   // Create signaure object
  //   if (req.body.multiSignature) {
  //     console.log('require signature')
  //     var signature = new Signature({
  //       sender: sneder._id,
  //       receiver: receiver._id,
  //       status: 'pending'
  //     });
  //   }
  //
  //
  //   // Create Transaction
  //   var transaction = new Transaction({
  //     sender: req.user._id,
  //     receiver: r.email,
  //     value: req.body.value,
  //     currency: req.body.currency,
  //     status: 'initiated',
  //     rules: { multiSignature: req.body.multiSignature || false }
  //   });
  //
  //   console.log('new transaction created', transaction);
  //
  //
  //   senderWallet.balance -= parseInt(req.body.value);
  //   receiverWallet.balance += parseInt(req.body.value);
  //
  //
  //   console.log('new balances', senderWallet.balance, receiverWallet.balance);
  //
  //   // Save transaction and wallets
  //   async.parallel = ([
  //     function(callback) {
  //      transaction.save(function(err) {
  //        if (err) return calback(err);
  //        callback();
  //      });
  //     },
  //     function(callback) {
  //       senderWallet.save(function(err) {
  //         if (err) return callback(err);
  //         callback();
  //       });
  //     },
  //     function(callback) {
  //       receiverWallet.save(function(err) {
  //         if (err) return callback(err);
  //         callback();
  //       });
  //     },
  //     function(callback) {
  //       if (signature) {
  //         signature.save(function(err) {
  //           if (err) return callback(err);
  //           return callback();
  //         });
  //       }
  //       callback();
  //     },
  //   ], function(err, results) {
  //
  //      if (err) return next(err);
  //      res.redirect('/transaction');
  //   });
  // });
};


/**
 * Update profile information.
 */
exports.updateTransaction = function(req, res, next) {
  Transaction.findById(req.transaction.id, function(err, transaction) {
    // Add error checking to see if logged in / if authorized
    if (err) return next(err);

    transaction.receiver = req.body.email || transaction.email;
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
