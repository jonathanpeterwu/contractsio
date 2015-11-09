var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new mongoose.Schema({
  sender: {type: Schema.Types.ObjectId, ref: 'User' },
  receiver: {type: Schema.Types.ObjectId, ref: 'User' },
  value: { type: Number, default : 0},
  currency: { type: String, default: 'USD'},
  status: {type: String, enum: ['initiated', 'pending', 'completed'] },
  rules: {
    multiSignature: { type: Boolean, default: false},
    fileUpload: { type: Boolean, default: false},
    packageConfirmation: { type: Boolean, default: false},
    thirdPartyAuthentication: { type: Boolean, default: false},
    escrowPeriod: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
