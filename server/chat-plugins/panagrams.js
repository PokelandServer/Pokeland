'use strict';

if (!WL.pGames) WL.pGames = {};
let pGames = WL.pGames;

function mix(word) {
	let arr = [];
	for (let k = 0; k < word.length; k++) {
		arr.push(word[k]);
	}
	let a, b, i = arr.length;
	while (i) {
		a = Math.floor(Math.random() * i);
		i--;
		b = arr[i];
		arr[i] = arr[a];
		arr[a] = b;
	}
	return arr.join(``);
}

class Panagram {
	constructor(room, sessions) {
		this.sessions = sessions;
		this.room = room;
		let dex = Dex.data.Pokedex;
		do {
			this.answer = dex[Object.keys(dex)[Math.floor(Math.random() * Object.keys(dex).length)]];
		} while (this.answer.num < 1 || this.answer.forme);
		do {
			this.mixed = mix(toId(this.answer.species));
		} while (this.mixed === toId(this.answer.species));

		this.room.add(
			`|html|<div class = "broadcast-blue"><center>A game of Panagram was started! Scrambled Pokemon: <strong>${this.mixed}</strong><br /> (Remaining Sessions: ${this.sessions})<br />` +
			`<small>Use /panagram g [pokemon] to guess!</small></center>`
		);
		this.guessed = {};
		this.hint = [
			`The scrambled Pokémon is <strong>${this.mixed}</strong>.`,
			`The Pokémon's name is <strong>${this.answer.species.length}</strong> characters long.`,
			`The first letter is <strong>${this.answer.species[0]}</strong>.`,
			`This Pokémon's type is <strong>${this.answer.types.join(`/`)}</strong>.`,
		].join(`<br />`);

		this.room.chat = function (user, message, connection) {
			if (Dex.data.Pokedex[toId(message)] && message.match(/^[a-z ]/i)) message = `/gp ${message}`;
			message = Chat.parse(message, this, user, connection);

			if (message && message !== true) {
				this.add(`|c|${user.getIdentity(this.id)}|${message}`);
			}
			this.update();
		};
	}
	guess(user, guess) {
		if (guess.species === this.answer.species) {
			this.room.add(`|html|${WL.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, which was the correct answer!`);
			/*Economy.writeMoney(user.userid, 1);*/
			this.end();
		} else {
			this.room.add(`|html|${WL.nameColor(user.name, true)} guessed <strong>${guess.species}</strong>, but was not the correct answer...`);
			this.guessed[toId(guess.species)] = user.userid;
		}
	}

	end(forced) {
		if (forced) this.room.add(`|html|The session of panagram has been forcibly skip. The answer was <strong>${this.answer.species}</strong>.`);
		if (this.sessions > 1 && !forced) {
			pGames[this.room.id] = new Panagram(this.room, this.sessions - 1);
			this.room.update();
		} else {
			delete pGames[this.room.id];
		}
	}
}

exports.commands = {
	panagrams: 'panagram',
	panagram: {
		off: 'disable',
		disable: function (target, room, user) {
			if (!this.can('gamemanagement', null, room)) return;
			if (room.pGamesDisabled) {
				return this.errorReply("Panagrams is already disabled in this room.");
			}
			room.pGamesDisabled = true;
			if (room.chatRoomData) {
				room.chatRoomData.pGamesDisabled = true;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Panagram has been disabled for this room.");
		},
		on: 'enable',
		enable: function (target, room, user) {
			if (!this.can('gamemanagement', null, room)) return;
			if (!room.pGamesDisabled) {
				return this.errorReply("Panagrams is already enabled in this room.");
			}
			delete room.pGamesDisabled;
			if (room.chatRoomData) {
				delete room.chatRoomData.pGamesDisabled;
				Rooms.global.writeChatRoomData();
			}
			return this.sendReply("Panagrams has been enabled for this room.");
		},
		help: function (target, room, user) {
			if (!this.runBroadcast()) return;
			this.sendReplyBox(
				'<center><strong>Panagram Help</strong><br />' +
				'<i style = "color:gray">By SilverTactic (Siiilver) and panpawn. Revised by Insist and Modified by Prince Sky.</i></center><br />' +
				'<code>/panagram start[session number]</code> - Starts a game of Panagram in the room for [session number] games (Panagrams are just anagrams with Pokemon). Alternate forms and CAP Pokemon won\'t be selected. Requires # or higher.<br />' +
				'<code>/panagram end</code> - Ends a game of panagram. Requires @ or higher.<br />' +
				'<code>/panagram skip</code> - Skip one panagram session. Requires @ or higher.<br />' +
				'<code>/panagram hint</code> - Gives a hint to the answer.<br />' +
				'<code>/panagram g</code> - Guesses the answer.<br />' +
				'<code>/panagram on/off</code> - Enable or disable panagram in a room. Requires #.<br />' +
				'Users can guess answers by simply typing them into the chat as well.'
			);
		},
		start: function (target, room, user) {
			if (room.pGamesDisabled) return this.errorReply("Panagrams is currently disabled for this room.");
			if (pGames[room.id]) return this.errorReply("There is currently a game of panagram going on in this room.");
			if (!this.can('ban', null, room)) return this.errorReply("You must be ranked # or higher to start a game of panagram in this room.");
			if (!target || isNaN(target)) return this.errorReply("Usage: /panagram start [number of sessions]");
			if (target < 5) return this.errorReply("The minimum number of sessions you can have at a time is 5.");
			if (~target.indexOf('.')) return this.errorReply("The number of sessions cannot be a decimal value.");
			this.privateModCommand(`${user.name} has started a game of panagrams set for ${target} sessions.`);
			pGames[room.id] = new Panagram(room, Number(target));
		},
		hint: function (target, room, user) {
			if (!pGames[room.id]) return this.errorReply("There is no game of panagram going on in this room.");
			if (!this.runBroadcast()) return;
			this.sendReplyBox(`Panagram Hint:<br />${pGames[room.id].hint}`);
		},
		guess: 'g',
		g: function (target, room, user) {
			if (!pGames[room.id]) return this.errorReply("There is no game of panagram going on in this room.");
			if (!this.canTalk()) return;
			if (!target) return this.sendReply(`|html|/panagram g <em>Pokémon Name</em> - Guesses a Pokémon in a game of Panagram.`);
			if (!Dex.data.Pokedex[toId(target)]) return this.sendReply(`"${target}"" is not a valid Pokémon.`);
			let guess = Dex.data.Pokedex[toId(target)];
			if (guess.num < 1 || guess.forme) return this.sendReply(`${guess.species} is either an alternate form or doesn't exist in the games. They cannot be guessed.`);
			if (toId(guess.species) in pGames[room.id].guessed) return this.sendReply('That Pokémon has already been guessed!');
			pGames[room.id].guess(user, guess);
		},
		end: function (target, room, user) {
			if (!pGames[room.id]) return this.errorReply("There is no game of panagram in this room.");
			if (!this.can('ban', null, room)) return this.errorReply("You must be ranked @ or higher to end a game of panagra in this room.");
			delete pGames[this.room.id];
			room.add('|html|The game of panagram has been ended by ' + WL.nameColor(user.name, true) + '.');
		},
		skip: function (target, room, user) {
			if (!pGames[room.id]) return this.errorReply("There is no game of panagram going in this room.");
			if (!this.can('ban', null, room)) return this.sendReply("You must be ranked @ or higher to skip a session of panagram in this room.");
			let ra = pGames[room.id].sessions > -1;
			if (ra) room.add(`|html|The current session of panagram has been skiped by ${WL.nameColor(user.name, true)}. The answer was <strong>${pGames[room.id].answer.species}</strong>.`);
			pGames[room.id].end(!ra);
		},
	},
};
