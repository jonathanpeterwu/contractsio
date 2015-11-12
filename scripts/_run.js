var Wallet = require('../models/Wallet');
var User = require('../models/Wallet');


User.findOne({email: 'jpwu03@yahoo.com'}, function(err, user){
  Wallet.findOne({"_owner": })
});
