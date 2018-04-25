var _ = require('lodash');
var crypto = require('crypto');

/** @module User */
module.exports = {

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      unique: true,
      autoIncrement: true
    },
    username: {
      type: 'string',
      required: true,
      unique: true,
      minLength: 3
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    active: {
      type: 'boolean',
      defaultsTo: true
    },
    lastLogin: {
      type: 'number'
    },
    passports: {
      collection: 'Passport',
      via: 'user'
    }

  },

  customToJSON: function () {
    return _.pick(this, [
      'id',
      'username',
      'email',
      'lastLogin',
      'createdAt',
      'updatedAt'
    ]);
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
   * @returns {number}
   */
  makeLastLoginDate: function () {
    let now = new Date();
    return now.getTime() / 1000;
  }

};
