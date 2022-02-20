const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { pageBtns: PAGE } = require('../extras');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

class InteractionHandler {
	menus = new Collection();
	cooldowns = new Map();

	constructor(bot) {
		this.bot = bot;

		bot.on('interactionCreate', (interaction) => {
			this.handle(interaction);
		})

		bot.once('ready', async () => {
			await this.load(__dirname + '/../slashcommands');
			console.log('slash commands loaded!')
		})
	}

	async load(path) {
		var slashCommands = new Collection();
		var slashData = new Collection();
		var devOnly = new Collection();

		var files = this.bot.utils.recursivelyReadDirectory(path);

		for(var f of files) {
			var path_frags = f.replace(path, "").split(/(?:\\|\/)/);
			var mods = path_frags.slice(1, -1);
			var file = path_frags[path_frags.length - 1];
			if(file == '__mod.js') continue;
			delete require.cache[require.resolve(f)];
			var command = require(f);

			var {data} = command;
			if(command.options) {
				var d2 = command.options.map(({data: d}) => d);
				data.options = d2;
			}

			if(mods[0]) {
				var group = slashCommands.get(mods[0]);
				var g2 = slashData.get(mods[0]);
				if(!group) {
					var mod;
					delete require.cache[require.resolve(f.replace(file, "/__mod.js"))];
					mod = require(f.replace(file, "/__mod.js"));
					group = {
						...mod,
						options: [],
						type: 1
					};
					g2 = {
						...mod.data,
						options: [],
						type: 1
					};

					slashCommands.set(mod.data.name, group);
					if(mod.dev) devOnly.set(mod.data.name, g2);
					else slashData.set(mod.data.name, g2);
				}
				
				command.permissions = command.permissions ?? group.permissions;command.permissions = command.permissions ?? group.permissions;command.permissions = command.permissions ?? group.permissions;command.permissions = command.permissions ?? group.permissions;
				command.permissions = command.permissions ?? group.permissions;command.permissions = command.permissions ?? group.permissions;command.permissions = command.permissions ?? group.permissions;command.opPerms = command.opPerms ?? group.opPerms;
				command.guildOnly = command.guildOnly ?? group.guildOnly;
				if(command.options) command.options = command.options.map(o => {
					o.permissions = o.permissions ?? command.permissions
					return o;
				})

				group.options.push(command)
				if(mod.dev) {
					var dg = devOnly.get(mod.data.name);
					dg.options.push({
						...data,
						type: data.type ?? 1
					});
				} else {
					g2.options.push({
						...data,
						type: data.type ?? 1
					})
				}
			} else {
				slashCommands.set(command.data.name, command);
				slashData.set(command.data.name, data)
			}
		}

		this.bot.slashCommands = slashCommands;

		try {
			if(!this.bot.application?.owner) await this.bot.application?.fetch();

			var cmds = slashData.map(d => d);
			var dcmds = devOnly.map(d => d);
			if(process.env.COMMAND_GUILD == process.env.DEV_GUILD) {
				cmds = cmds.concat(dcmds);
				await rest.put(
					Routes.applicationGuildCommands(this.bot.application.id, process.env.COMMAND_GUILD),
					{ body: cmds },
				);
			} else {
				if(process.env.COMMAND_GUILD) {
					await rest.put(
						Routes.applicationGuildCommands(this.bot.application.id, process.env.COMMAND_GUILD),
						{ body: cmds },
					);
				} else {
					await rest.put(
						Routes.applicationCommands(this.bot.application.id),
						{ body: cmds },
					);
				}
	
				await rest.put(
					Routes.applicationGuildCommands(this.bot.application.id, process.env.DEV_GUILD),
					{ body: dcmds },
				);
			}
			return;
		} catch(e) {
			console.log(e);
			return Promise.reject(e);
		}
	}

	async handle(ctx) {
		if(ctx.isAutocomplete()) this.handleAuto(ctx);
		if(ctx.isCommand() || ctx.isContextMenu()) this.handleCommand(ctx);
		if(ctx.isButton()) this.handleButtons(ctx);
		if(ctx.isSelectMenu()) this.handleSelect(ctx);
	}

	parse(ctx) {
		var long = "";
		var cmd = this.bot.slashCommands.get(ctx.commandName);
		if(!cmd) return;
		long += cmd.name ?? cmd.data.name;

		if(ctx.options.getSubcommandGroup(false)) {
			cmd = cmd.options.find(o => o.data.name == ctx.options.getSubcommandGroup());
			if(!cmd) return;
			long += ` ${cmd.data.name}`;
			var opt = ctx.options.getSubcommand(false);
			if(opt) {
				cmd = cmd.options.find(o => o.data.name == opt);
				if(cmd) long += ` ${cmd.data.name}`;
			} else return;
		} else if(ctx.options.getSubcommand(false)) {
			cmd = cmd.options.find(o => o.data.name == ctx.options.getSubcommand());
			if(!cmd) return;
			long += ` ${cmd.data.name}`;
		}

		if(cmd) cmd.long = long;
		return cmd;
	}

	async handleCommand(ctx) {
		var cmd = this.parse(ctx);
		if(!cmd) return;

		var cfg;
		if(ctx.guild) cfg = await ctx.client.stores.configs.get(ctx.guild.id);

		var check = this.checkPerms(cmd, ctx, cfg);
		if(!check) return await ctx.reply({
			content: "You don't have permission to use this command!",
			ephemeral: true
		});
		if(cmd.guildOnly && !ctx.guildId) return await ctx.reply({
			content: "That command is guild only!",
			ephemeral: true
		})

		if(cmd.cooldown && this.cooldowns.get(`${ctx.user.id}-${cmd.name}`)) {
			var s = Math.ceil((this.cooldowns.get(`${ctx.user.id}-${cmd.name}`) - Date.now()) / 1000)
			return await ctx.reply({
				content: `Cool down time! Please wait **${s}s** before using this command`,
				ephemeral: true
			});
		}
		
		try {
			var res = await cmd.execute(ctx);
		} catch(e) {
			console.error(e);
			if(ctx.replied) return await ctx.followUp({content: "Error:\n" + e.message, ephemeral: true});
			else return await ctx.reply({content: "Error:\n" + e.message, ephemeral: true});
		}

		if(cmd.cooldown) {
			this.cooldowns.set(`${ctx.user.id}-${cmd.name}`, Date.now() + (cmd.cooldown * 1000));
			setTimeout(() => this.cooldowns.delete(`${ctx.user.id}-${cmd.name}`), cmd.cooldown * 1000);
		}

		if(!res) return;

		var type;
		if(ctx.deferred) type = 'editReply';
		else type = ctx.replied ? 'followUp' : 'reply'; // ew gross but it works
		switch(typeof res) {
			case 'string':
				return await ctx[type]({content: res, ephemeral: cmd.ephemeral ?? false})
			case 'object':
				if(Array.isArray(res)) {
					var reply = {
						embeds: [res[0]],
						ephemeral: cmd.ephemeral ?? false
					};
					if(!res[1]) return await ctx[type](reply);

					reply = {
						...reply,
						components: [
							{
								type: 1,
								components: PAGE
							}
						]
					}
					await ctx[type](reply);
					var message = await ctx.editReply(reply);

					var menu = {
						user: ctx.user.id,
						interaction: ctx,
						data: res,
						index: 0,
						timeout: setTimeout(() => {
							if(!this.menus.get(message.id)) return;
							this.menus.delete(message.id);
						}, 5 * 60000)
					}

					this.menus.set(message.id, menu);

					return;
				}

				return await ctx[type]({...res, ephemeral: (res.ephemeral ?? cmd.ephemeral) ?? false})
		}
	}

	async handleButtons(ctx) {
		var {message} = ctx;

		if(!this.menus.get(message.id)) return;

		var menu = this.menus.get(message.id);
		this.paginate(menu, ctx);
	}

	async handleAuto(ctx) {
		var cmd = this.parse(ctx);
		if(!cmd) return;

		var result = await cmd.auto(ctx);
		return await ctx.respond(result ?? []);
	}

	async handleSelect(ctx) {
		var {message} = ctx;

		if(!this.menus.get(message.id)) return;

		var menu = this.menus.get(message.id);
		menu.handle(ctx);
	}

	checkPerms(cmd, ctx, cfg) {
		if(cmd.ownerOnly && ctx.user.id !== process.env.OWNER)
			return false;
		if(cmd.guildOnly && !ctx.member) return false; // pre-emptive in case of dm slash cmds

		if(cfg?.disabled && cfg.disabled.includes(cmd.long)) {
			if(!ctx.member.permissions.has('MANAGE_GUILD')) return false;
		}

		if(!cmd.permissions?.length) return true; // no perms also means no opPerms
		if(ctx.member.permissions.has(cmd.permissions))
			return true;

		var found = this.findOpped(ctx.member ?? ctx.user, cfg?.opped)
		if(found && cmd.opPerms){			
			return (cmd.opPerms.filter(p => found.perms.includes(p))
					.length == cmd.opPerms.length);
		}

		return false;
	}

	findOpped(user, opped) {
		if(!opped || !user) return;

		var f = opped.users?.find(u => u.id == user.id);
		if(f) return f;

		if(user.roles) {
			f = opped.roles.find(r => user.roles.cache.has(r.id));
			if(f) return f;
		}

		return;
	}

	async paginate(menu, ctx) {
		var {data} = menu;
		var {customId: id} = ctx;

		switch(id) {
			case 'first':
				menu.index = 0;
				break;
			case 'prev':
				if(menu.index == 0) {
					menu.index = data.length - 1;
				} else menu.index = (menu.index - 1) % data.length;
				break;
			case 'next':
				menu.index = (menu.index + 1) % data.length;
				break;
			case 'last':
				menu.index = data.length -1;
				break;
		}

		await ctx.update({
			embeds: [data[menu.index]]
		})
	}
}

module.exports = (bot) => new InteractionHandler(bot);