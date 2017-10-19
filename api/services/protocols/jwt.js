
exports.login = function (req, jwt_payload, next) {

    let query = {}
    query.id = jwt_payload.id;

    AuthService.findUserById(query, function(err, user) {
        if (err) {
            return next(err, false);
        }
        if (user) {
            req.user = user;
            return next(null, user);
        } else {
            return next(null, false);
        }
    });
};



