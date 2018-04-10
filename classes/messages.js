function Messages() {

	var Q  = require('q');

	/**
     * Get Messages
     * @param from
     * @param to
     * @param orderBy
     * @param order
     * @param limit
     */
	this.get = function (from, to, orderBy, order, limit) {
		var Database 	= new require(__dirname + "/database.js")();
		var deferred    = Q.defer();

		var find = {
            $or : [
                {from:from, to:to},
                {from:to,   to:from}
            ]
        };

        var sort = {};
        	sort[orderBy] = order;

        if (to === "all")
            find = {to:to};

		Database.connect(function (error, connection, database) {

			if (error)
				return deferred.reject(error);

			database
				.collection(Database.tables().messages)
				.find(find)
				.sort(sort)
				.toArray(function (error,data) {

					if (error)
						return deferred.reject(error);

					return deferred.resolve(data);

				});
		});

		return deferred.promise;
	};

	/**
	 * @param data
	**/
	this.insert = function (data) {
		var Database 	= new require(__dirname + "/database.js")();
		var deferred    = Q.defer();

		if (typeof data !== "object" || Object.keys(data).length <= 0)
			return deferred.reject("Data is not object or is empty.");

		Database.connect(function (error, connection, database) {
			if (error)
				return deferred.reject(error);

			database.collection(Database.tables().messages).insertOne(data,function (error) {
				if (error)
					return deferred.reject(error);

				return deferred.resolve(data);
			});
		});
	};

	return this;
}

module.exports = Messages;