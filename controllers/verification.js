var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
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
  Notification.findOne({_id: req.params.id }).populate('transactions sender receiver').exec(function(err, notification) {
    req.assert('pin', 'Pin cannot be blank').notEmpty();

    console.log(notification)
    var errors = req.validationErrors();
    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/login');
    }

    if (notification.receiver.pin == req.body.pin) {
      notification.status = 'read';
      notification.transaction.status = 'completed';
      notification.sender.balance -= notification.transaction.value;
      notification.receiver.balance += parseInt(receiverWallet.balance) + parseInt(req.body.value);
      // save transaction, sender recevier
    } else {
      req.flash('errors', { msg: 'Invalid pin entry' });
      return res.redirect('/login');
    }

  });

};
