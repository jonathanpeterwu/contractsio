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
 */
exports.getTransactions = function(req, res) {
  async.parallel([
      function(callback){
        Transaction.find({sender: req.user._id}, function(err, transactions) {
          if (err) return callback(err);
          return callback(null, transactions)
        });
      },
      function(callback){
        Transaction.find({receiver: req.user_id }, function(err, transactions) {
          if (err) return callback(err);
          return callback(null, transactions)
        });
     }
  ], function(err, results) {
    if (err) {
      req.flash('errors', {err: err});
      return res.redirect('/transcation');
    }
    res.render('transaction/index', {
      title: 'Transactions',
      transactions: results[0].concat(results[1])
    });
  });
};

/**
 * GET /transaction/:id
 */
exports.getTransaction = function(req, res) {
  Transaction.findOne({_id: req.body.id }, function(err, transaction) {
    if (err) {
      req.flash('errors', {err: err});
      return res.redirect('/');
    }
    res.render('transaction/index', {
      title: 'Transaction',
      transactions: [transaction]
    });
  });
};


/**
* GET /transaction/new
*/
exports.createTransaction = function(req, res, next) {
  User.find({}, function(err, users) {
    if (err) {
      req.flash('errors', {err: err});
      return res.redirect('/');
    }
    res.render('transaction/new', {
      title: 'Transaction',
      users: users
    });
  });
};


/**
 * POST /transaction
 */
exports.postTransaction = function(req, res, next) {
  async.parallel([
    function(callback){
      User.findOne({email: req.body.email}).populate('wallets').exec(function(err, requestUser) {
        callback(err, requestUser);
      });
    },
    function(callback){
      User.findOne({email: req.user.email}).populate('wallets').exec(function(err, currentUser) {
        callback(err, currentUser);
      });
    }
  ],
  function(err, results){
    if (err) {
      req.flash('errors', { err: err });
      return res.redirect('/');
    }
    var requestUser = results[0];
    var currentUser = results[1];
    var requestWallet = requestUser.wallets[0];
    var currentWallet = currentUser.wallets[0];
    var wait = false;
    var transaction = new Transaction({
      value: req.body.value,
      type: req.body.type,
      status: 'initiated',
      rules: {
        multiSignature: req.body.multiSignature || false,
        fileUpload: req.body.fileUpload || false,
        packageConfirmation: req.body.packageConfirmation || false,
        thirdPartyAuthentication: req.body.thirdPartyAuthentication || false,
        escrowPeriod: req.body.escrowPeriod || false
      }
    });

    // Send transaction completion
    messenger.sendText(requestUser.number, 'Transaction has been created');
    messenger.sendText(currentUser.number, 'Transaction has been created');

    // Add reference to user wallet
    currentWallet.transactions.push(transaction._id);
    requestWallet.transactions.push(transaction._id);

    //Apply rules
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

    if (req.body.type === 'request') {
      if (currentWallet.balance < req.body.value) return next('Not enough money!!');
      transaction.sender = requestUser._id;
      transaction.receiver = currentUser._id;
      rules.push('multiSignature');
      transaction.status = 'pending';
    }

    if (req.body.type === 'send') {
      if (requestWallet.balance < req.body.value) return next('Not enough money!!');
      transaction.sender = currentUser._id;
      transaction.receiver = requestUser._id;
      if (wait) {
        currentWallet.balance -= req.body.value;
        requestWallet.balance = parseInt(requestWallet.balance) + parseInt(req.body.value);
        transaction.status = 'completed';
      }
    }

    transaction.save(function(err) {
      if (err) next(err);
      currentWallet.save(function(err) {
        if (err) next(err);
        requestWallet.save(function(err){
          if (err) next(err);
          if (transaction.status === 'pending') {
            Notification.create({
              sender: req.body.type === 'request' ?  requestUser._id : currentUser._id,
              receiver: req.body.type === 'request' ?  currentUser._id : requestUser._id,
              transaction: transaction._id,
              rules: rules
            }, function(err, notification) {
              return res.redirect('/transaction');
            });
          } else {
            return res.redirect('/transaction');
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
    if (err) return next(err);
    if (!req.user) return error.send(req, res, 'No user', '/');

    transaction.receiver = req.body.receiver || transaction.receiver;
    transaction.value = req.body.value || transaction.vaue;
    transaction.currency = req.body.currency || transaction.currency;
    transaction.rules.multiSignature = req.body.multiSignature || transaction.receiver;
    transaction.rules.packageConfirmation = req.body.packageConfirmation;
    transaction.rules.fileUpload = req.body.fileUpload;
    transaction.rules.thirdPartyAuthentication = req.body.thirdPartyAuthentication;
    transaction.rules.escrowPeriod = req.body.escrowPeriod;

    // Send transaction completion
    messenger.sendText(req.user.number, 'Transaction updated.');

    transaction.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Transaction information updated.' });
      res.redirect('/transaction/' + transaction._id);
    });
  });
};
