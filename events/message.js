module.exports = async (msg, bot) => {
	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.match(prefix)) return;

	var {command, args, permcheck} = await bot.parseCommand(bot, msg, msg.content.replace(prefix, "").split(" "));
	if(!command) return msg.channel.send("Command not found");
	if(!permcheck) return msg.channel.send("You don't have permission to use that command");

	var result;
	try {
		result = await command.execute(bot, msg, args);
	} catch(e) {
		console.log(e);
		return msg.channel.send("ERR: "+e.message);
	}

	if(typeof result == "object" && result[0]) { //embeds
		var message = await msg.channel.send(result[0]);
		if(result[1]) {
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: result,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.menus[message.id]) return;
					try {
						message.reactions.removeAll();
					} catch(e) {
						console.log(e);
					}
					delete bot.menus[msg.author.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["\u2b05", "\u27a1", "\u23f9"].forEach(r => message.react(r));
		}
	} else msg.channel.send(result);
}