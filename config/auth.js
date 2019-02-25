module.exports.auth = {
  bcrypt: {
    rounds: 8
  },

  /**
   * Password options
   */
  password: {

    /**
     * OWASP password strength config.
     *
     * @external https://www.npmjs.com/package/owasp-password-strength-test#configuring
     */
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 10,
      minPhraseLength: 20,
      minOptionalTestsToPass: 3,
    },

    /**
     * Password cannot contain any of these user attribute values.
     */
    userAttributeScan: [
      {attribute: 'username', description: 'Username'},
      {attribute: 'firstName', description: 'First Name'},
      {attribute: 'lastName', description: 'Last Name'},
    ],

  },

};
