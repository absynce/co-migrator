var semver = require('semver');

module.exports = function (compound, Migration) {
    if (Migration) {
        /*
         * Return the highest _version_ in db, not the Migration instance.
         */
        Migration.maxVersion = function (done) {
            var maxVersion = null;

            Migration.all({where: {active: true}},function (err, migrations) {
                if (err) { return done(err); }
                    var versionNames   = migrations.map(function (m) { return m.version; });
                    maxVersion = semver.maxSatisfying(versionNames, ''); // Get highest version.
                    done(null, maxVersion, migrations.length);
            });
        };


    }
};
