require('should');
var Schema = require('jugglingdb').Schema;
var schema = require('../db/schema');

global.sinon = require('sinon');

global.Migrator = require('../lib/migrator');

before(function (done) {
    loadCompound(function (compound) {
        global.db = new Schema('mysql', {
            database: 'co-migrator-test',
            username: 'root',
        });
        loadSchema(compound, function (compound) {
            done();
        });
    });
});

function loadSchema(compound, done) {
    db = schema(db);
    compound.orm = {
        _schemas : [ db ]
    };
    
    done(compound);
}

function loadCompound(done) {
    var app = require('compound').createServer();
    app.compound.on('ready', function () {
        done(app.compound);
    });
}
