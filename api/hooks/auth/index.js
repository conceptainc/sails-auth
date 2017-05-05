
class Auth {

  constructor(sails) {}

  initialize(next) {
    sails.services.passport.loadStrategies()
    next()
  }
}

module.exports = function (sails) {

  let auth = new Auth(sails);

  return {

    initialize: function(next) {
      return auth.initialize(next)
    }

  };
};