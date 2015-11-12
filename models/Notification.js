var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new mongoose.Schema({
  sender: {type: Schema.Types.ObjectId, ref: 'User' },
  receiver: {type: Schema.Types.ObjectId, ref: 'User' },
  transaction: {type: Schema.Types.ObjectId, ref: 'Transaction'},
  status: {type: String, enum: ['unread', 'read'] },
  rules: [{type: String}],
  message: {type: String}
});

notificationSchema.statics.create = function(data, cb) {
  var notification = new this({
    sender: data.sender,
    receiver: data.receiver,
    transaction: data.transaction,
    status: 'unread',
    rules: data.rules
  });

  // TODO add error checking
  notification.save(function(err) {
    if (err) return console.log(err);
    cb(null, notification);
  });
}

module.exports = mongoose.model('Notification', notificationSchema);
