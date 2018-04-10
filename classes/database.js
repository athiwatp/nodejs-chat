function Database() {

    var database = {
        connection  : 'mongodb://localhost:27017',
        database    : 'chat',
        user        : null,
        password    : null
    };

    var tables = {
        users   : "Users",
        messages: "Messages"
    };

    this.info = function () {
        return database;
    };

    this.tables = function () {
        return tables;
    };

    this.connect = function (callback) {
        var mongo = require('mongodb').MongoClient;

        mongo.connect(database.connection,function (error, connection) {
            if (typeof callback === "function")
                callback(error,connection, connection.db(database.database));

            connection.close();
        });
    };

    this.close = function (connection) {
        return connection.close();
    };

    return this;
}

module.exports = Database;