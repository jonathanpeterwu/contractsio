var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var Wallet = require('../models/Wallet');
var secrets = require('../config/secrets');
var auth = require('../config/auth');
var client = require('twilio')(secrets.twilio.sid, secrets.twilio.token);

/**
 * GET /verification/:id
 */
exports.getVerifications = function(req, res, next) {
  Notification.findOne({_id: req.params.id }).populate('transactions sender receiver').exec(function(err, notification) {
    if (err || !notification) {
      req.flash('errors', {err: err});
      return res.redirect('/');
    }
    res.render('verification/signature', {
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
    if (errors || notifiation.receiver.pin.toString() !== req.body.pin) {
      req.flash('errors', {err: err});
      return res.redirect('/');
    }
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
        if (!err) {
          client.sendMessage({
              to: '+1' + notification.receiver.number, // Any number Twilio can deliver to
              from: '+14506667788', // A number you bought from Twilio and can use for outbound communication
              body: 'Verification is completed' // body of the SMS message
          }, function(err, responseData) {
              if (!err) {
                console.log(responseData);
              }
          });
        }
        return res.redirect('/notification/' + notification._id);
      });
    });
  });
};
