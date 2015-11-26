var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');
var auth = require('../config/auth');
var error = require('../config/error');

/**
 * GET /notification
 */
exports.getNotifications = function(req, res) {
  if (!auth.isLoggedIn(req)) {
    return res.render('notification/index', {
      title: 'Notifications',
      notifications: []
    });
  }

  Notification.find({receiver: req.user._id}).populate('receiver sender transaction').exec(function(err, receiverNotifications) {
    Notification.find({sender: req.user._id}).populate('receiver sender transaction').exec(function(err, senderNotifications) {
      if (err) return error.send(req, res, err, '/');
      console.log(receiverNotifications, senderNotifications);
      return res.render('notification/index', {
        title: 'Notifications',
        notifications: receiverNotifications.concat(senderNotifications)
      });
    });
  });
};

/**
 * GET /notification/:id
 */
exports.getNotification = function(req, res) {
   Notification.findOne({_id: req.params.id, receiver: req.user._id}).populate('receiver sender transaction').exec(function(err, notification) {

    if (err || !notification) return error.send(req, res, err, '/');
    console.log(notification)

    return res.render('notification/index', {
      title: 'notification',
      notifications: [notification],
      needsSignature:  notification.rules.indexOf('multiSignature') !== -1
    });

  });
};
