function Home(req, res) {

    this.req = req;
    this.res = res;

    var Templates = new require(__dirname + '/../classes/templates.js')();

    this.show = function() {

        if (req.session.username === undefined) {
            res.render(Templates.get("login"));
        } else {
            res.render(Templates.get("chat"),{
                username: req.session.username
            });
        }
    };

    return this;
}

module.exports = Home;