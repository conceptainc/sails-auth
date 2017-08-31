var _ = require('lodash');
var crypto = require('crypto');

/** @module User */
module.exports = {
  attributes: {
    username: {
      type: 'string',
      unique: true,
      index: true,
      notNull: true
    },
    email: {
      type: 'email',
      unique: true,
      index: true
    },
    lastLogin: {
      type: 'datetime'
    },
    passports: {
      collection: 'Passport',
      via: 'user'
    },

    getGravatarUrl: function () {
      var md5 = crypto.createHash('md5');
      md5.update(this.email || '');
      return 'https://gravatar.com/avatar/'+ md5.digest('hex');
    },

    toJSON: function () {
      var user = this.toObject();
      delete user.password;
      user.gravatarUrl = this.getGravatarUrl();
      return user;
    }
  },

  beforeCreate: function (user, next) {
    if (_.isEmpty(user.username)) {
      user.username = user.email;
    }
    next();
  },

  /**
   * Register a new User with a passport
   */
  register: function (user) {
    return new Promise(function (resolve, reject) {
      sails.services.passport.protocols.local.createUser(user, function (error, created) {
        if (error) return reject(error);

        resolve(created);
      });
    });
  },

  /**
   * Update last login if attribute exists on model.
   *
   * @param user
   * @returns {Promise}
   */
  updateLastLogin: function (user) {
    return new Promise((resolve) => {
      // log last login?
      if ('lastLogin' in sails.models.user.attributes) {
        // try to update last login
        let updateLastLogin =
          sails.models.user.update({
            id: user.id
          },{
            lastLogin: sails.models.user.makeLastLoginDate()
          });
        // all done
        return resolve(updateLastLogin);
      } else {
        return resolve(true);
      }
    });
  },

  /**
   * Returns formatted date value to use for last login.
   *
   * Override this method to customize it for your API's model if necessary.
   *
   * @returns {Date}
   */
  makeLastLoginDate: function () {
    return new Date();
  }

};
