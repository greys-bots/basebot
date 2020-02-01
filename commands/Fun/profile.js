module.exports = {
	help: ()=> "View and customize your profile",
	usage: ()=> [" - Views your profile",
				 " [id | mention] - Views another user's profile",
				 " name [new name] - Sets your profile's name",
				 " description [new description] - Sets your profile's description",
				 " color [new color] - Sets your profile's color",
				 " disable - Disables level-up messages",
				 " enable - Enables level-up messages",
				 " delete - Deletes your profile"],
	execute: async (bot, msg, args) => {
		if(!args[0]) {
			var profile = await bot.profiles.get(msg.author.id);
			if(!profile) return "No profile found";

			return {embed: {
				title: profile.name,
				description: profile.description,
				author: {
					name: msg.author.tag,
					icon_url: msg.author.avatarURL({format: "png", dynamic: true})
				},
				color: parseInt(profile.color, 16) || parseInt("aaaaaa", 16),
				fields: [
					{name: "Level", value: profile.level, inline: true},
					{name: "Experience", value: profile.exp, inline: true}
				]
			}}
		}
	},
	alias: ["prof"],
	subcommands: {}
}

module.exports.subcommands.name = {
	help: ()=> "Set your profile's name",
	usage: ()=> [" [new name] - Sets profile's name to the given value"],
	execute: async (bot, msg, args) => {
		var profile = await bot.profiles.resolve(msg.author.id);

		try {
			if(profile) await bot.profiles.update(msg.author.id, {name: args.join(" ")});
			else await bot.profiles.create(msg.author.id, {name: args.join(" ")});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Name set!";
	}
}

module.exports.subcommands.delete = {
	help: ()=> "Deletes your profile",
	usage: ()=> [" - Deletes your profile from the bot, including all levels/experience/etc"],
	execute: async (bot, msg, args) => {
		var message = await msg.channel.send("Are you sure you want to do this? You'll lose any data saved in your profile currently");
		["✅","❌"].forEach(r => message.react(r));

		var response = await message.awaitReactions((r, u) => u.id == msg.author.id, {time: 60000, max: 1});
		if(!response || !response.first()) return "ERR: Timed out. Action cancelled";
		response = response.first();
		if(response.emoji.name == "✅") {
			try {
				await bot.profiles.delete(msg.author.id);
				await message.reactions.removeAll();
			} catch(e) {
				console.log(e);
				return "ERR: "+e;
			}
			return "Profile deleted!";
		} else return "Action cancelled";
	}
}