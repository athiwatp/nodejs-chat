function Login(req, res) {

    this.req        = req;
    this.res        = res;

    var Templates   = new require(__dirname + '/../classes/templates.js')();


    this.show = function () {
        if (typeof this.req.session.username !== "undefined")
            return this.res.redirect('/');

        res.render(Templates.get("login"));
    };

    this.login = function () {

        if (typeof req.session.username !== "undefined")
            return res.redirect('/');

        var errors = [];

        if (this.req.body.username === undefined || this.req.body.username.trim() === "")
            errors.push("Username is empty.");

        if (this.req.body.password === undefined || this.req.body.password.trim() === "")
            errors.push("Password is empty.");

        if (errors.length > 0)
            return res.render(Templates.get("login"),{
                errors:errors
            });


        var Users = new require(__dirname + "/../classes/users.js")();

        Users.login(this.req.body.username, this.req.body.password, function (success,data) {

            if (success === false) {

                return res.render(Templates.get("login"),{
                    errors:[data]
                });

            } else {

                req.session.username = data.username;
                return res.redirect('/');

            }

        });

    };


    return this;
}

module.exports = Login;