var secrets = require('../config/secrets');
var twilio = require('twilio');
var client = new twilio.RestClient(secrets.twilioDev.sid, secrets.twilioDev.token);
// var client = new twilio.RestClient(secrets.twilio.sid, secrets.twilio.token);

exports.sendText = function(number, message) {
  client.messages.create({
      body: message,
      to: number,
      from: '+15005550006'
      // from: "+18184854569" // live number
  }, function(err, message) {
    console.log(err, message, 'Text sent');
  });
};
