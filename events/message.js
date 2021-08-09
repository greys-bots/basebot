module.exports = async (msg, bot) => {
	if(msg.author.bot) return;

	var lvlup;
	try {
		lvlup = await bot.stores.profiles.handleExperience(msg.author.id);
	} catch(e) {
		msg.channel.send(e);
	}
	if(lvlup.message) msg.channel.send(lvlup.message.replace("$USER", msg.author.username));
	
	var prefix = new RegExp("^"+bot.prefix, "i");
	if(!msg.content.match(prefix)) return;

	var config;
	if(msg.guild) {
		try {
			config = await bot.stores.configs.get(msg.guild.id);
		} catch(e) {
			return "ERR: "+e;
		}
	}
	if(!config) config = {};
	
	let {command, args} = await bot.handlers.command.parse(msg.content.replace(prefix, ""));
	if(!command) {
		log.push('- Command not found -');
		console.log(log.join('\r\n'));
		bot.writeLog(log.join('\r\n'));
		return await msg.channel.send("Command not found!");
	}

	try {
		var result = await bot.handlers.command.handle({command, args, msg, config});
	} catch(e) {
		console.log(e.stack);
		log.push(`Error: ${e.stack}`);
		log.push(`--------------------`);
		msg.channel.send('There was an error!')
	}
	console.log(log.join('\r\n'));
	bot.writeLog(log.join('\r\n'));
	
	if(!result) return;
	if(Array.isArray(result)) { //embeds
		var message = await msg.channel.send({embeds: [result[0].embed]});
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
					delete bot.menus[message.id];
				}, 900000),
				execute: bot.utils.paginateEmbeds
			};
			["⬅️", "➡️", "⏹️"].forEach(r => message.react(r));
		}
	} else if(typeof result == "object") await msg.channel.send({embeds: [result.embed ?? result]});
	else await msg.channel.send(result);
}