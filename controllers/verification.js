var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var Wallet = require('../models/Wallet');
var secrets = require('../config/secrets');
var auth = require('../config/auth');
var error = require('../config/error');

/**
 * GET /verification/:id
 */
exports.getVerifications = function(req, res, next) {
  Notification.findOne({_id: req.params.id }).populate('transactions sender receiver').exec(function(err, notification) {
    if (err) return error.send(req, res, err, '/');
    console.log(notification);
    return res.render('verification/signature', {
      title: 'Signature',
      notification: notification
    });
  });
};

/**
 * POST /verification
 */
exports.postVerification = function(req, res, next) {
  Notification.findOne({_id: req.params.id }).populate('transaction sender receiver').exec(function(err, notification) {
    req.assert('pin', 'Pin cannot be blank').notEmpty();

    var errors = req.validationErrors();
    if (errors) return error.send(req, res, errors, '/login');
    if (notification.receiver.pin !== req.body.ping) return error.send(req, res, 'Invalid pin', '/');

    async.parallel = ([
      function(callback) {
        Wallet.findOne({'_owner': notification.sender._id}, function(err, senderWallet) {
          return callback(err, senderWallet);
        });
      },
      function(callback) {
        Wallet.findOne({'_owner': notification.receiver._id}, function(err, receiverWallet) {
          return callback(err, receiverWallet);
        });
      }
    ], function(err, results) {
      var senderWallet = results[0];
      var receiverWallet = results[1];

      // TODO: do something with requests/sends
      if (notification.transaction.type === 'request') {

      }
      if (notification.transaction.type === 'send') {

      }

      // Update Values
      senderWallet.balance = parseInt(senderWallet.balance) - parseInt(notification.transaction.value);
      receiverWallet.balance = parseInt(receiverWallet.balance) + parseInt(notification.transaction.value);
      notification.status = 'read';
      notification.transaction.status = 'completed';

      async.parallel = ([
        function(callback) {
          notification.save(function(err) {
            return callback(err, null);
          });
        },
        function(callback) {
          notification.transaction.save(function(err) {
            return callback(err, null);
          });
        },
        function(callback) {
          senderWallet.save(function(err){
            return callback(err, null);
          });
        },
        function(callback) {
          receiverWallet.save(function(err){
            return callback(err, null);
          });
        }
      ], function(err, results) {
        if (err) return error.send(req, res, err, '/');
        return res.redirect('/notification/' + notification._id);
      });
    });
  });
};
