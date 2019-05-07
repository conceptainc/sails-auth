var _ = require('lodash');

/**
 * secondFactorAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to ensure second factor auth was completed
 * @docs        :: http://sailsjs.org/#!documentation/policies
 */
module.exports = function(req, res, next) {

  // sanity check for two factor config
  if (false === 'twoFactor' in sails.config.auth) {
    return next(new Error('Two factor configuration is missing!'));
  }

  // session exists, is authenticated, and second factor is valid?
  if (
    true === 'session' in req &&
    true === 'authenticated' in req.session &&
    true === req.session.authenticated &&
    true === 'secondFactor' in req.session &&
    true === _.includes(sails.config.auth.twoFactor.protocols, req.session.secondFactor)
  ) {
    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    return next();
  }

  res.status(403).json({ error: 'You are not permitted to perform this action without a second authentication factor.' });
};
