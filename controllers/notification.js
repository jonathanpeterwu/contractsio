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
  Notification.find({receiver: req.user._id, status: 'pending'}).populate('receiver sender transaction').exec(function(err, notifications) {
    if (err) return next(err);
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
  Notification.findOne({receiver: req.user._id, id: req.params.id}).populate('receiver sender transaction').exec(function(err, notification) {
    if (err) return next(err);
    res.render('notification/index', {
      title: 'Notifications',
      notifications: [notification]
    });
  });
};
