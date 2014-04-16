co-migrator
===========

Database migration tool for use in [compound.js](https://github.com/1602/compound).


Installation
============

Step 1. Install using npm:

    npm install co-migrator --save

Step 2. Add `co-migrator` to `config/autoload.js`, for example:

```javascript
module.exports = function (compound) {
    return [
        'ejs-ext',
        'jugglingdb',
        'seedjs',
        'co-logger',
        'co-migrator'
    ].map(require);
};
```

Step 3. Add schema to `db/schema.js`:

```javascript
var migration = require('co-migrator').Schema.Migration;
schema.define('Migration', migration);
```

Step 4. Add model to `app/models/migration.js`:

```javascript
module.exports = require('co-migrator').Models.Migration;
```

Usage
=====

##Create a new migration:

    compound m create

    You may also specify the schema(currently defaults to mysql):

    compound m create mongodb
    
A new migration will be saved in `db/migrations/[version]`. If a migration already exists for the current version of the application, a new migration will be incremented from the highest version of the current migration. 

Example:

If the application is on version `1.2.3` and a migration is in `db/migrations/1.2/1.2.3` called `1.2.3-mig.1.js`, a new migration `1.2.3-mig.2.js` will be placed in the same directory.

##Migration example:

`db/schemas/post.js`:
```javascript
module.exports = {
    name        : String,
    description : String,
    writtenOn   : {
        type: Date,
        default: function () { return new Date(); }
    }
};
```

`db/migrations/1.2/1.2.3/1.2.3-mig.1.js`:
```javascript
var postSchema = require('../../schemas/post');

module.exports = function (compound, schema, models) {
    return {
        up   : function (done) {
            var Posts = schema.define('Posts', postSchema);
            
            schema.autoupdate(function (err) {
                if (err) { return done(err); }
                Posts.create({
                            name        : 'My First Blog Post',
                            description : 'My first blog post evar!!'
                }, done);
            });
        },
        down : function (done) {
            // Not used.
            done();
        }
    };
};
```

##Run Migrations

Run migrations:

    compound m
    
Rollback migrations:

    compound m down
    
    You can also specify schema

    compound m down myql