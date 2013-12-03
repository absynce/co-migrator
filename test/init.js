require('should');
var Schema    = require('jugglingdb').Schema;
var schema    = require('../db/schema');
var util      = require('util');
var migration = require('../app/models/migration');

global.sinon = require('sinon');

global.Migrator = require('../lib/migrator');

before(function (done) {
    loadCompound(function (compound) {
        global.db = new Schema('memory');

        loadSchema(compound, function (compound) {
            loadModels(compound, compound.models);
            
/*            compound.models.Version.create({
                version: '1.6.9-mig.1',
                fileName: '1.6.9/1.6.9-mig.1.js'
            }, function (err, v) {
                done();
            });*/
            done();
        });
    });
});

function loadSchema(compound, done) {
    db = schema(db);
    compound.orm = {
        _schemas : [ db ]
    };
    compound.models = db.models;
    db.automigrate(function () {
        done(compound);
    });
}

function loadCompound(done) {
    // Create a new instance of compound and assign it to the global scope.
    global.app = require('compound').createServer();
    app.compound.on('ready', function () {
        done(app.compound);
    });
}

function loadModels(compound, models) {
    migration(compound, models.Migration);
}
