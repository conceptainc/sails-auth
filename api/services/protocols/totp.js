/**
 * TOTP Authentication
 *
 * @param {Object}   req
 * @param {String}   token
 * @param {Function} next
 */
module.exports = function (req, token, next) {

  // sanity check for two factor config
  if (false === 'twoFactor' in sails.config.auth) {
    return next(new Error('Two factor configuration is missing!'));
  }

  // have user and session in request?
  if (false === 'user' in req || false === 'session' in req) {
    // two factor check is not possible if user does not have a session yet!
    return next();
  }

  // user is authenticated (by first factor)?
  if (false === 'authenticated' in req.session || true !== req.session.authenticated) {
    // user is not authenticated yet
    return next();
  }

  // run the verify callback
  return sails.config.auth.twoFactor.verify(req.user, token, (err, result) => {

    if (err) {
      // error during verification
      return next(err);
    } else if (result === true) {
      // success, set second factor on session
      req.session.secondFactor = 'totp';
      // second factor successful
      return next(null, req.user);
    } else {
      // second factor failed (revoke existing auth just in case)
      req.session.authenticated = false;
      req.session.secondFactor = null;
      // not authorized
      return next();
    }

  });

};
