module.exports = {
	help: ()=> "A bit about the bot",
	usage: ()=> [" - Just what's on the tin"],
	execute: async (bot, msg, args) => {
		return {embed: {
			title: "About",
			description: "Hi! I'm a bot! Beep boop\nHere's a bit about me:",
			fields: [
				{name:"Creator", value: "[greysdawn](https://github.com/greysdawn) | (gs)#6969"},
				{name: "Repo", value: "[greys-bots/basebot](https://github.com/greys-bots/basebot)"},
				{name: "Stats", value: `Guilds: ${bot.guilds.size} | Users: ${bot.users.size}`},
				{name: "Support my creators!", value: "[Ko-Fi](https://ko-fi.com/greysdawn) | [Patreon](https://patreon.com/greysdawn)"}
			]
		}};
	},
	alias: ["abt"]
}