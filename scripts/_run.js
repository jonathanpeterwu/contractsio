var Immutable = require("immutable"),
    transit   = require("transit-js");
var Transaction = require('../models/Transaction');
var secrets = require('../config/secrets');
var twilio = require('twilio');
var Coinbase = require('coinbase').Client;
var plaid = require('plaid');
var dwolla = require('swagger-client');

var coinbase = require('coinbase');
var coinbase   = new coinbase.Client({'apiKey': secrets.coinbase.key, 'apiSecret': secrets.coinbase.secret});

coinbase.getAccount('534db58cf480d8d81e000041', function(err, account) {
  console.log(err, account)
  console.log('bal: ' + account.balance.amount + ' currency: ' + account.balance.currency);
});

return;

var coinbase = require('coinbase');
var client   = new coinbase.Client({'apiKey': mykey, 'apiSecret': mysecret});

client.getAccounts({}, function(err, accounts) {
  accounts.forEach(function(acct) {
    console.log('my bal: ' + acct.balance.amount + ' for ' + acct.name);
  });
});

var client = new Coinbsae({'accessToken': accessToken, 'refreshToken': refreshToken});
var coinbase = new Coinbase({
  'accessToken': '',
  'refreshToken': '',
  'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
  'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
});



return;


// http://docs.seed.co/
// https://tartan.plaid.com/ (development)
// https://api.plaid.com/ (production)

var plaidClient = new plaid.Client(secrets.plaid.clientId, secrets.plaid.secret, plaid.environments.tartan);
// chase

// Add a Chase user using the list:true option
plaidClient.addConnectUser('chase', {
  username: 'plaid_test',
  password: 'plaid_good',
}, {
  list: true,
}, function(err, mfaRes, response) {
  // mfaRes.mfa is a list of send_methods
  plaidClient.stepConnectUser(mfaRes.access_token, null, {
    send_method: mfaRes.mfa[0],
  }, function(err, mfaRes, response) {
    // code was sent to the device we specified
    plaidClient.stepConnectUser(mfaRes.access_token, '1234', function(err, mfaRes, res) {
      // We now have accounts and transactions
      console.log('# transactions: ' + res.transactions.length);
      console.log('access token: ' + res.access_token);
    });
  });
});


return;


// b of a login
plaidClient.addAuthUser('bofa', {
  username: 'plaid_test',
  password: 'plaid_good',
}, function(err, mfaResponse, response) {
  if (err != null) {
    console.error(err);
  } else if (mfaResponse != null) {
    plaidClient.stepAuthUser(mfaResponse.access_token, 'tomato', {},
    function(err, mfaRes, response) {
      console.log(response.accounts);
    });
  } else {
    console.log(response.accounts);
  }
});

return;
var ACCESS_TOKEN = 'elq7kponDPk4iT5DUllTIHL5H5vhZCORKLQ6aB3jfkfSnqSNw6';
var swagger = new dwolla({
  url: 'https://api-uat.dwolla.com/swagger.json',
  authorizations: {
    headerAuth: new client.ApiKeyAuthorization('Authorization', 'Bearer ' + ACCESS_TOKEN, 'header')
  },
  success: function() {
    swagger.customers.list();
  }
});

return;

var twilio = new twilio.RestClient(secrets.twilioDev.sid, secrets.twilioDev.token);


twilio.messages.create({
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
