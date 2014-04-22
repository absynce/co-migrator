var migration = require('./migration');

module.exports = function (db) {
    db.define('Migration', migration);
    return db;
};