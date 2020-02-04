const {Collection} = require("discord.js");
const expGiven = new Set();

class ProfileStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
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
			 data.color, data.level || 1, data.exp || 0, data.disabled || 0], async (err, rows) => {
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
			
			this.db.query(`SELECT * FROM profiles WHERE user_id = ?`,[user], {
				id: Number,
				user_id: String,
				name: String,
				description: String,
				color: String,
				level: Number,
				exp: Number,
				disabled: Boolean
			},(err, rows) => {
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

	async handleExperience(user) {
		return new Promise(async (res, rej) => {
			if(expGiven.has(user)) return res({});
			var profile = await this.get(user);
			var amount = Math.floor(Math.random() * 8) + 3; //for some variation
			var data = {};
			if(profile) {
				var nextLevel = Math.pow(profile.level, 2) + 100;
				if(profile.exp + amount >= nextLevel) {
					profile.exp = profile.exp + amount - nextLevel;
					profile.level += 1;
					if(!profile.disabled) data.message = `Congrats $USER, you're now level ${profile.level}!`
				} else profile.exp += amount;

				try {
					await this.update(user, {exp: profile.exp, level: profile.level});
				} catch(e) {
					return rej(e);
				}
			} else {
				try {
					profile = await this.create(user, {exp: 5});
				} catch(e) {
					return rej(e);
				}
			}
			expGiven.add(user);
			setTimeout(()=> expGiven.delete(user), 10000); //ratelimit/cooldown
			res(data);
		})
	}
}

module.exports = (bot, db) => new ProfileStore(bot, db);