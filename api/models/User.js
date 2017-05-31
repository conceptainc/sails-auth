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
    passports: {
      collection: 'Passport',
      via: 'user'
    },
    createdAt: {
      type: 'number',
      autoCreatedAt: true
    },
    updatedAt: {
      type: 'number',
      autoUpdatedAt: true
    }

  },

  customToJSON: function () {
    return _.pick(this, [
      'id',
      'username',
      'email',
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
  }
};
