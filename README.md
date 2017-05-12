# @inspire-platform/sails-hook-auth

[![NPM version][npm-image]][npm-url]

[Passport](http://passportjs.org/)-based User Authentication system for Sails.js applications.

## 1. Install
```sh
$ npm install @inspire-platform/sails-hook-auth --save
```
This will install `@inspire-platform/sails-hook-auth` as a Sails Hook.

## 2. Configure

#### `config/passport.js`

By default, the `local` and `basic` strategies are enabled. See
[config/passport.js](https://github.com/langateam/sails-auth/blob/master/config/passport.js)
for examples of how to add and configure additional authentication strategies.

#### `config/auth.js`

```js
  bcrypt: {
    /**
     * Specifiy number of salt rounds to perform on password. Values >10 are
     * slow.
     */
    rounds: 8
  }
```

## 3. Authenticate!

Create users as you normally would (`POST` to `/user`). Authenticate using the endpoint of the provider you've chosen.

#### Local
Authenticate with the local strategy via a `POST` to `/auth/local` with params
`identifier` (email) and `password`). This will also create a session. See [passport.local](https://github.com/jaredhanson/passport-local) for more.

#### HTTP Basic and Digest
See [passport.http](https://github.com/jaredhanson/passport-http).

#### Additional Passport Strategies
- [passport.google](https://github.com/jaredhanson/passport-google-oauth)
- [passport.twitter](http://passportjs.org/guide/twitter/)
- [passport.github](https://github.com/jaredhanson/passport-github)
- [passport.facebook](http://passportjs.org/guide/facebook/)
- et al

#### `/user/me`
Returns `User` for this authenticated session.

## Permissions
For comprehensive user account control with role-based permissioning, object ownership, and row-level security, see [**sails-permissions**](https://github.com/langateam/sails-permissions), which uses this project as a dependency.

## License
MIT

## Upstream Project Maintained By
- [Travis Webb](https://github.com/tjwebb)
- [Ryan Quinn](https://github.com/ryanwilliamquinn)

[npm-image]: https://img.shields.io/npm/v/@inspire-platform/sails-hook-auth.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@inspire-platform/sails-hook-auth
