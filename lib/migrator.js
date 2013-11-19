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
        this.compound.logger.debug('err', err);
        this.compound.logger.info('Current version: ', currentVersion);
        if (err) {
            this.compound.logger.error(err);
            return done(1);
        }
        
        var files = this.getMigrations(currentVersion, toVersion, this.path);
        this.compound.logger.debug('Migration files', files);
        done();
    }.bind(this));
};

/*
 * Recursively search for migration files up to (optional) passed in version.
 *
 * @param {String} migrationsPath - Directory to search for migrations.
 * @param {String} toVersion (optional) - Highest version to which to migrate.
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
            return semver.gte(file.version, fromVersion);
        }
        else { return true; }
    }

    // Sort migrator files by version ascending using semver.
    function byVersionAscending(file1, file2) {
        return semver.compare(file1.version, file2.version);
    }
};
