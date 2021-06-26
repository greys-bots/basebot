const { Collection } = require('discord.js')

module.exports = class Command {
	#client;

	name; // best determined by file name/programmatically
	help = "Example help text";
	usage = [
		"Example usage text"
	];
	desc = "Example description/extra info text";
	
	group = false;
	cooldowns = new Map();
	timeout = 0;
	aliases = [];
	guildOnly = false;
	permissions = [];
	subcommands = new Collection();
	sub_aliases = new Map();

	constructor(client, name) {
		this.#client = client;
		this.name = name;
	}

	async execute(msg, args) { }
}