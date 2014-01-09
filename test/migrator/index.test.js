/* jshint expr:true */
var fs   = require('fs');
var path = require('path');

// Define test migration objects.
var v169mig1 = {
    name: '1.6.9-mig.1.js',
    folder: '1.6.9'
};
var v170mig1 = {
    name: '1.7.0-mig.1.js',
    folder: '1.7.0'
};
var v170mig2 = {
    name: '1.7.0-mig.2.js',
    folder: '1.7.0'
};
var v171mig1 = {
    name: '1.7.1-mig.1.js',
    folder: '1.7/1.7.1'
};
var v171mig2 = {
    name: '1.7.1-mig.2.js',
    folder: '1.7/1.7.1'
};

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

    describe('#getMigrations', function () {
        /*
         * This will _not_ include 1.6.9-mig.1 since 1.6.9 is > 1.6.9-mig.1.
         * Including -mig.1 is considered a pre-release.
         * See https://github.com/isaacs/node-semver#ranges for more info.
         */
        it('should get migrations in test/db/migrations ' +
           'folder from 1.6.9', function (done) {
               var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
               var migrator = new Migrator(app.compound, testPath);
               
               // Get migrations >1.6.9.
               var migrations = migrator.getMigrations(null,'1.6.9', null, testPath);

               migrations.length.should.equal(4);
               migrations[0].should.include(v170mig1);
               migrations[1].should.include(v170mig2);
               migrations[2].should.include(v171mig1);
               migrations[3].should.include(v171mig2);
               done();
           });

        /*
         * Specifying 1.7.0-mig.1 as current version should return
         * 1.7.0-mig.2 and 1.7.1-mig.1.
         */
        it('should get migrations in test/db/migrations ' +
           'folder from 1.7.0-mig.1', function (done) {
               var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
               var migrator = new Migrator(app.compound, testPath);
               
               // Get migrations >1.7.0-mig.1
               var migrations = migrator.getMigrations(null,'1.7.0-mig.1', null, testPath);

               migrations.length.should.equal(3);
               migrations[0].should.include(v170mig2);
               migrations[1].should.include(v171mig1);
               migrations[2].should.include(v171mig2);

               done();
        });

        /*
         * Specifying _no_ fromVersion, but a toVersion of
         * 1.7.0-mig.2 should only return migrations to that point.
         */
        it('should get migrations in test/db/migrations ' +
           'folder _to_ 1.7.0-mig.2', function (done) {
               var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
               var migrator = new Migrator(app.compound, testPath);
               
               // Get migrations <=1.7.0-mig.2
               var migrations = migrator.getMigrations(null, null, '1.7.0-mig.2', testPath);

               migrations.length.should.equal(3);
               migrations[0].should.include(v169mig1);
               migrations[1].should.include(v170mig1);
               migrations[2].should.include(v170mig2);

               done();
           });

        /*
         * Specifying _no_ fromVersion, and _no_ toVersion 
         * should return all migrations.
         */
        it('should get all migrations in test/db/migrations ', function (done) {
               var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
               var migrator = new Migrator(app.compound, testPath);
               
               // Get all migrations 
               var migrations = migrator.getMigrations(null, null, null, testPath);

               migrations.length.should.equal(5);
               migrations[0].should.include(v169mig1);
               migrations[1].should.include(v170mig1);
               migrations[2].should.include(v170mig2);
               migrations[3].should.include(v171mig1);
               migrations[4].should.include(v171mig2);

               done();
           });
    });





    it('should return 1.7.1-mig.1 when getting max migration', function (done) {
        var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
        var migrator = new Migrator(app.compound, testPath);
       
        var maxMigration = migrator.maxMigration();

        maxMigration.version.should.equal('1.7.1-mig.2');
        done();
    });
    
    describe('#createMigration', function () {
        it('should create a new migration incremented from current version, ', function (done) {
            var resultPath = path.join(app.compound.root, 'results', 'migrations');
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator   = new Migrator(app.compound, testPath);

            migrator.createMigration('1.7.1-beta', resultPath, function (err, migration) {
                app.compound.logger.debug('migration', migration);
                var migrationPath   = path.join(resultPath, migration.folder, migration.name);
                var migrationExists = fs.existsSync(migrationPath);
                migrationExists.should.be.true;
                done();
            });
        });
    });

    describe('#runMigrations', function () {
        it('should all run migrations after current version', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();
            migrator.runMigrations(null, function (error) {
                    maxVersion.version.should.equal('1.7.1-mig.2');
                    done();
            });
        });

        it('should revert all migrations', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();

            migrator.runMigrations(null, 'down', function (error) {
                    maxVersion.version.should.equal('1.7.1-mig.2');
                    done();
            });
        });


        it('should all run migrations after current version given "up" as an arg and verify the max version', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();

            migrator.runMigrations(null, 'up', function (error) {
                    maxVersion.version.should.equal('1.7.1-mig.2');
                    done();
            });
        });


        it('should run down migrations from maxVersion to 1.7.0-mig.2', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();
            var migrations = migrator.getMigrations('down', '1.7.1-mig.2', '1.7.0-mig.2', testPath);
 
            migrations.forEach(function(mig, index){
                migrator.runMigration(mig, 'down', false, function(error) {
                    if (index === 0) {
                        mig.version.should.equal(maxVersion.version);
                    } else if (index  == migrations.length  - 1) {
                        mig.version.should.equal('1.7.0-mig.2');
                        done();
                    }
                });
            });

        });

        it('should run down migrations from maxVersion to 1.7.1-mig.1', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();
            var migrations = migrator.getMigrations('down', maxVersion.version, '1.7.1-mig.1', testPath);
 
            migrations.forEach(function(mig, index){
                migrator.runMigration(mig, 'down', false, function(error) {
                    if (index === 0) {
                        mig.version.should.equal(maxVersion.version);
                    } else if (index  == migrations.length  - 1) {
                        mig.version.should.equal('1.7.1-mig.1');
                        done();
                    }
                });
            });

        });

        it('should run down migrations from maxVersion(1.7.1-mig.2) to 1.7.1-mig.2', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var maxVersion = migrator.maxMigration();
            var migrations = migrator.getMigrations('down', maxVersion.version, '1.7.1-mig.2', testPath);
            migrations.forEach(function(mig, index){
                migrator.runMigration(mig, 'down', false,function(error) {
                    if (index  === migrations.length  - 1) {
                        mig.version.should.equal('1.7.1-mig.2');
                        done();
                    }
                });
            });

        });

        it('should run runMigrations from maxVersion to 1.7.0-mig.1', function (done) { 
            var testPath = path.join(app.compound.root, 'test', 'db', 'migrations');
            var migrator = new Migrator(app.compound, testPath);
            var Migration = app.compound.models.Migration;
            migrator.runMigrations('1.7.0-mig.2', 'down', function() {
                Migration.maxVersion(function(err, version){
                    version.should.equal('1.7.0-mig.1');
                    done();
                });
            });
        });

    });
});
