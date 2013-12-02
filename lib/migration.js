(function (define) {
    define([], function () {
        var Migration = function Migration(props) {
            this.name   = '';
            this.folder = '';

            this.init(props);
        };

        Object.defineProperty(Migration.prototype, 'version', {
            get: function () { return this.name.replace('.js', ''); }
        });

        Migration.prototype.init = function (properties) {
            // Add options to enum.
            for (var key in properties) {
                this[key] = properties[key];
            }
        };
        
        return Migration;
    });
}(
    typeof define == 'function' && define.amd ? define 
    : function (ids, factory) {
        if (typeof exports === 'object') {   
            var deps = ids.map(function (id) { return require(id); });
            module.exports = factory.apply(null, deps);
        }
        else {
            this.app           = this.app || { };
            this.app.Migration = factory();
        }
    }.bind(this)
));
