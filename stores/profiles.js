const { Collection } = require("discord.js");

class ProfileStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
		this.expGiven = new Set();
		this.cache = new Map();

		setInterval(this.cache.clear(), process.env.CACHE_CLEAR || 10 * 60 * 1000) // clear cache every 10m by default
	};

	async create(user, data = {}) {
		try {
			this.db.query(`INSERT INTO profiles (
				user_id,
				name,
				description,
				color,
				level,
				exp,
				disabled
			) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			[user, data.name, data.description,
			 data.color, data.level || 1, data.exp || 0,
			 data.disabled || 0])
		} catch(e) {
			console.error(e.message);
			return Promise.reject(e.message);
		}

		return await this.get(user);
	}

	async get(user, forceUpdate = false) {
		if(!forceUpdate) {
			var profile = this.cache.get(user);
			if(profile) return profile;
		}
		
		var data = await this.db.query(`SELECT * FROM profiles WHERE user_id = $1`, [user]);

		if(data.rows?[0]) {
			this.cache.set(user, data.rows[0]);
			return data.rows[0];
		} else return undefined;
	}

	async update(user, data) {
		this.db.query(`UPDATE profiles SET ${Object.keys(data).map((k, i) => k+'=$' + (i + 2)).join(",")} WHERE user_id=$1`,[user, ...Object.values(data)])
	}
0
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