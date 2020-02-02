var fs = require('fs');
var dblite = require('dblite');

module.exports = (bot) => {
	db = dblite("./data.sqlite","-header");

	db.query(`CREATE TABLE IF NOT EXISTS profiles (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id 	TEXT,
		name 		TEXT,
		description	TEXT,
		color 		TEXT,
		level 		INTEGER,
		exp		 	INTEGER,
		disabled 	INTEGER
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS configs (
		id 			INTEGER PRIMARY KEY AUTOINCREMENT,
		server_id 	TEXT,
		prefix		TEXT,
		disabled	TEXT,
		levels		INTEGER
	)`);

	//TODO: change this to be more dynamic
	//		so that store constructors don't have
	//		"bot.[x] = this" stuff in them
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(file == "__db.js") continue;

		require(__dirname+'/'+file)(bot, db);
	}

	return db;
}