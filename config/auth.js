module.exports.auth = {
  bcrypt: {
    rounds: 8
  },
  passport: {
    jwt: {
      secret: ('PASSPORT_JWT_SECRET' in process.env) ? process.env.PASSPORT_JWT_SECRET : 'INSECURE',
      session: false
    }
  }
};
