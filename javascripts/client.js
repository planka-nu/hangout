$(document).ready(function () {

	var roomDivs = {};
	var tabList = {};

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
				tabList[room] = $('<li data-target="'+room+'">'+room+'</li>');
				roomDivs[room] = $('<div id="'+room+'" class="my2 brdr--light-gray bg--white"><div class="header bg--off-white py1"><div class="grd"><div class="grd-row"><div class="grd-row-col-4-6"><h1></h1></div><div class="grd-row-col-2-6 txt--right py1-5"><a href="#" class="leaveroom btn btn--gray">Leave room</a></div></div></div></div><div class="attendance-list m1">Attendance: <ul class="attendance"></ul></div><div class="m1"><ul class="msgs"></ul></div><div class="footer bg--off-white py1"><div class="grd"><div class="grd-row"><div class="grd-row-col-5-6"><input type="text" class="msg" placeholder="Say something..." /></div><div class="grd-row-col-1-6"><input type="button" class="btn btn--blue msg-send" value="Say!" /></div></div></div></div></div>');
				$('#rooms').append(roomDivs[room]);
				$('#tabs ul').append(tabList[room]);
				$('h1', roomDivs[room]).append(document.createTextNode(room));
				$('a.leaveroom', roomDivs[room]).click(function () {
					socket.emit('leave', room);
				});

				// Activate latest createt room
				$('#rooms > div').hide();
				$('#rooms > div').last().show();
				$('#tabs ul li').removeClass('active');
				$('#tabs ul li').last().addClass('active');

				var writing = null;

				$('#tabs ul li').click(function (e) {
					var target = $(this).data('target');
					$('#tabs ul li').removeClass('active');
					$(this).addClass('active');
					$('#rooms > div').hide();
					$('#'+target).show();
				});
				$('input.msg-send', roomDivs[room]).click(function (e) {
					var msgTarget =  $(this).closest('.footer').find('input.msg');
					var msg = $(msgTarget).val();
					$(msgTarget).val('');
					socket.emit('message', room, msg);
					socket.emit('writing', room, false);
					if (writing !== null) {
						clearTimeout(writing);
						writing = null;
					}
					$(msgTarget, roomDivs[room]).focus();
				});
				$('input', roomDivs[room]).keypress(function (e) {

					if (e.which === 13) {
						$('input.msg-send').click();
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
