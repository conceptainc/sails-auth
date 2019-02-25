/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  /**
   * @override
   */
  create: function (req, res, next) {
    sails.services.passport.protocols.local.register(req.body, function (err, user) {

      if (err) {
        switch (err.name) {
          case 'AdapterError':
            switch (err.code) {
              case 'E_UNIQUE': return res.badRequest(err);
              default: return res.serverError(err);
            } return;
          case 'UsageError': return res.badRequest(err);
          default: return res.serverError(err);
        }
      }

      res.ok(user);
    });
  },

  update: function (req, res, next) {

    let user = req.body;
    user.id = req.params.id;

    sails.services.passport.protocols.local.update(req.body, function (err, user) {

      if (err) {
        switch (err.name) {
          case 'AdapterError':
            switch (err.code) {
              case 'E_UNIQUE':
                return res.badRequest(err);
              default:
                return res.serverError(err);
            } return;
          case 'UsageError':
            return res.badRequest(err);
          default:
            return res.serverError(err);
        }
      }

      res.ok(user);
    });
  },

  me: function (req, res) {
    res.ok(req.user);
  }
};

