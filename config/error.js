exports.send = function(req, res, err, url) {
  req.flash({'errors': { msg: err} });
  return res.redirect('/');
};
