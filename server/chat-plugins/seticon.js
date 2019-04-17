/******************************
* Icons for Pokemon Showdown  *
* Credits: Lord Haji, panpawn.*
*******************************/
"use strict";

const FS = require("C:/Users/Administrator/Desktop/Pokemon-Showdown-master/lib/fs.js");

let iconsData = FS("config/icons.json").readIfExistsSync();
let icons = {};

if (iconsData) {
	icons = JSON.parse(iconsData);
}

function updateIcons() {
	FS("config/icons.json").writeUpdate(() => (
		JSON.stringify(icons)
	));

	let newCss = "/* ICONS START */\n";

	for (let name in icons) {
		newCss += generateCSS(name, icons[name]);
	}
	newCss += "/* ICONS END */\n";

	let file = FS("config/custom.css").readIfExistsSync().split("\n");
	if (file.includes("/* ICONS START */")) file.splice(file.indexOf("/* ICONS START */"), (file.indexOf("/* ICONS END */") - file.indexOf("/* ICONS START */")) + 1);
	FS("config/custom.css").writeUpdate(() => (
		file.join("\n") + newCss
	));
	WL.reloadCSS();
}

function generateCSS(name, icon) {
	let css = "";
	name = toId(name);
	css = `[id$="-userlist-user-${name}"] {\nbackground: url("${icon}") no-repeat right !important;\n}\n`;
	return css;
}

exports.commands = {
	uli: "icon",
	userlisticon: "icon",
	customicon: "icon",
	icon: {
		set: function (target, room, user) {
			if (!this.can('icon')) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (target.length !== 2) return this.parse("/help icon");
			if (toId(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
			if (icons[toId(target[0])]) return this.errorReply("This user already has a custom userlist icon.  Do /icon delete [user] and then set their new icon.");
			this.sendReply(`|raw|You have given ${hashColors(target[0], true)} an icon.`);
			Monitor.log(`${target[0]} has received an icon from ${user.name}.`);
			this.privateModCommand(`|raw|(${target[0]} has received icon: <img src="${target[1]}" width="32" height="32"> from ${user.name}.)`);
			this.modlog("ICON", target[0], `Set icon to ${target[1]}`);
			if (Users(toId(target[0])) && Users(toId(target[0])).connected) Users(target[0]).popup(`|html|${hashColors(user.name, true)} has set your userlist icon to: <img src="${target[1]}" width="32" height="32"><br /><center>Refresh, If you don't see it.</center>`);
			icons[toId(target[0])] = target[1];
			updateIcons();
		},

		remove: "delete",
		delete: function (target, room, user) {
			if (!this.can('icon')) return false;
			target = toId(target);
			if (!icons[toId(target)]) return this.errorReply(`/icon - ${target} does not have an icon.`);
			delete icons[toId(target)];
			updateIcons();
			this.sendReply(`You removed ${target}'s icon.`);
			Monitor.log(`${user.name} removed ${target}'s icon.`);
			this.privateModCommand(`(${target}'s icon was removed by ${user.name}.)`);
			this.modlog("ICON", target, `Removed icon`);
			if (Users(toId(target)) && Users(toId(target)).connected) Users(target).popup(`|html|${hashColors(user.name, true)} has removed your userlist icon.`);
		},

		"": "help",
		help: function (target, room, user) {
			this.parse("/iconhelp");
		},
	},

	iconhelp: [
		"Commands Include:",
		"/icon set [user], [image url] - Gives [user] an icon of [image url]",
		"/icon delete [user] - Deletes a user's icon",
	],
};
