var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var speakeasy = require('speakeasy');
var User = require('../models/User');
var Wallet = require('../models/Wallet');
var secrets = require('../config/secrets');
var authy = require('authy')(secrets.authyKey);

/**
 * GET /login
 */
exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/');
  return res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 */
exports.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.assert('pin', 'Pin cannot be blank').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    req.flash({'errors': { msg: errors} });
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) return next(info.message);
    if (user.pin.toString() !== req.body.pin)  {
      req.flash({'errors': { msg: 'invalid pin!!!'} });
      return res.redirect('/login');
    }
    return res.redirect('/authentication?email=' + user.email + '&number=' + user.number);
  })(req, res, next);
};

/**
 * GET /authentication
 */
exports.getAuthentication = function(req, res, next) {
  User.findOne({email: req.query.email}, function(err, user) {
    if (err) return next(err);
    if (user.authyId) {
      authy.request_sms(user.authyId, true, function (err, authyRes) {
        console.log(authyRes);
        res.render('account/authentication', {
          title: 'Authentication',
          authyId: user.authyId
        });
      });
    }
    if (!user.authyId) {
      authy.register_user(req.query.email, req.query.number, function (err, authyRes) {
        if (err) console.log(err);
        if (authyRes) {
          user.authyId = authyRes.user.id;
          user.save(function(err) {
            if (err) return next(err);
            authy.request_sms(user.authyId, true, function (err, authyRes) {
              console.log(authyRes);
              res.render('account/authentication', {
                title: 'Authentication',
                authyId: authyRes.user.id,
                userId: user._id
              });
            });
          });
        }
      });
    }
  });
};

/**
 * POST /authentication
 */
exports.postAuthentication = function(req, res, next) {
  authy.verify(req.body.authyId, req.body.code, function (err, authyRes) {
    if (err) { console.log(err) }
    if (!err) {
      if (!authyRes.success) {
        req.flash({'errors': { msg: authyRes.message} });
        res.render('account/authentication', {
          title: 'Authentication',
          authyId: authyRes.user.id
        });
      }
      if (authyRes.success) {
        User.findOne({id: req.body.userId}, function(err, user) {
          if (err) console.log(err);
          req.logIn(user, function(err) {
            req.flash('success', { msg: 'Success! You are logged in.' });
            res.redirect('/');
          });
        });
      }
    }
  });
};


/**
 * GET /logout
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 */
exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 */
exports.postSignup = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 8 characters long').len(8);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.assert('pin', 'Pin must be at least 4 characters long').len(4);
  req.assert('number', 'Phone number must be at least 10 characters long').len(10);

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }
  if (req.body.pin === '0000' || req.body.pin === '1234' ) {
    req.flash('errors', { msg: 'Please use a stronger pin' });
    return res.redirect('/signup');
  }

  var user = new User({
    email: req.body.email,
    password: req.body.password,
    pin: req.body.pin,
    number: req.body.number
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save(function(err) {
      if (err) return next(err);

      // TODO: create user wallet
      // create and store ethereum account || bitcoin account
      // display to user private keys or not;

      // Create wallet
      Wallet.create({
        _owner: user._id,
        balance: 1000,
        transactions: [],
        currency: 'USD',
        rules: {
          twoFactorAuthentication: false,
          emailAlert: true,
          textAlert: false
        }
      }, function(err, wallet) {
        if (err) return next(err);
        user.wallets.push(wallet._id);
        user.save(function(err) {
          if (err) return next(err);
          return res.redirect('/authentication');
        });
      });
    });
  });
};

/**
 * GET /account
 */
exports.getAccount = function(req, res) {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * POST /account/profile
 */
exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.email = req.body.email;
    user.profile.name = req.body.name;
    user.profile.gender = req.body.gender;
    user.profile.location = req.body.location;
    user.profile.website = req.body.website;
    user.profile.number = req.body.number;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 */
exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;
    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
s */
exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 */
exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 */
exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: secrets.mailgun.user,
          pass: secrets.mailgun.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'support@contracts.io',
        subject: 'Your Contracts password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};

/**
 * GET /forgot
 */
exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 */
exports.postForgot = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: secrets.mailgun.user,
          pass: secrets.mailgun.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'support@contractsio.com',
        subject: 'Reset your password on contracts',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};
