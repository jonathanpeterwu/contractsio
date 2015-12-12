var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');
var auth = require('../config/auth');
var messenger = require('../config/messenger');
var errors = require('../config/errors');

/**
 * GET /notification
 */
exports.getNotifications = function(req, res) {
  Notification.find({receiver: req.user._id}).populate('receiver sender transaction').exec(function(err, receiverNotifications) {
    Notification.find({sender: req.user._id}).populate('receiver sender transaction').exec(function(err, senderNotifications) {
      res.render('notification/index', {
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
   Notification
    .findOne({_id: req.params.id, receiver: req.user._id})
    .populate('receiver sender transaction')
    .exec(function(err, notification) {
      if (err || !notification) {
        req.flash('errors', { err: err });
        return res.redirect('/');
      }
      res.render('notification/index', {
        title: 'notification',
        notifications: [notification],
        needsSignature:  notification && notification.rules ? notification.rules.indexOf('multiSignature') !== -1 : false
      });
    });
};
