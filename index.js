var Migrator = require('./lib/migrator');
var path     = require('path');

function init(compound) {
    var app = compound.app;
    
    compound.tools.migrator = function m() {
        var action   = process.argv[3] || 'up';
        var schema   = process.argv.length > 5 ? process.argv[5] : process.argv[4] || 'mysql';
        console.log(schema);
        var migrator = new Migrator(compound, schema);
        switch (action) {
        case 'up'   :
        case 'down' :
            console.log(action);
            var toVersion = process.argv.length > 5 ? process.argv[4] : process.argv[5] || null;
            migrator.runMigrations(toVersion, action, exitProcess);
            break;
        case 'create':
            var packPath = path.join(process.cwd(), 'package.json');
            var version  = require(packPath).version;
            migrator.createMigration(version, exitProcess);
            break;
        default:
            console.log('Unknown action', action);
            break;
        }
    };

    compound.tools.migrator.help = {
        shortcut:    'm',
        usage:       'm [up|down|create] [version]',
        description: 'Migrate database(s) up, down or create a new migration.'
    };

    function getUniqueSchemas() {
        var schemas = [];
        Object.keys(compound.models).forEach(function (modelName) {
            var Model = compound.models[modelName];
            var schema = Model.schema;
            if (!~schemas.indexOf(schema)) {
                schemas.push(schema);
            }
        });
        return schemas;
    }

    function perform(action, callback) {
        console.log('Perform', action, 'on');
        var wait = 0;
        getUniqueSchemas().forEach(function (schema) {
            if (schema[action]) {
                console.log(' - ' + schema.name);
                wait += 1;
                process.nextTick(function () {
                    schema[action](done);
                });
            }
        });

        if (wait === 0) done(); else console.log(wait);

        function done() {
            if (--wait === 0) callback();
        }

        return true;
    }

    function exitProcess(err) {
        var exitCode = 0;
        if (err) { exitCode = 1; }
        process.exit(exitCode);
    }       
}


Migrator.init             = init;
Migrator.Schema           = Migrator.Schema || { };
Migrator.Schema.Migration = require('./db/migration');
Migrator.Models           = Migrator.Models || { };
Migrator.Models.Migration = require('./app/models/migration');

module.exports = Migrator;
