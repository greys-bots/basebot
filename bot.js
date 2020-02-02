const Discord 	= require("discord.js"); //our lib
const path 		= require("path"); //part of handling commands/etc
const fs 		= require("fs"); //also part of above
const dblite 	= require("dblite").withSQLite('3.8.6+'); //for our database

require("dotenv").config(); //handles your .env, mainly for windows

const bot = new Discord.Client({partials: ['MESSAGE', 'USER', 'CHANNEL', 'GUILD_MEMBER']});

bot.status = 0; //determines below
bot.prefix = process.env.PREFIX; //the bot's prefix

//handles the bot's activity stuff
const updateStatus = function(){
	switch(bot.status){
		case 0:
			bot.user.setActivity(bot.prefix + "!h | in "+bot.guilds.size+" guilds!");
			bot.status++;
			break;
		case 1:
			bot.user.setActivity(bot.prefix + "!h | serving "+bot.users.size+" users!");
			bot.status = 0;
			break;
	}

	setTimeout(()=> updateStatus(),600000)
}

//for command setup
const recursivelyReadDirectory = function(dir) {
	var results = [];
	var files = fs.readdirSync(dir, {withFileTypes: true});
	for(file of files) {
		if(file.isDirectory()) {
			results = results.concat(recursivelyReadDirectory(dir+"/"+file.name));
		} else {
			results.push(dir+"/"+file.name);
		}
	}

	return results;
}

//for handling commands
const registerCommand = function({command, module, name} = {}) {
	if(!command) return;
	command.module = module;
	command.name = name;
	module.commands.set(name, command);
	bot.commands.set(name, command);
	bot.aliases.set(name, name);
	if(command.alias) command.alias.forEach(a => bot.aliases.set(a, name));
	
	if(command.subcommands) {
		var subcommands = command.subcommands;
		command.subcommands = new Discord.Collection();
		Object.keys(subcommands).forEach(c => {
			var cmd = subcommands[c];
			cmd.name = `${command.name} ${c}`;
			cmd.parent = command;
			cmd.module = command.module;
			if(!command.sub_aliases) command.sub_aliases = new Discord.Collection();
			command.sub_aliases.set(c, c);
			if(cmd.alias) cmd.alias.forEach(a => command.sub_aliases.set(a, c));
			if(command.permissions && !cmd.permissions) cmd.permissions = command.permissions;
			if(command.guildOnly != undefined && cmd.guildOnly == undefined)
				cmd.guildOnly = command.guildOnly;
			command.subcommands.set(c, cmd);
		})
	}
	return command;
}

//actual setup
//TODO: make db stuff into classes?
async function setup() {
	var files;
	bot.db = require('./stores/__db.js')(bot); //our database and stores

	files = fs.readdirSync("./events");
	files.forEach(f => bot.on(f.slice(0,-3), (...args) => require("./events/"+f)(...args,bot)));

	bot.utils = {};
	files = fs.readdirSync("./utils");
	files.forEach(f => Object.assign(bot.utils, require("./utils/"+f)));

	files = recursivelyReadDirectory("./commands");

	bot.modules = new Discord.Collection();
	bot.mod_aliases = new Discord.Collection();
	bot.commands = new Discord.Collection();
	bot.aliases = new Discord.Collection();
	for(f of files) {
		var path_frags = f.replace("./commands/","").split(/(?:\\|\/)/);
		var mod = path_frags.length > 1 ? path_frags[path_frags.length - 2] : "Unsorted";
		var file = path_frags[path_frags.length - 1];
		if(!bot.modules.get(mod.toLowerCase())) {
			var mod_info = require(file == "__mod.js" ? f : f.replace(file, "__mod.js"));
			bot.modules.set(mod.toLowerCase(), {...mod_info, name: mod, commands: new Discord.Collection()})
			bot.mod_aliases.set(mod.toLowerCase(), mod.toLowerCase());
			if(mod_info.alias) mod_info.alias.forEach(a => bot.mod_aliases.set(a, mod.toLowerCase()));
		}
		if(file == "__mod.js") continue;

		mod = bot.modules.get(mod.toLowerCase());
		if(!mod) {
			console.log("Whoopsies");
			continue;
		}
		
		registerCommand({command: require(f), module: mod, name: file.slice(0, -3).toLowerCase()})
	}
}

bot.parseCommand = async function(bot, msg, args) {
	if(!args[0]) return undefined;
	
	var command = bot.commands.get(bot.aliases.get(args[0].toLowerCase()));
	if(!command) return {command, args};

	args.shift();
	var permcheck = true;

	if(args[0] && command.subcommands && command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()))) {
		command = command.subcommands.get(command.sub_aliases.get(args[0].toLowerCase()));
		args.shift();
	}

	if(command.permissions) permcheck = msg.member.permissions.has(cmd.permissions);

	return {command, args, permcheck};
}

setup();
bot.login(process.env.TOKEN);