/*
 * Post: An example table of datar.
 */
module.exports = {
    name        : String,
    description : String,
    writtenOn   : {
        type: Date,
        default: function () { return new Date(); }
    }
};
