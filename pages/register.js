function Register(req,res) {

    this.req = req;
    this.res = res;

    var Templates = new require(__dirname + '/../classes/templates.js')();

    this.show = function () {
        if (typeof this.req.session.username !== "undefined")
            return this.res.redirect('/');

        res.render(Templates.get("register"));
    };

    this.register = function () {
        if (typeof req.session.username !== "undefined")
            return res.redirect('/');

        var errors = [];

        if (this.req.body.username === undefined || this.req.body.username.trim() === "")
            errors.push("Username is empty.");

        if (this.req.body.password === undefined || this.req.body.password.trim() === "")
            errors.push("Password is empty.");

        if (this.req.body.email === undefined || this.req.body.email.trim() === "")
            errors.push("E-Mail is empty.");

        if (this.req.body.username.match(/(\W)/))
            errors.push('Username contains some unwanted characters.');

        if (this.req.body.username.length < 3 || this.req.body.username.length > 20)
            errors.push('Username must have between 3 and 20 characters.');

        if (errors.length > 0)
            return res.render(Templates.get("register"),{
                errors:errors
            });


        var Users = new require(__dirname + "/../classes/users.js")();

        Users.register(
            this.req.body.username.trim(),
            this.req.body.password,
            this.req.body.email.trim(),
            function (success,data) {

                if (success === false) {

                    return res.render(Templates.get("register"),{
                        errors:[data]
                    });

                } else {

                    req.session.username = data.username;
                    return res.redirect('/');

                }

            }
        );

    };

    return this;
}

module.exports = Register;