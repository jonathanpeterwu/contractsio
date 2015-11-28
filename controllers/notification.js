var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var Notification = require('../models/Notification');
var secrets = require('../config/secrets');
var auth = require('../config/auth');

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

  async.parallel = ([
    function(callback) {
      Notification
        .find({receiver: req.user._id})
        .populate('receiver sender transaction')
        .exec(function(err, receiverNotifications) {
          return callback(err, receiverNotifications);
        });
    },
    function(callback) {
      Notification
        .find({sender: req.user._id})
        .populate('receiver sender transaction')
        .exec(function(err, senderNotifications) {
          return callback(err, senderNotifications);
        });
    }
  ], function(err, results) {
      if (err) {
        req.flash('errors', {err: err});
        return res.redirect('/');
      }
      res.render('notification/index', {
        title: 'Notifications',
        notifications: results[0].concat(results[1])
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
      if (err) {
        req.flash('errors', { err: err });
        return res.redirect('/');
      }
      res.render('notification/index', {
        title: 'notification',
        notifications: [notification],
        needsSignature:  notification.rules.indexOf('multiSignature') !== -1
      });
    });
};
