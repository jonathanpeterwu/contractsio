var secrets = require('../config/secrets');
var twilio = require('twilio');
var client = new twilio.RestClient(secrets.twilioDev.sid, secrets.twilioDev.token);

exports.sendText = function(number, message) {
  client.messages.create({
      body: message,
      to: number,
      from: "+18184854569"
  }, function(err, message) {
    console.log(err, message, 'Text sent');
  });
};
