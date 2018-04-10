var express	= require('express');
var app 	= express();

var session = require('express-session');
var ejs     = require('ejs');

var server 	= require('http').createServer(app);
var io		= require('socket.io').listen(server);

var dateTime= require('node-datetime');

var bodyParser  = require('body-parser');
var Entities    = require('html-entities').XmlEntities;
var entities    = new Entities();

var users 			= {};
var connections		= [];

server.listen(process.env.PORT || 3000);

console.log('Server running...');

app.use('/public', express.static('public'));
app.use(session({
	secret				: 'i13t24zho3tbf',
    saveUninitialized	: true,
    resave				: false
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine','ejs');

/** App Get **/
/** App Get **/
app.get('/',function (req,res) {

    var Home = new require(__dirname+"/pages/home.js")(req,res);
        Home.show();

});

app.get('/login',function (req,res) {

    var Login = new require(__dirname + "/pages/login.js")(req,res);
        Login.show();

});

app.get('/register',function (req,res) {

    var Register = new require(__dirname + "/pages/register.js")(req,res);
        Register.show();

});


/** App Post **/
/** App Post **/
app.post('/login',function (req,res) {

    var Login = new require(__dirname + "/pages/login.js")(req,res);
        Login.login();

});

app.post('/register',function (req,res) {

    var Register = new require(__dirname + "/pages/register.js")(req,res);
        Register.register();

});


/** Json **/
/** Json **/
app.post('/getUsers',function (req,res) {

    var Json = new require(__dirname + "/pages/json.js")(req,res);
        Json.getUsers();

});

app.post('/getMessages',function (req,res) {
    
    var Json = new require(__dirname + "/pages/json.js")(req,res);
        Json.getMessages();

});



io.sockets.on('connection', function (socket) {
	console.log('Connected..');
	connections.push(socket);

	// User Disconnect
	socket.on("disconnect",function () {

		console.log('Disconnected..');
        connections.splice(connections.indexOf(socket),1);

        if (typeof socket.username === "undefined")
            return false;

        delete users[socket.username];

        io.sockets.emit('userDisconnected',{username:socket.username});

    });

	// Register User
    socket.on("registerUser",function (data) {

        if (typeof data.username === "undefined")
            return false;

        socket.username         = data.username;
        users[data.username]    = socket.id;

        io.sockets.emit('userConnected',{username:data.username});
    });

    // Send Message
    socket.on("sendMessage", function (data) {

        var date = dateTime.create();

        data.type       = (data.to === "all") ? "public" : "private" ;
        data.date       = date.format('Y-m-d H:I:S');
        data.time       = date.format("H:I:S");
        data.mktime     = date.getTime() / 1000;
        data.message    = entities.encode(data.message);

        var Messages = new require(__dirname + "/classes/messages.js")();
            Messages.insert(data);

        if (data.to === "all") {
            io.sockets.emit('newMessage',data);
        } else {

            data.myMessage = true;
            io.to(socket.id).emit('newMessage', data);

            data.myMessage = false;
            io.to(users[data.to]).emit('newMessage', data);

        }

    });

    // Get User List
    socket.on("getUserList",function () {
        io.to(socket.id).emit('userList',Object.keys(users));
    });

});