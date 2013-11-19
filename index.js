module.exports = function (compound, Migrator) {
    var app = compound.app;
    
    compound.tools.migrator = function m() {
        var action = process.argv[3] || 'up';
        switch (action) {
        case 'up':
            var migrator  = new Migrator(compound);
            var toVersion = process.argv.length > 4 ? process.argv[4] : null;
            migrator.runMigrations(toVersion, process.exit); 
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
};
