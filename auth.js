var hash = require('./pass').hash;

exports.authenticate = function(username, password, usersList, callback) {
  usersList.findOne({ username: username }, function(error, user) {
    if (error) return callback(new Error('Cannot find user'));
    if (user) {
      hash(password, user.salt, function(error, hash) {
        if (error) return callback(error);
        console.log(hash, '\n', 'fasdfasdfasdfasdfasfasdf', '\n', user.hash.buffer.toString());
        if (hash.toString() == user.hash.buffer.toString()) return callback(null, user);
        callback(new Error('Invalid password'));
      });
    } else {
      return callback(new Error('Cannot find user'));
    }
  });
};

exports.requiredAuthentication = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied';
    res.redirect('/login');
  }
};

exports.userExists = function(req, res, next) {
  var db = req.db;
  var usersList = db.get('usersList');
  usersList.findOne({ username: req.body.username }, function(error, user) {
    if (user) {
      req.session.error = 'User exists';
      res.redirect('/signup');
    } else {
      next();
    }
  });
};

exports.showHome = function(req, res) {
  if (req.session.user) {
    res.send('Welcome ' + req.session.user.username);
  } else {
    res.send('Login/Signup');
  }
};

exports.showSignUp = function(req, res) {
  if (req.session.user) {
    res.redirect('/');
  } else {
    res.render('signup');
  }
};

exports.signUp = function(req, res) {
  var db = req.db;
  var usersList = db.get('usersList');

  var username = req.body.username;
  var password = req.body.password;

  hash(password, function(error, salt, hash) {
    if (error) throw error;

    usersList.insert({
      username: username,
      salt: salt,
      hash: hash
    }, function(error, user) {
      if (error) throw error;

      exports.authenticate(username, password, usersList, function(error, user) {
        if (user) {
          req.session.user = user;
          req.session.success = 'Authenticated as ' + username;
          res.redirect('/');
        }
      });
    });
  });
};

exports.showLogin = function(req, res) {
  res.render('login');
};

exports.login = function(req, res) {
  var db = req.db;
  var usersList = db.get('usersList');

  exports.authenticate(req.body.username, req.body.password, usersList, function(error, user) {
    if (error) throw error;
    if (user) {
      req.session.regenerate(function() {
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.username;
        res.redirect('/');
      });
    } else {
      req.session.error = 'Authentication failed';
      res.redirect('/login');
    }
  });
};

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
};

exports.showProfile = function(req, res) {
  res.send('Profile page of ' + req.session.user.username);
};
