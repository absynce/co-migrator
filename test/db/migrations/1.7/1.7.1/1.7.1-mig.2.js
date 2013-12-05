// Migration 1.7.1-mig.2
module.exports = function (compound, schema, models) {
  return {
    up   : function (done) {
      compound.logger.debug('Running migration 1.7.1-mig.2');

      // Error!
      done(new Error('Something bad happened!'));
    },
    down : function (done) {
      // Undo stuff.
      done();
    }
  };
};
