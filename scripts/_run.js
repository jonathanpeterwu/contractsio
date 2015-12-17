var Immutable = require("immutable"),
    transit   = require("transit-js");
var Transaction = require('../models/Transaction');
var secrets = require('../config/secrets');
var twilio = require('twilio');
var client = new twilio.RestClient(secrets.twilioDev.sid, secrets.twilioDev.token);
var client = require('swagger-client');
var ACCESS_TOKEN = 'elq7kponDPk4iT5DUllTIHL5H5vhZCORKLQ6aB3jfkfSnqSNw6';
var swagger = new client({
  url: 'https://api-uat.dwolla.com/swagger.json',
  authorizations: {
    headerAuth: new client.ApiKeyAuthorization('Authorization', 'Bearer ' + ACCESS_TOKEN, 'header')
  },
  success: function() {
    swagger.customers.list();
  }
});

return;

client.messages.create({
    body: 'Test',
    to: "+18183379884",
    from: "+18184854569"
}, function(err, message) {
  console.log(err, message, 'Text sent');
});

return;

console.log(Transaction)
Transaction.find({sender: '565f28b264458be436bc54a4'}, function(err, transactions) {
  console.log(transactions, err)
});

return;

var reader = transit.reader("json", {
    arrayBuilder: {
        init: function(node) { return Immutable.Vector().asMutable(); },
        add: function(ret, val, node) { return ret.push(val); },
        finalize: function(ret, node) { return ret.asImmutable(); },
        fromArray: function(arr, node) { return Immutable.Vector.from(arr); }
    },
    mapBuilder: {
        init: function(node) { return Immutable.Map().asMutable(); },
        add: function(ret, key, val, node) { return ret.set(key, val);  },
        finalize: function(ret, node) { return ret.asImmutable(); }
    }
});

reader.read("[1,2,3]"); // Vector [ 1, 2, 3 ]
reader.read('{"foo":"bar"}'); // Map { foo: "bar" }

return;

var Wallet = require('../models/Wallet');
var User = require('../models/Wallet');


User.findOne({email: 'jpwu03@yahoo.com'}, function(err, user){
  Wallet.findOne({"_owner": 'test'})
});
