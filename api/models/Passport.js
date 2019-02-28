var _ = require('lodash');
var bcrypt = require('bcryptjs');
var OwaspPST = require('@inspire-platform/owasp-password-strength-test');
var SAError = require('../../lib/error/SAError.js');
var SAPassportLockedError = require('../../lib/error/SAPassportLockedError.js');

/**
 * Hash a passport password.
 *
 * @param {Object}   password
 * @param {Function} next
 */
function hashPassword (passport, next) {
  var config = sails.config.auth.bcrypt;
  var salt = config.salt || config.rounds;
  if (passport.password) {
    bcrypt.hash(passport.password, salt, function (err, hash) {
      if (err) {
        delete passport.password;
        sails.log.error(err);
        throw err;
      }
      passport.password = hash;
      next(null, passport);
    });
  }
  else {
    next(null, passport);
  }
}

/**
 * Passport Model
 *
 * The Passport model handles associating authenticators with users. An authen-
 * ticator can be either local (password) or third-party (provider). A single
 * user can have multiple passports, allowing them to connect and use several
 * third-party strategies in optional conjunction with a password.
 *
 * Since an application will only need to authenticate a user once per session,
 * it makes sense to encapsulate the data specific to the authentication process
 * in a model of its own. This allows us to keep the session itself as light-
 * weight as possible as the application only needs to serialize and deserialize
 * the user, but not the authentication data, to and from the session.
 */
var Passport = {

  primaryKey: 'id',

  attributes: {

    // Primary Key
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true
    },

    // Required field: Protocol
    //
    // Defines the protocol to use for the passport. When employing the local
    // strategy, the protocol will be set to 'local'. When using a third-party
    // strategy, the protocol will be set to the standard used by the third-
    // party service (e.g. 'oauth', 'oauth2', 'openid').
    protocol: {
      type: 'string',
      required: true,
      regex: /^[a-z0-9]+$/i
    },

    // Local field: Password
    //
    // When the local strategy is employed, a password will be used as the
    // means of authentication along with either a username or an email.
    password: { type: 'string', minLength: 8 },
    // accessToken is used to authenticate API requests. it is generated when a
    // passport (with protocol 'local') is created for a user.
    accessToken: { type: 'string' },
    // number of failed login attempts since last successful local login
    lockoutAttempts: {type: 'number', defaultsTo: 0},
    // timestamp that lockout started
    lockoutSince: {type: 'number', allowNull: true},

    // Provider fields: Provider, identifer and tokens
    //
    // "provider" is the name of the third-party auth service in all lowercase
    // (e.g. 'github', 'facebook') whereas "identifier" is a provider-specific
    // key, typically an ID. These two fields are used as the main means of
    // identifying a passport and tying it to a local user.
    //
    // The "tokens" field is a JSON object used in the case of the OAuth stan-
    // dards. When using OAuth 1.0, a `token` as well as a `tokenSecret` will
    // be issued by the provider. In the case of OAuth 2.0, an `accessToken`
    // and a `refreshToken` will be issued.
    provider   : {
      type: 'string',
      regex: /^[a-z0-9]+(-[a-z0-9]+)*$/i
    },
    identifier : { type: 'string' },
    tokens     : { type: 'json' },

    // Associations
    //
    // Associate every passport with one, and only one, user. This requires an
    // adapter compatible with associations.
    //
    // For more information on associations in Waterline, check out:
    // https://github.com/balderdashy/waterline
    user: { model: 'User', required: true },

  },

  /**
   * Validate password used by the local strategy.
   *
   * @param {string}   password The password to validate
   * @param {Function} next
   */
  validatePassword: function (passport, password, next) {

    // get password config
    var config = sails.config.auth.password;

    // lockout disabled?
    if (config.lockout.enable !== true) {
      // yes, just check the password
      return bcrypt.compare(password, passport.password, next);
    }

    this
      .isLocked(passport)
      .then(() => {
        // not locked out OR lock expired, need to check password
        return bcrypt.compare(password, passport.password);
      })
      .then((result) => {

        let data = {
          lockoutAttempts: 0,
          lockoutSince: null
        };

        // password is valid?
        if (result !== true) {
          // invalid password, :(
          // coming off a lockout, and still not getting it right?
          if (passport.lockoutSince) {
            // yes... reset fields to give more attempts
            data.lockoutAttempts = 1;
            data.lockoutSince = null;
          } else {
            // increment failed attempts.
            data.lockoutAttempts = passport.lockoutAttempts + 1
            // lock them out?
            if (config.lockout.attempts <= data.lockoutAttempts) {
              data.lockoutSince = new Date();
            }
          }
        }

        // update it
        var updatePassport = this
          .update({id: passport.id}, data)
          .fetch()
          .then((passports) => {
            return passports[0];
          });

        return Promise.all([
          result,
          updatePassport
        ]);

      })
      .then((results) => {

        var authenticated = results[0];
        var passport = results[1];

        // check if this attempt resulted in a lock
        return this
          .isLocked(passport)
          .then(() => {
            // not locked
            return next(null, authenticated);
          });
      })
      .catch(next);

  },

  isLocked: function (passport) {

    // get password config
    var config = sails.config.auth.password;

    return new Promise((resolve, reject) => {

      // is passport locked out?
      if (passport.lockoutSince) {

        try {
          var dateNow = new Date();
          var lockoutSince = new Date(passport.lockoutSince);
          var lockoutExpires = new Date(lockoutSince.getTime() + config.lockout.wait * 1000);
        } catch (e) {
          return reject(e);
        }

        // lockout still in effect?
        if (dateNow < lockoutExpires) {

          // still locked out
          var error = new SAPassportLockedError({
            since: lockoutSince,
            expires: lockoutExpires,
            attempts: passport.lockoutAttempts,
          });

          return reject(error);
        }

      }

      return resolve();

    });

  },

  /**
   * Check password strength.
   *
   * @param {string} password
   * @param {Object} user
   * @param {Function} next
   */
  checkPasswordStrength: function (password, user, next) {

    // get password config
    var config = sails.config.auth.password;
    var owasp = new OwaspPST(config.owasp);

    // any user properties to scan for?
    if (config.userAttributeScan.length) {
      config.userAttributeScan.forEach((scan) => {
        owasp.tests.required.push((password) => {
          if (true === _.has(user, scan.attribute)) {
            var re = new RegExp(user[scan.attribute], 'i');
            if (true === re.test(password)) {
              return `Password must not contain the value of the ${scan.description}.`;
            }
          }
        });
      });
    }

    var result = owasp.test(password);

    if (result.errors.length === 0) {
      return next();
    } else {

      let error = new Error();

      error.invalidAttributes = {
        password:
          result.errors.map((msg) => {
            return {
              rule: 'owasp',
              message: msg
            }
          })
      };

      return next(new SAError({message: 'Password is not strong enough', name: 'UsageError',originalError: error}));
    }

  },

  /**
   * Callback to be run before creating a Passport.
   *
   * @param {Object}   passport The soon-to-be-created Passport
   * @param {Function} next
   */
  beforeCreate: function (passport, next) {
    hashPassword(passport, next);
  },

  /**
   * Callback to be run before updating a Passport.
   *
   * @param {Object}   passport Values to be updated
   * @param {Function} next
   */
  beforeUpdate: function (passport, next) {

    // reset lockout fields if password is being changed
    if (passport.password) {
      passport.lockoutAttempts = 0;
      passport.lockoutSince = null;
    }

    hashPassword(passport, next);
  }
};

module.exports = Passport;
