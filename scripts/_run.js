var Immutable = require("immutable"),
    transit   = require("transit-js");
var Transaction = require('../models/Transaction');

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
