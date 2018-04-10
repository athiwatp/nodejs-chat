function Users () {

    var Q  = require('q');

    /**
     * Login Functionality
     * @param username
     * @param password
     * @param callback
     */
    this.login = function (username,password,callback) {

        var sha1 = require('sha1');

        // Resolve
        var resolve = function (data) {

            if (data === null || Object.keys(data).length <= 0)
                return (typeof callback === "function") ? callback(false,'User does not exists.') : false ;

            return (typeof callback === "function") ? callback(true,data) : true ;
        };

        // Reject
        var reject = function (data) {
            if (typeof callback === "function")
                callback(false, data);
        };

        // Promise
        this.findUser({
            username    : username,
            password    : sha1(password)
        }).then(resolve,reject);
    };

    /**
     *
     * @param username
     * @param password
     * @param email
     * @param callback
     */
    this.register = function (username,password,email,callback) {

        // Resolve
        var resolve = function (data) {
            return (typeof callback === "function") ? callback(true,data) : true ;
        };

        // Reject
        var reject = function (data) {
            return (typeof callback === "function") ? callback(false,data) : false ;
        };

        // Promise
        this.createUser(
            username,
            password,
            email
        ).then(resolve,reject);
    };

    /**
     * Find User by its Data
     * @param searchData
     */
    this.findUser = function (searchData) {

        var Database    = new require(__dirname + "/database.js")();
        var deferred    = Q.defer();

        Database.connect(function (error, connection, database) {
            if (error)
                return deferred.reject(error);

            database
                .collection(Database.tables().users)
                .findOne(searchData, function (error,data) {

                    if (error !== null)
                        return deferred.reject(error);

                    deferred.resolve(data);

                });

            connection.close();
        });


        return deferred.promise;
    };

    /**
     * Creating user
     * @param username
     * @param password
     * @param email
     */
    this.createUser = function (username,password,email) {
        var Database        = new require(__dirname + "/database.js")();
        var deferred        = Q.defer();
        var sha1            = require('sha1');

        var registerData    = {
            username    :username,
            password    :sha1(password),
            email       :email
        };

        this.findUser({
            $or: [
                {username:username},
                {email   :email}
            ]
        }).then(function (data) {

            if (data !== null && Object.keys(data).length > 0)
                return deferred.reject("User already exist.");

            Database.connect(function (error,connection,database) {

                if (error !== null)
                    return deferred.reject(error);

                database
                    .collection(Database.tables().users)
                    .insertOne(registerData,function (error) {

                        return (error === null) ? deferred.resolve(registerData) : deferred.reject(error) ;

                    });

                connection.close();
            });

        },function (data) {
            deferred.reject(data);
        });

        return deferred.promise;
    };

    /**
     * Returnin function
     */
    return this;

}

module.exports = Users;