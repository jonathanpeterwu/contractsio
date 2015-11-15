var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var Wallet = require('../models/Wallet');
var secrets = require('../config/secrets');
var auth = require('../config/auth');

/**
 * GET /verification/:id
 * Verification page.
 */
exports.getVerifications = function(req, res, next) {
  Notification.findOne({_id: req.params.id }).populate('transactions sender receiver').exec(function(err, notification) {
    if (err) {
      req.flash({'errors': { msg: err} });
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
 * Confirm verification.
 */
exports.postVerification = function(req, res, next) {
  Notification.findOne({_id: req.params.id }).populate('transaction sender receiver').exec(function(err, notification) {
    req.assert('pin', 'Pin cannot be blank').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/login');
    }


    if (notification.receiver.pin == req.body.pin) {
      // Update notification status
      notification.status = 'read';
      notification.transaction.status = 'completed';

      Wallet.findOne({'_owner': notification.sender._id}, function(err, senderWallet) {
        if (err) req.flash('errors', err);
        Wallet.findOne({'_owner': notification.receiver._id}, function(err, receiverWallet) {
          if (err) req.flash('errors', err);

          // Update Values
          senderWallet.balance = parseInt(senderWallet.balance) - parseInt(notification.transaction.value);
          receiverWallet.balance = parseInt(receiverWallet.balance) + parseInt(notification.transaction.value);
          notification.transaction.status = 'completed';

          console.log(receiverWallet.balance, senderWallet.balance, notification.transaction.status);

          notification.save(function(err) {
            if (err) return next(err);
            notification.transaction.save(function(err) {
              if (err) return next(err);
              senderWallet.save(function(err){
                if (err) return next(err);
                receiverWallet.save(function(err){
                  if (err) return next(err);
                  return res.redirect('/notification/' + notification._id);
                })
              })
            })
          });
        });
      });
    } else {
      req.flash('errors', { msg: 'Invalid pin entry' });
      return res.redirect('/login');
    }

  });

};
