
let _ = require('lodash');

module.exports = {

  find: (req, res) => {
    return res.status(403).send();
  },

  findOne: (req, res) => {
    return PasswordResetToken
      .findOne({id: req.param('id')})
      .then((token) => {
        if (token) {
          if (false === tokenIsExpired(token)) {
            return res.status(200).send();
          } else {
            return res
              .status(403)
              .send({
                message: 'Token is expired.'
              });
          }
        } else {
          return res.status(400).send();
        }
      })
      .catch((err) => {
        sails.log.error(err);
        return res.status(500).send();
      });
  },

  create: (req, res) => {

    // email is required
    if (false === _.has(req.body, 'email')) {
      return res
        .status('400')
        .send({
          message: 'The email property is required.'
        });
    }

    let email = req.body.email;

    return User
      .findOne({email})
      .populate('passwordResetToken')
      .then((user) => {
        if (user) {
          return createToken(user)
            .then((token) => {
              return PasswordResetToken.NotifyTokenCreated(user, token);
            })
            .then(() => {
              return res.status(200).send();
            });
        } else {
          return res
            .status(403)
            .send({
              message: 'No user with matching email address was found.'
            })
        }
      })
      .catch((cause) => {
        sails.log.error(cause);
        return res.status(500).send();
      });
  },

  update: (req, res) => {

    // password is required
    if (false === _.has(req.body, 'password')) {
      return res
        .status('400')
        .send({
          message: 'The password property is required.'
        });
    }

    let tokenId = req.params.id;
    let password = req.body.password;

    return PasswordResetToken
      .findOne({id: tokenId})
      .populate('user')
      .then((token) => {

        if (token) {
          if (false === tokenIsExpired(token)) {
            return updatePassword(token, password)
              .then((user) => {
                return PasswordResetToken.NotifyPasswordChanged(user);
              })
              .then(() => {
                return res.status(200).send();
              });
          } else {
            return res
              .status(403)
              .send({
                message: 'Token is expired.'
              });
          }
        } else {
          return res
            .status(403)
            .send({
              message: 'Token not found.'
            });
        }
      })
      .catch((cause) => {
        sails.log.error(cause);
        return res.status(500).send();
      });

  },

  destroy: (req, res) => {
    return res.status(403).send();
  },

};

function createToken(user) {
  return new Promise((resolve, reject) => {
    if (user.passwordResetToken.length) {
      // remove old one
      return PasswordResetToken
        .destroy({id: user.passwordResetToken.map((prt) => prt.id)})
        .then(resolve, reject);
    } else {
      // nothing to do
      return resolve();
    }
  })
  .then(() => {
    // create new token
    return PasswordResetToken
      .create({user: user.id})
      .fetch();
  });
}

function updatePassword(token, password) {

  // destroy token first
  return PasswordResetToken
    .destroy({id: token.id})
    .then(() => {
      // update user password
      return new Promise((resolve, reject) => {
        return sails.services.passport.protocols.local
          .update({
            id: token.user.id,
            password: password
          },
          function (err, user) {
            return (err) ? reject(err) : resolve(user);
          });
      });
  });

}

function tokenIsExpired(token) {
  let now = new Date();
  let expires = new Date(token.expiresAt);

  return (now >= expires);
}