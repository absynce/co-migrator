describe('Migrator', function () {
    it('should have a runMigrations method', function (done) {
        var app = require('compound').createServer();
        app.compound.on('ready', function () {
            var migrator = new Migrator(app.compound);
            console.log('migrator', migrator);
            done();
        });
    });

    it('should have a getMigrations method');
    it('should have a createMigration method');
});
