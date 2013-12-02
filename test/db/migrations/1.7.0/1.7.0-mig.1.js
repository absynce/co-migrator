module.exports = function (compound, schema, models) {
    return {
        up   : function (done) {
            compound.logger.debug('Running migration 1.7.0-mig.1.js');

            // Example: renaming a table.
            // Create model with existing name temporarily.
            // automigrate
            // Update new name with old one using schema.

            // If updating schema manually, verify it worked at the end.
            if (!schema.isActual) {
                compound.logger.debug('Schema is not actual!');
                done(new Error('Schema is NOT actual!'));
            } else {
                compound.logger.debug('Schema is actual!');
            }

            done();
        },
        down : function (done) {
            // Undo table rename.
        }
    };
};
