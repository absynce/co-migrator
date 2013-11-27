var postSchema = require('../../schemas/post');
var util       = require('util');

module.exports = function (compound, schema, models, done) {
    // Example migration 1.6.9-01.js
    compound.logger.debug('Running migration 1.6.9-mig.1.js');

    // Create Posts table in schema
    var Posts = schema.define('Posts', postSchema);

    async([
        schema.automigrate.bind(schema),
        checkActual,
        createPosts
    ], done);

    function checkActual(done) {
        schema.isActual(function (err, actual) {
            if (!actual) {
                return done(new Error('Schema is not actual!'));
            }
            done();
        });
    }    

    function createPosts(done) {
        async([
            function (cb) {
        Posts.create({
            name        : 'My First Blog Post',
            description : 'My first blog post evar!!'
        }, cb);
            },
            function (cb) {
                Posts.create({
                    name        : 'My First Pony',
                    description : 'My first pony ride!'
                }, cb);
            }
        ], done);
    }

    // TODO: Make this an async lib.
    function async(tasks, done) {
        function runTask(task) {
            compound.logger.debug('Running task', util.inspect(task));
            if (task) {
                task(function (err) {
                    if (err) { return done(err); }
                    return runTask(tasks.shift());
                });
            }
            else {
                compound.logger.debug('Finished tasks.');
                return done();
            }
        }

        runTask(tasks.shift());
    }
};


