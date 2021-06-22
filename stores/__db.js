var fs = require('fs');
var dblite = require('dblite');

module.exports = (bot) => {
	db = dblite("./data.sqlite","-header");

	db.query(`CREATE TABLE IF NOT EXISTS profiles (
		id 			SERIAL PRIMARY KEY,
		user_id 	TEXT,
		name 		TEXT,
		description	TEXT,
		color 		TEXT,
		level 		INTEGER,
		exp		 	INTEGER,
		disabled 	INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS configs (
		id 			SERIAL PRIMARY KEY,
		server_id 	TEXT,
		prefix		TEXT,
		disabled	TEXT,
		levels		INTEGER
	)`);

	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(file == "__db.js") continue;
		var name = file.slice(0, -3):
		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}