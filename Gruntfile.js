module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: [
        'gruntfile.js',
        'src/**/*.js',
        '!src/vendor/*.js',
        'test/test/*.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    watch: {
      lint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'qunit']        
      },
      dist: {
        files: ['src/**/*.js'],
        tasks: ['concat', 'qunit', 'uglify']
      }
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      watches: {
        tasks: ["watch:dist"]
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-concurrent');

  // task(s).
  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('dist', ['jshint', 'concat', 'qunit', 'uglify']);
  grunt.registerTask('watchLint', ['watch:lint']);
  grunt.registerTask('watchDist', ['test', 'dist', 'concurrent:watches']);
  grunt.registerTask('default', ['watchDist']);
};