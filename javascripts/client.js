$(document).ready(function () {

	var roomDivs = {};

	var socket = io.connect('//' + document.location.host);
	socket.on('connect', function() {

		socket.once('nickname', function (nickname) {
			// First time nickname is set from server, we know we have a connection and everything is initialized.
			$('#wrapper').show();
		});

		// Handle nick name changes:

		socket.on('nickname', function (nickname) {
			$('#nickname').val(nickname);
		});
		$('#nickname').change(function () {
			socket.emit('nickname', $(this).val());
		});

		// Handle room joins:
		socket.on('join', function (room) {
			console.log(room);
			if (typeof roomDivs[room] === 'undefined') {
				roomDivs[room] = $('<div><h2></h2><ul class="attendance"></ul><a href="#" class="leaveroom">Leave room</a><ul class="msgs"></ul><input type="text" /></div>');
				$('#rooms').append(roomDivs[room]);
				$('h2', roomDivs[room]).append(document.createTextNode(room));
				$('a.leaveroom', roomDivs[room]).click(function () {
					socket.emit('leave', room);
				});
				var writing = null;
				$('input', roomDivs[room]).keypress(function (e) {

					if (e.which === 13) {
						var msg = $(this).val();
						$(this).val('');
						socket.emit('message', room, msg);
						socket.emit('writing', room, false);
						if (writing !== null) {
							clearTimeout(writing);
							writing = null;
						}
					} else {

						if (writing !== null) {
							clearTimeout(writing);
						} else {
							socket.emit('writing', room, true);
						}
						writing = setTimeout(function () {
							socket.emit('writing', room, false);
							writing = null;
						}, 2000);

					}
				});
			}
		});
		$('#joinroom').click(function () {
			socket.emit('join', $('#roomname').val());
			$('#roomname').val('');
		});

		// Handle messages:
		socket.on('message', function (room, nick, msg) {
			if (typeof roomDivs[room] === 'undefined') {
				console.error('Message in unknown room: ' + room + ': ' + msg);
				return;
			}
			var li = $('<li><span class="nick"></span> <span class="msg"></span></li>');
			$('span.nick', li).append(document.createTextNode(nick));
			$('span.msg', li).append(document.createTextNode(msg));
			$('ul.msgs', roomDivs[room]).append(li);
		});

		// Attendence list
		socket.on('attendance', function (room, list) {
			console.log(arguments);
			$('.attendance', roomDivs[room]).html('');
			list.sort();
			for (var i = 0; i < list.length; i++) {
				var li = $('<li><span class="nick"></span><span class="writing" style="display: none"> writing</span></li>');
				$('span.nick', li).append(document.createTextNode(list[i]));
				$('.attendance', roomDivs[room]).append(li);
			}
		});

		// Handle write notifications.
		socket.on('writing', function (room, nickname, writing) {
			$('.attendance li', roomDivs[room]).each(function () {
				if (nickname === $('.nick', this).html()) {
					if (writing === true) {
						$(this).closest('li').find('.writing').show();
					} else {
						$(this).closest('li').find('.writing').hide();
					}
				}
			});
		});

		// Output errors to console.
		socket.on('errormsg', function (msg) {
			console.error(msg);
		});


	});
});
