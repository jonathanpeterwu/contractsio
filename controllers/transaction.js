var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Transaction = require('../models/Transaction');
var Wallet = require('../models/Wallet');
var User = require('../models/User');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');
var error = require('../config/error');

/**
 * GET /transaction
 */
exports.getTransactions = function(req, res) {
  if (!req.user) {
    return res.render('transaction/index', {
      title: 'Transactions',
      transactions: []
    });
  }

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
    if (err) return error.send(req, res, err, '/transaction');
    return res.render('transaction/index', {
      title: 'Transactions',
      transactions: results[0].concat(results[1]);
    });
  });
};

/**
 * GET /transaction/:id
 */
exports.getTransaction = function(req, res) {
  Transaction.findOne({_id: req.body.id }, function(err, transaction) {
    if (err) return error.send(req, res, err, '/');
    console.log(transaction)
    return res.render('transaction/index', {
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
    if (err) return error.send(req, res, err, '/');
    console.log(users);
    return res.render('transaction/new', {
      title: 'Transaction',
      users: users
    });
  });
};


/**
 * POST /transaction
 */
exports.postTransaction = function(req, res, next) {
  if (!req.session.id) return next('User is not logged in');
  if (!req.user._id)  return next('User is not logged in');

  async.parallel([
    function(callback){
      User.findOne({email: req.body.email}).populate('wallets').exec(function(err, requestUser) {
        if (!requestUser) requestUser = 'New requestUser';
        callback(null, requestUser);
      });
    },
    function(callback){
      User.findOne({email: req.user.email}).populate('wallets').exec(function(err, currentUser) {
        if (!currentUser) currentUser = 'New currentUser';
        callback(null, currentUser);
      });
    }
  ],
  function(err, results){
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
      currentWallet.balance -= req.body.value;
      requestWallet.balance = parseInt(requestWallet.balance) + parseInt(req.body.value);
      transaction.status = 'completed';
    }

    console.log(transaction, currentWallet, requestWallet)

    transaction.save(function(err) {
      if (err) return next(err);
      currentWallet.save(function(err) {
        if (err) return next(err);
        requestWallet.save(function(err){
          if (err) return next(err);

          // Create Notification
          if (transaction.status === 'pending') {
            Notification.create({
              sender: req.body.type === 'request' ?  requestUser._id : currentUser._id,
              receiver: req.body.type === 'request' ?  currentUser._id : requestUser._id,
              transaction: transaction._id,
              rules: rules
            }, function(err, notification) {
              if (err) return next(err);
              console.log(notification);
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

    transaction.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Transaction information updated.' });
      res.redirect('/transaction/' + transaction._id);
    });
  });
};
