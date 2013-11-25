var semver = require('semver');

module.exports = function (compound, Version) {
    if (Version) {
        /*
         * Return the highest _version_ in db, not the Version record.
         */
        Version.max = function (done) {
            var maxVersion = null;

            Version.all(function (err, versions) {
                if (err) { return done(err); }
                var versionNames   = versions.map(function (v) { return v.version; });
                maxVersion = semver.maxSatisfying(versionNames, ''); // Get highest version.

                done(null, maxVersion);
            });
        };
    }
};
