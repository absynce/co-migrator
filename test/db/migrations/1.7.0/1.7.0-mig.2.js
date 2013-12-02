module.exports = function (compound, schema, models) {
    return {
        up   : function (done) {
            // Example migration 1.7.0-mig.2.js
            compound.logger.debug('Running migration 1.7.0-mig.2.js');
            done();
        },
        down : function (done) {
            done();
        }
    };
};
