module.exports = {
	help: ()=> "Disables a command/module or a command's subcommands",
	usage: ()=> [" - Lists disabled commands",
				 " [command/module] <subcommand> - Disables given command or its subcommand"],
	execute: async (bot, msg, args) => {
		var cfg;
		try {
			cfg = await bot.stores.configs.get(msg.guild.id);
		} catch(e) {
			return "ERR: "+e;
		}
		
		if(!args[0]) {
			console.log(cfg);
			if(!cfg || !cfg.disabled) return "Nothing is disabled in this server";
			
			return {embed: {
				title: "Disabled Commands",
				description: cfg.disabled.sort().join("\n")
			}}
		}

		if(["disable", "enable"].includes(args[0].toLowerCase())) return "You can't disable or enable this command.";
		var dis;
		if(!cfg) {
			try {
				cfg = await bot.stores.configs.create(msg.guild.id);
			} catch(e) {
				return "ERR: "+e;
			}
		}
		if(!cfg.disabled) dis = [];
		else dis = cfg.disabled;

		var cmd = args.join(" ").toLowerCase();
		if(bot.modules.get(bot.mod_aliases.get(cmd))) {
			var mod = bot.modules.get(bot.mod_aliases.get(cmd));
			dis = dis.concat(mod.commands.map(c => c.name).filter(x => !["enable", "disable"].includes(x) && !dis.includes(x)));
		} else {
			try {
				var {command} = await bot.parseCommand(bot, msg, args);
			} catch (e) {
				command = undefined;
			}
			if(!command) return "Command/module not found";

			if(dis.includes(command.name)) {
				return "That module is already disabled!";
			} else {
				dis.push(command.name)
			}
		}

		try {
			await bot.stores.configs.update(msg.guild.id, {disabled: dis});;
		} catch(e) {
			return "ERR: "+e;
		}

		return "Command/module disabled!";
	},
	guildOnly: true,
	module: "admin",
	alias: ["dis","disabled"],
	permissions: ["MANAGE_GUILD"]
}