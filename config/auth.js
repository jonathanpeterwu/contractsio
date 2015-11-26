
exports.generatePublicKey = function() {
  return '123';
};

exports.generatePrivateKey = function() {
  return '123';
};

exports.isLoggedIn = function(req) {
  if (req.user) return true;
  return false;
};
