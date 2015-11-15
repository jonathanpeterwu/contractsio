var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');
var auth = require('../config/auth');

/**
 * GET /notification
 * notifications page.
 */
exports.getNotifications = function(req, res) {
  Notification.find({receiver: req.user.id}).populate('receiver sender transaction').exec(function(err, notifications) {
    if (err) {
      req.flash({'errors': { msg: err} });
      return res.redirect('/');
    }
    res.render('notification/index', {
      title: 'Notifications',
      notifications: notifications
    });
  });
};

/**
 * GET /notification/:id
 * notifications page.
 */
exports.getNotification = function(req, res) {
  Notification.findOne({_id: req.params.id}).populate('receiver sender transaction').exec(function(err, notification) {

    // TODO only allow querying of notifications by receiver
    if (err || !notification) {
      req.flash({'errors': { msg: err} });
      return res.redirect('/');
    }

    var needsSignature = notification.rules.indexOf('multiSignature') !== -1;

    res.render('notification/index', {
      title: 'notification',
      notifications: [notification],
      needsSignature: needsSignature
    });

  });
};
