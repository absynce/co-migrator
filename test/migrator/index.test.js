var path = require('path');

describe('Migrator', function () {
    it('should be an instance of Migrator and have properties', function (done) {
        var migrator = new Migrator(app.compound);

        migrator.should.be.an.instanceOf(Migrator);
        migrator.should.have.property('path');
        migrator.should.have.property('schema');
        migrator.should.have.property('compound');
        done();
    });

    it('should have a path relative to compound root if not passed in', function (done) {
        var migrator = new Migrator(app.compound);
        var testPath = path.join(app.compound.root, 'db', 'migrations');

        migrator.path.should.equal(testPath);
        done();
    });

    it('should have a path variable set to variable if passed in', function (done) {
        var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
        var migrator = new Migrator(app.compound, testPath);

        migrator.path.should.equal(testPath);
        done();
    });

    it('should get migrations in test/db/migrations folder passed in');
    
    it('should have a createMigration method');
});
