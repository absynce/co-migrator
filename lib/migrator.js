var fs        = require('fs');
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

Migrator.prototype.runMigrations = function (toVersion, done) {
    this.logger.info('Running migrations in ' + this.path);
    var queue = [];
    this.compound.models.Version.max(function (err, currentVersion) {
        this.compound.logger.info('Current version: ', currentVersion);
        if (err) {
            this.compound.logger.error(err);
            return done(1);
        }
        
        var files = this.getMigrations(currentVersion, toVersion, this.path);

        this.compound.logger.debug('Migration files', files);

        // TODO: Rewrite as an async module.
        var migrator = this;
        function runMig(mig) {
            if (mig) {
                migrator.runMigration(mig, function (cb) {
                    runMig(files.shift());
                });
            }
            else {
                migrator.compound.models.Version.max(function (err, maxVersion) {
                    migrator.compound.logger.debug('max version', maxVersion);
                    done();
                });
            }
        }

        runMig(files.shift());
    }.bind(this));
};

/*
 * Run a migration
 */
Migrator.prototype.runMigration = function (migration, done) {
    this.compound.logger.debug('Running migration', migration);

    var migrationFolder = path.join(migration.folder, migration.version);
    var migrationPath   = path.join(this.path, migrationFolder);
    var migrationCode   = require(migrationPath);
    migrationCode(this.compound, this.compound.orm._schemas[0], this.compound.models, function (err) {
        if (err) { return done(err); }
        this.compound.models.Version.create({
            version: migration.version,
            fileName : migrationFolder
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
Migrator.prototype.getMigrations = function (fromVersion,
                                             toVersion,
                                             migrationsPath,
                                             relativeFolder) {
    var dirContents = [];
    var files       = [];
    relativeFolder  = relativeFolder || '';
    this.compound.logger.debug('Getting migrations from ', fromVersion, 'to', toVersion);

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
            var childFiles = this.getMigrations(fromVersion,
                                                toVersion,
                                                itemPath,
                                                path.join(relativeFolder, item));
            files = files.concat(childFiles);
        }
    }
            
    return files
        .sort(byVersionAscending)
        .filter(filterFromVersion)
        .filter(filterToVersion);

    // Filter migrator file version based on to version.
    function filterToVersion(file) {
        if (toVersion) { 
            return semver.lte(file.version, toVersion);
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
    function byVersionAscending(file1, file2) {
        return semver.compare(file1.version, file2.version);
    }
};
