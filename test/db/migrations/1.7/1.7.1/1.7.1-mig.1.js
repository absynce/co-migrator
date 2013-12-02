// Migration 1.7.1-mig.1
module.exports = function (compound, schema, models) {
  return {
    up   : function (done) {
      compound.logger.debug('Running migration 1.7.1-mig.1');

      // Put custom migration logic here.

      // Don't forget to call done();
      done();
    },
    down : function (done) {
      // Undo stuff.
      done();
    }
  };
};