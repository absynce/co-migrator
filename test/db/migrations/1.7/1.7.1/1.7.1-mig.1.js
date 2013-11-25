module.exports = function (compound, schema, models, done, err) {
    // Put migration logic here.
    compound.logger.debug('Running migration 1.7.1-mig.1.js');

    // Example: renaming a table.
    // Create model with existing name temporarily.
    // automigrate
    // Update new name with old one using schema.

    // If updating schema manually, verify it worked at the end.
    if (!schema.isActual) {
        compound.logger.debug('Schema is not actual!');
        err();
    } else {
        compound.logger.debug('Schema is actual!');
    }

    done();
};
