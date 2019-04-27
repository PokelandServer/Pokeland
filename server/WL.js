'use strict';

let fs = require('fs');
let http = require('http');
let https = require('https');
const Autolinker = require('autolinker');

let regdateCache = {};

exports.WL = {
	nameColor: function (name, bold, userGroup) {
		let userGroupSymbol = Users.usergroups[toId(name)] ? '<b><font color=#948A88>' + Users.usergroups[toId(name)].substr(0, 1) + '</font></b>' : "";
		return (userGroup ? userGroupSymbol : "") + (bold ? "<b>" : "") + "<font color=" + WL.hashColor(name) + ">" + (Users(name) && Users(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name)) + "</font>" + (bold ? "</b>" : "");
	},
	// usage: WL.nameColor(user.name, true) for bold OR WL.nameColor(user.name, false) for non-bolded.
	reloadCSS: function () {
		const cssPath = 'pokeland'; // This should be the server id if Config.serverid doesn't exist. Ex: 'serverid'
		let req = https.get('https://play.pokemonshowdown.com/customcss.php?server=' + (Config.serverid || cssPath), () => {});
		req.end();
	},

		//Daily Rewards System for Wavelength by Lord Haji
    giveDailyReward: function (user) {
        if (!user || !user.named) return false;
        let reward = 0, time = Date.now();
        for (let ip in user.ips) {
            let cur = Db("DailyBonus").get(ip);
            if (!cur) {
                cur = [1, Date.now()];
                Db("DailyBonus").set(ip, cur);
            }
            if (cur[0] < reward || !reward) reward = cur[0];
            if (cur[1] < time) time = cur[1];
        }
        if (Date.now() - time < 86400000) return;
        reward++;
        if (reward > 1 || Date.now() - time > 86400000) reward = 1;
        // Loop again to set the ips values
       
        let rewardsCDF = [0.5, 0.8, 1]; //50% 1 buck, 30% 2, 20% 3
        let j = 0;
        let r = Math.random();
        while (rewardsCDF[j] < r) {
            j++;
        }
        j += 1;
        reward = j;
        for (let ip in user.ips) {
            Db("DailyBonus").set(ip, [reward, Date.now()]);
        }
                 Db('money').set(user.userid, Db('money').get(user.userid, 0) + reward).get(user.userid);
        user.send('|popup||wide||html| <center><u><b><font size="3">Bucks quotidien </font></b></u><br>Vous avez reçu ' + reward + ' Bucks.<br>' + showDailyRewardAni(reward) + '<br>Cela est la récompense de la connexion du jour </center>');
    },
};


function showDailyRewardAni(streak) {
	let output = '';
	for (let i = 1; i <= streak; i++) {
		output += "<img src='https://iconfree.net/uploads/icon/2011/10/19/pokemon-play-coin-icon-9219-512x512.png' width='86' height='86'> ";
	}
	return output;
}
