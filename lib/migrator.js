var fs        = require('fs');
var Migration = require('./migration');
var mkdirp    = require('mkdirp');
var Mustache  = require('mustache');
var path      = require('path');
var semver    = require('semver');

module.exports = Migrator;

/*
 * Migration tool.
 *
 * @param {Compound} compound - Compound server
 * @param {String} root - (optional) where to search for migrations
 */
function Migrator(compound, migrationsPath) {
    this.compound = compound;
    this.logger   = compound.logger;
    this.path = migrationsPath || path.join(compound.root, 'db', 'migrations');
    // TODO: Define migrations per schema.
    this.schema   = compound.orm._schemas[0];

    return this;
}

Migrator.prototype.runMigrations = function (toVersion, direction, done) {
    if (typeof(direction) === 'function') {
        done = direction;
        this.direction = 'up';
    } else {
        this.direction = direction;
    }
    this.logger.info('Running migrations:' + direction + ' in ' + this.path);
    var queue = [];
    this.compound.models.Migration.maxVersion(function (err, currentVersion, numOfPreviousMigs) {
        this.logger.info('Current version: ', currentVersion);
        if (err) {
            this.logger.error(err);
            return done(1);
        }
        if (direction == 'down') {
            currentVersion = '';
        }

        var files = this.getMigrations(numOfPreviousMigs, this.direction, currentVersion, toVersion, this.path);

        this.logger.debug('Migration files:', files);

        var active = true;
        if (direction == 'down') {
            active = false;
        }

        // TODO: Rewrite as an async module.
       this.setMigrationsActiveState(active, function(error){
            if (error) { done(error); }
            var migrator = this;
            function runMig(mig) {
                if (mig) {
                    migrator.runMigration(mig, direction, active, function (err) {
                        if (err) {
                            migrator.logger.error('Migration ' + mig.name + ' failed!');
                            migrator.logger.error(err);
                            done(err);
                        }
                        else {
                            runMig(files.shift());
                        }
                    });
                }
                else {
                    migrator.compound.models.Migration.maxVersion(function (err, maxVersion) {
                        migrator.compound.logger.debug('max version', maxVersion);
                        done();
                    });
                }
            }
            runMig(files.shift());
        }.bind(this));

    }.bind(this));
};

Migrator.prototype.setMigrationsActiveState = function (active, done) {
    if (active === false && this.direction == 'down') {
        this.compound.models.Migration.all({where: {active: true}}, function(err, migrations){
            if (err) { done(err); }
            if (migrations.length > 0) {
                migrations.forEach(function (mig, index){
                    mig.updateAttributes({active: false}, function (err) {
                        if (err) { done(err); }
                        if (index == migrations.length - 1) {
                            done();
                        }
                    });
                }); 
            } else {
                done();
            }
        });
    } else {
        done();
    }
};


/*
 * Run a migration
 */
Migrator.prototype.runMigration = function (migration, direction, active, done) {
    // Check if direction was passed to run migration.
    // If not, default to 'up'.
    if (typeof(direction) === 'function') {
        done = direction;
        direction = 'up';
    }
    this.compound.logger.debug('Running migration:' + direction, migration);

    var migrationFolder = path.join(migration.folder, migration.version);
    var migrationPath   = path.join(this.path, migrationFolder);
    var migrationCode   = require(migrationPath)(this.compound,
                                                 this.compound.orm._schemas[0],
                                                 this.compound.models);


        migrationCode[direction](function (err) {
            if (err) { return done(err); }
            this.compound.models.Migration.create({
                version  : migration.version,
                fileName : migrationPath,
                active   : active,
            }, function (err, version) {
                done(err);
            });
        }.bind(this));
};

/*
 * Recursively search for migration files up to (optional) passed in version.
 *
 * @param {String} fromVersion (optional) - Version _after_ which to migrate.
 * @param {String} toVersion (optional) - Highest version to which to migrate.
 * @param {String} migrationsPath - Directory to search for migrations.
 * @param {String} relativeFolder (optional) - Relative folder for files based on original passed in migrationsPath.
 */
Migrator.prototype.getMigrations = function (numOfPreviousMigs,
                                             direction,
                                             fromVersion,
                                             toVersion,
                                             migrationsPath,
                                             relativeFolder) {
    var dirContents = [];
    var files       = [];
    relativeFolder  = relativeFolder || '';

    if (fs.existsSync(migrationsPath)) {
        dirContents = fs.readdirSync(migrationsPath);
    }

    for (var i in dirContents) {
        var item     = dirContents[i];
        var itemPath = path.join(migrationsPath, item);
        var stats    = fs.statSync(itemPath);

        if (stats.isFile()) {
            files.push({
                name   : item,
                folder : relativeFolder,
                // Version is pulled from file name.
                get version() { return this.name.replace('.js', ''); }
            });
        }
        else if (stats.isDirectory()) {
            var childFiles = this.getMigrations(numOfPreviousMigs,
                                                direction,
                                                fromVersion,
                                                toVersion,
                                                itemPath,
                                                path.join(relativeFolder, item));
            files = files.concat(childFiles);
        }
    }
   
    if (direction == 'down' && numOfPreviousMigs == '0') {
        return [];
    } else {
        return files
            .sort(byVersion)
            .filter(filterFromVersion)
            .filter(filterToVersion);
    }


    // Filter migrator file version based on to version.
    function filterToVersion(file) {
        if (toVersion) {
            if (direction =='down') {
                return semver.gte(file.version, toVersion);
            } else {
               return semver.lte(file.version, toVersion);
            }
        }
        else {
            return true;
        }
    }

    // Filter migrator file version based on from version.
    function filterFromVersion(file) {
        if (fromVersion) { 
            // Check greater than fromVersion because it should _not_
            // include the current version.
            return semver.gt(file.version, fromVersion);
        }
        else { return true; }
    }

    // Sort migrator files by version ascending using semver.
    function byVersion(file1, file2) {
        if (direction == 'down') {
           return semver.rcompare(file1.version, file2.version);
        } else {
           return semver.compare(file1.version, file2.version);
        }
    }


};

Migrator.prototype.maxMigration = function () {
    var migrations = this.getMigrations(null, null, null, null, null, this.path);

    // Get latest migration
    var maxVersion = null;

    if (migrations.length > 0) {
        maxVersion = migrations[migrations.length-1];
    }

    return maxVersion;
};

/*
 * First it checks if the requested version is greater than
 * the greatest migration in the migrations folder. If not,
 * it errors w/o creating a migration.
 * 
 * Create a new migration incremented from current version
 * if it is the same major.minor.patch. Otherwise, it creates
 * a new migration [version]-mig.1.
 */
Migrator.prototype.createMigration = function (version, folder, done) {
    // Check if path variable was passed.
    if (typeof(folder) === 'function') {
        done   = folder;
        folder = this.path;
    }
    
    // Get latest migration
    var maxMigration = this.maxMigration();
    var maxVersion   = maxMigration ? maxMigration.version : null;

    // If there are migrations for this version...increment.
    // Otherwise create a new migration with current version + '-mig.1'.

    // Compare max versus passed version.
    var versionWithoutPre = stripPreRelease(version);
    var migration = new Migration();
        
    if (maxMigration && versionWithoutPre===stripPreRelease(maxMigration.version)) {
        // Increment
        migration.name    = semver.inc(maxMigration.version, 'prerelease') + '.js';
        migration.folder  = maxMigration.folder;
    }
    else {
        // Create first migration of version.
        migration.name    = versionWithoutPre + '-mig.1.js';
        migration.folder  = versionWithoutPre;
    }

    // Create migration file from template.
    var migrationLocation = path.join(folder, migration.folder);
    var migrationPath     = path.join(migrationLocation, migration.name);
    var migrationTemplate = require('./migration.template');
    var migrationText     = Mustache.render(migrationTemplate, migration);

    // Check/make directory
    mkdirp.sync(migrationLocation);
    
    // Write new migration text to file.
    this.compound.logger.info('Creating migration', migrationPath);
    fs.writeFileSync(migrationPath, migrationText);
    
    done(null, migration);
    
    function stripPreRelease(version) {
        var indexOfDash = version.indexOf('-');

        if (!~indexOfDash) {
            return version;
        }

        var lengthToDash = version.length-(version.length-indexOfDash);
        
        return version.substring(0, lengthToDash);
    }
};
