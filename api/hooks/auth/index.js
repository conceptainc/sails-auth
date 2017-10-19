
module.exports = function auth(sails) {

  // scoped config
  let config = {};

  //
  // Return the hook signature
  //
  return {

    defaults: {
      __configKey__: {
        bcrypt: {
          rounds: 8
        },
        passport: {
          jwt: {
            secret: ('PASSPORT_JWT_SECRET' in process.env) ? process.env.PASSPORT_JWT_SECRET : 'INSECURE',
            session: false
          }
        }
      }
    },

    configure: function configure() {
      // set config on scope
      config = sails.config[this.configKey];
    },

    initialize: function(next) {
      sails.services.passport.loadStrategies()
      return next()
    }

  };
};
