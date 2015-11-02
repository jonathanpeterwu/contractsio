var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Transaction = require('../models/Transaction');
var secrets = require('../config/secrets');

/**
 * GET /transaction
 * Transactions page.
 */
exports.getTransactions = function(req, res) {
  Transaction.find({}, function(err, transactions) {
    console.log(transactions)
    res.send({transactions: transactions});
    // res.render('transaction/all', {
      // title: 'Transactions',
      // transactions: transactions
    // });
  });
};

// /**
//  * GET /transaction/:id
//  * Transaction page.
//  */
// exports.getTransaction = function(req, res) {
//   Transaction.findOne({_id: req.body.id }, function(err, transaction) {
//     console.log(transaction)
//     res.send({ });
//     // res.render('transaction/single', {
//       // title: 'Transaction',
//       // transction: transction
//     // });
//   });
// };


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
  var transaction = new Transaction({
    sender: req.body.sender,
    receiver: req.body.receiver,
    value: req.body.value,
    currency: req.body.currency,
    rules: {
      multiSignature: req.body.multiSignature || false,
      fileUpload: req.body.fileUpload || false,
      packageConfirmation: req.body.packageConfirmation || false,
      thirdPartyAuthentication: req.body.thirdPartyAuthentication || false,
      escrowPeriod: req.body.escrowPeriod || false
    }
  });

  // TODO add error checking
  transaction.save(function(err) {
    if (err) return next(err);
    res.redirect('/transaction');
  });
};


/**
 * Update profile information.
 */
// exports.postUpdateProfile = function(req, res, next) {
//   User.findById(req.user.id, function(err, user) {
//     if (err) return next(err);
//     user.email = req.body.email || '';
//     user.profile.name = req.body.name || '';
//     user.profile.gender = req.body.gender || '';
//     user.profile.location = req.body.location || '';
//     user.profile.website = req.body.website || '';
//     user.profile.number = req.body.number || '';
//
//     user.save(function(err) {
//       if (err) return next(err);
//       req.flash('success', { msg: 'Profile information updated.' });
//       res.redirect('/account');
//     });
//   });
// };

// /**
//  * POST /account/delete
//  * Delete user account.
//  */
// exports.postDeleteAccount = function(req, res, next) {
//   User.remove({ _id: req.user.id }, function(err) {
//     if (err) return next(err);
//     req.logout();
//     req.flash('info', { msg: 'Your account has been deleted.' });
//     res.redirect('/');
//   });
// };
