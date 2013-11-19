/*
 * Version: Migrator schema model to track database migration changes.
 */
module.exports = {
    version: Number,
    fileName: String,
    appliedOn: {
        type: Date,
        default: function () { return new Date(); }
    }
};
