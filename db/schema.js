var version = require('./version');

module.exports = function (db) {
    db.define('Version', version);
    return db;
};
