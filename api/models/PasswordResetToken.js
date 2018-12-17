/**
 * @module PasswordResetToken Model
 */
module.exports = {
  description: 'Password Reset Token',
  attributes: {
    id: {
      type: 'string',
      unique: true,
      autoIncrement: true
    },
    expiresAt: {
      type: 'string',
      defaultsTo: defaultExpiresAt()
    },
    // Associations
    user: {
      model: 'User',
      required: true
    }
  },

  NotifyTokenCreated: (user, token) => {
    return Promise.resolve();
  },

  NotifyPasswordChanged: (user) => {
    return Promise.resolve();
  }

};

function defaultExpiresAt() {
  let expires = new Date();
  expires.setTime(expires.getTime() + (1000 * 3 * 24 * 60 * 60));
  return expires.toISOString();
}
