/*
 * Migration: Migrator schema model to track database migration changes.
 */
module.exports = {
    version: String,
    fileName: String,
    active: Boolean,
    appliedOn: {
        type: Date,
        default: function () { return new Date(); }
    }
};