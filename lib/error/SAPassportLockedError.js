var util = require('util');

/**
 * SAPassportLockedError
 *
 * @param  {Object} properties
 * @constructor {SAPassportLockedError}
 */
function SAPassportLockedError (lockout) {
  this.code = 'E_ACCOUNT_LOCKED';
  this.status = 403;
  this.message = `Your account has been locked due to too many failed login attempts.`;
  this.lockout = lockout;
}

util.inherits(SAPassportLockedError, Error);

SAPassportLockedError.prototype.toJSON =
  function () {
    var obj = {
      code: this.code,
      status: this.status,
      message: this.message,
      lockout: this.lockout,
    };

    return obj;
  };


module.exports = SAPassportLockedError;
