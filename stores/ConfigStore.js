const {Collection} = require("discord.js");

class ConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;

		bot.configs = this;
	};

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO configs (
				server_id,
				prefix,
				disabled,
				levels
			) VALUES (?,?,?,?)`,
			[server, data.prefix, data.disabled, data.levels], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(server));
			 	}
			 })
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}
			
			this.db.query(`SELECT * FROM configs WHERE server_id = ?`,[server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					this.set(server, rows[0]);
					res(rows[0])
				}
			})
		})
	}

	async update(server, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE configs SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE server_id=?`,[...Object.values(data), server], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(server, true));
				}
			})
		})
	}

	async delete(server) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM configs WHERE server_id = ?`, [server], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(server);
					res();
				}
			})
		})
	}
}

module.exports = (bot, db) => new ConfigStore(bot, db);