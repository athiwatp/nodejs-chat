function Json(req,res) {

    var Database = new require(__dirname + "/../classes/database.js")();

    this.req = req;
    this.res = res;

    this.isLogged = function () {
        return (typeof req.session.username !== "undefined");
    };

    /**
     * If user is not logged in, show "not allowed message"
     */
    this.notLoggedMessage = function () {
        if (!this.isLogged()) {
            this.res.setHeader('Content-Type', 'application/json');
            return this.res.send(JSON.stringify({ success:false,message:'Not allowed.' }));
        }
    };

    /**
     * Get User with Json
     */
    this.getUsers = function () {

        this.notLoggedMessage();

        var response = this.res;

        response.setHeader('Content-Type', 'application/json');

        Database.connect(function (error,connection,database) {

            if (error)
                response.send(JSON.stringify({ success:false, message:error }));

            database
                .collection(Database.tables().users)
                .find({})
                .toArray(function (error,users) {

                    if (error)
                        return response.send(JSON.stringify({ success:false, message:error }));

                    if (users === null)
                        return response.send(JSON.stringify({ success:false, message:'No users.' }));

                    return response.send(JSON.stringify({ success:true, data:users }));
                });

            connection.close();
        });
    };

    /**
     * Get Messages with Json
    **/
    this.getMessages = function () {
        this.notLoggedMessage();

        var response = this.res;

        response.setHeader('Content-Type', 'application/json');

        if (typeof req.body.to === "undefined" || typeof req.body.from === "undefined")
            return res.send(JSON.stringify({ success:false,message:'To or From is undefined.' }));

        var orderBy     = "mktime";
        var order       = (typeof req.body.firstLoad === "undefined" || req.body.firstLoad === true) ? 1 : -1 ;
        var to          = req.body.to;
        var from        = req.body.from;

        var Messages    = new require(__dirname + "/../classes/messages.js")();

        var resolve     = function (data) {
            if (data === null || Object.keys(data).length <= 0)
                return response.send(JSON.stringify({ success:false, message:'No messages.', data:{} }));

            return response.send(JSON.stringify({ success:true, message:'Messages listed.',data:data }));
        };

        var reject      = function (data) {
            return response.send(JSON.stringify({ success:false, message:data, data:{} }));
        };

        Messages.get(from, to, orderBy, order, null).then(resolve,reject);
    };

    /**
     * Return Function
    **/
    return this;
}

module.exports = Json;