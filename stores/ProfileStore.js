const {Collection} = require("discord.js");

class ProfileStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;

		bot.profiles = this;
	};

	async create(user, data = {}) {
		return new Promise(async (res, rej) => {
			this.db.query(`INSERT INTO profiles (
				user_id,
				name,
				description,
				color,
				level,
				exp,
				disabled
			) VALUES (?,?,?,?,?,?,?)`,
			[user, data.name, data.description,
			 data.color, 1, 0, 0], async (err, rows) => {
			 	if(err) {
			 		console.log(err);
			 		rej(err.message);
			 	} else {
			 		res(await this.get(user));
			 	}
			 })
		})
	}

	async get(user, forceUpdate = false) {
		return new Promise((res, rej) => {
			if(!forceUpdate) {
				var profile = super.get(user);
				if(profile) return res(profile);
			}
			
			this.db.query(`SELECT * FROM profiles WHERE user_id = ?`,[user], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					this.set(user, rows[0]);
					res(rows[0])
				}
			})
		})
	}

	async update(user, data) {
		return new Promise((res, rej) => {
			this.db.query(`UPDATE profiles SET ${Object.keys(data).map((k) => k+"=?").join(",")} WHERE user_id=?`,[...Object.values(data), user], async (err, rows)=> {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					res(await this.get(user, true));
				}
			})
		})
	}

	async delete(user) {
		return new Promise((res, rej) => {
			this.db.query(`DELETE FROM profiles WHERE user_id = ?`, [user], (err, rows) => {
				if(err) {
					console.log(err);
					rej(err.message);
				} else {
					super.delete(user);
					res();
				}
			})
		})
	}
}

module.exports = (bot, db) => new ProfileStore(bot, db);