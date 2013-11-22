
module.exports = function (compound) {
    var env = compound.app.get('env');
    
    if (env === 'development') {
        compound.logger.transports.console.level = 'debug';
    }
};
