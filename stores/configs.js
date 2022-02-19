const {Collection} = require("discord.js");

class ConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
		this.cache = new Map();

		setInterval(() => this.cache.clear(), process.env.CACHE_CLEAR || 10 * 60 * 1000)
	};

	async create(server, data = {}) {
		try {
			await this.db.query(`INSERT INTO configs (
				server_id,
				prefix,
				disabled,
				levels
			) VALUES ($1,$2,$3,$4)`,
			[server, data.prefix, data.disabled, data.levels])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.get(server)
	}

	async get(server, forceUpdate = false) {
		if(!forceUpdate) {
			var config = this.cache.get(server);
			if(config) return config;
		}

		try {
			var data = await this.db.query(`SELECT * FROM configs WHERE server_id = $1`,[server]);
		} catch(e) {
			return Promise.reject(e.message)
		}

		if(data.rows?.[0]) {
			this.cache.set(server, data.rows[0]);
			return data.rows[0];
		} else return undefined;
	}

	async update(server, data = {}) {
		try {
			await this.db.query(`
				UPDATE configs SET ${Object.keys(data).map((k, i) => k+'=$' + (i + 2)).join(",")}
				WHERE server_id=$1`,
			[server, ...Object.values(data)])
		} catch(e) {
			return Promise.reject(e.message)
		}

		return await this.get(server, true);
	}

	async delete(server) {
		try {
			await this.db.query(`DELETE FROM configs WHERE server_id = $1`, [server])
		} catch(e) {
			return Promise.reject(e.message);
		}

		this.cache.delete(server);
		return;
	}
}

module.exports = (bot, db) => new ConfigStore(bot, db);