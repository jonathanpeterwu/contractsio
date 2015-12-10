var secrets = require('./secrets');
var Rollbar = require("rollbar").init(secrets.rollbar.id);

exports.track = function(url, err) {
  Rollbar.error("Something went wrong with " + url + " route." , err)
}
