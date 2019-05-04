'use strict';

const fs = require('fs');
const http = require('http');

let listIcons = {};

function load() {
	fs.readFile('config/topuserlist.json', 'utf8', function (err, file) {
		if (err) return;
		listIcons = JSON.parse(file);
	});
}
setInterval(function () {
	load();
}, 500);

function updateIcons() {
	fs.writeFileSync('config/topuserlist.json', JSON.stringify(listIcons));

	let newCss = '/* LISTICONS START */\n';

	for (let name in listIcons) {
		newCss += generateCSS(name, listIcons[name]);
	}
	newCss += '/* LISTICONS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* LISTICONS START */')) file.splice(file.indexOf('/* LISTICONS START */'), (file.indexOf('/* LISTICONS END */') - file.indexOf('/* LISTICONS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	reloadCSS();
}
function reloadCSS() {
	let options = {
		host: 'play.pokemonshowdown.com',
		port: 8080,
		path: '/customcss.php?server=' + Config.serverName + '',
		method: 'GET',
	};
	http.get(options);
}

function generateCSS(name, icon) {
	let css = '';
	name = toId(name);
	css += '#' + name + '-userlist-users {';
	css += '\nbackground: url("' + icon + '") left no-repeat, url("' + icon + '") right no-repeat !important;';
	css += '\n}\n';
	return css;
}

exports.commands = {
	userlisticon: 'userlisticons',
	userlisticons: {
		set: function (target, room, user) {
			if (!this.can('root')) return false;
			target = target.split(',');
			for (let u = 0; u < target.length; u++) target[u] = target[u].trim();
			if (!target[1]) return this.parse('/help userlisticons');
			if (!Rooms(target[0])) return this.errorReply("Room doesnt exist!");
			this.sendReply("|raw|You have given " + target[0] + " a room icon. <img src='" + target[1] + "' height='32' width='32'>");
		    listIcons[toId(target[0])] = target[1];
			updateIcons();
		},
		delete: function (target, room, user) {
			if (!this.can('root')) return false;
			if (!target) return this.parse('/help userlisticons');
			if (!Rooms(toId(target))) return this.errorReply("Room doesnt exist!");
			if (!listIcons[toId(target)]) return this.errorReply('/userlisticon - ' + target + ' does not have a userlist roomicon.');
			delete listIcons[toId(target)];
			updateIcons();
			this.sendReply("You removed " + target + "'s userlist roomicon.");
			this.privateModCommand("(" + target + "'s userlist roomicon was removed by " + user.name + ".)");
			return;
		},
		reload: function (target, room, user) {
			if (!this.can('hotpatch')) return false;
			updateIcons();
			this.privateModCommand("(" + user.name + " has reloaded userlist roomicons.)");
		},
		'': function (target, room, user) {
			return this.parse("/help userlisticons");
		},
	},
	userlisticonshelp: [
		"Commands Include:",
		"/userlisticons set [room], [image]",
		"/userlisticons delete [user], delete - Deletes a userlist roomsicon",
		"/userlisticons reload - Reloads userlist roomicons.",
	],
};
