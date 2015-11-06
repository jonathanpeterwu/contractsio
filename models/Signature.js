var mongoose = require('mongoose');

var signatureSchema = new mongoose.Schema({
  sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  receiver: {type: Schema.Types.ObjectId, ref: 'User', required: true },
  thirdParty: {type: Schema.Types.ObjectId, ref: 'User' },
  status: {type: String, enum: ['pending', 'completed'] },
});

module.exports = mongoose.model('Signature', signatureSchema);
