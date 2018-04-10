function Templates() {

    this.get = function(key) {

        var templates =  {
            login   : __dirname + '/../views/login',
            register: __dirname + '/../views/login',
            chat    : __dirname + '/../views/chat'
        };

        return (typeof templates[key] === "undefined") ? null : templates[key] ;
    };


    return this;
}

module.exports = Templates;