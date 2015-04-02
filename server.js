var
	config = require('./config.json'),
	express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server);

server.listen(8080);

// routing
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.use('/furtive', express.static(__dirname + '/node_modules/furtive/'));
app.use('/javascripts', express.static(__dirname + '/javascripts/'));
app.use('/stylesheets', express.static(__dirname + '/stylesheets/'));

var rooms = {};
var users = {};

// Create a new user.
function newUser() {
	do {
		nickname =
			config.randomNames[Math.floor(Math.random() * config.randomNames.length)] +
			Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10);
	} while (typeof users[nickname] !== 'undefined');

	users[nickname] = {
		nickname: nickname,
		rooms: []
	};
	return users[nickname];
}

// Is nick valid?
function isValidNick(nickname) {
	if (typeof (nickname) !== 'string') return false;
	if (nickname.length < 3) return false;
	if (!/^[a-zA-Z0-9_\.\-]+$/.test(nickname)) return false;
	return true;
}

// Normalize room.
function normalizeRoom(roomname) {
	if (typeof (roomname) !== 'string') return false;
	roomname = roomname.replace(/\s+/g, '').toLowerCase();
	if (roomname.length < 3) return false;
	if (!/^[a-z0-9_\.\-]+$/.test(roomname)) return false;
	return roomname;
}

io.sockets.on('connection', function (socket) {

	// Create user at connection init.
	socket.user = newUser();
	socket.user.socket = socket;

	// Send nickname to client.
	socket.emit('nickname', socket.user.nickname);

	// Handle requests to change the nickname.
	socket.on('nickname', function (nickname) {
		nickname = nickname.trim();
		if (isValidNick(nickname) && typeof users[nickname] === 'undefined') {
			users[nickname] = socket.user;
			delete users[socket.user.nickname];
			users[nickname].nickname = nickname;
		} else {
			socket.emit('errormsg', 'Invalid nick.');
		}
		socket.emit('nickname', socket.user.nickname);
	});

	// Handle requests to join room.
	socket.on('join', function (room) {
		room = normalizeRoom(room);
		if (room === false) {
			socket.emit('errormsg', 'Invalid room.');
			return;
		}
		if (typeof rooms[room] === 'undefined') {
			rooms[room] = {
				users: []
			};
		}
		if (rooms[room].users.indexOf(socket.user.nickname) === -1) {
			rooms[room].users.push(socket.user.nickname);
		}
		if (socket.user.rooms.indexOf(room) === -1) {
			socket.user.rooms.push(room);
			socket.join(room);
			socket.emit('join', room);
			io.to(room).emit('message', room, 'SERVER', socket.user.nickname + ' joined room ' + room + '.');
			io.to(room).emit('attendance', room, rooms[room].users);
		}
	});

	// Handle requests to leave room.
	socket.on('leave', function (room) {
		var index = rooms[room].users.indexOf(socket.user.nickname);
		if (index !== -1) {
			delete rooms[room].users[index];
		}

		index = socket.user.rooms.indexOf(room);
		if (index !== -1) {
			delete socket.user.rooms[index];
			socket.leave(room);
			var leftmsg = socket.user.nickname + ' left room ' + room + '.';
			socket.emit('attendance', room, rooms[room].users);
			socket.emit('message', room, 'SERVER', leftmsg, function () {
				socket.leave(room);
				io.to(room).emit('message', room, 'SERVER', leftmsg);
				io.to(room).emit('attendance', room, rooms[room].users);
			});
		}
	});

	// Handle incoming messages.
	socket.on('message', function (room, msg) {
		if (socket.user.rooms.indexOf(room) === -1) {
			socket.emit('errormsg', 'You sent a message in a channel you have not joined.');
			return;
		}
		io.to(room).emit('message', room, socket.user.nickname, msg);
	});

});
