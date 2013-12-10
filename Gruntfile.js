module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['**/*.js',
                    '!node_modules/**/*.js']
        },
        cafemocha: {
            src: ['test/init.js',
                  'test/**/*.test.js'],
            options: {
                growl: 'true'
            }
        },
        release: {
            options: {
                bump: false,
                npm: true,
                commitMessage: 'Release <%= version %>',
                tagMessage: 'Release <%= version %>'
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['lint', 'test']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-cafe-mocha');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['lint', 'test']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test', ['cafemocha']);

    // Override some properties to prepare release.
    grunt.registerTask('prepRelease', function (type) {
        grunt.config.set('release.options.bump', true);
        grunt.config.set('release.options.npm', false);
        grunt.config.set('release.options.tag', false);
        
        if (type === null) {
            grunt.task.run('release');
        } else {
            grunt.task.run('release:' + type);
        }
    });
};
