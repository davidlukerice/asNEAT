module.exports = function(grunt) {

  var banner = '/* <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [
        'gruntfile.js',
        'src/**/*.js',
        '!src/vendor/*.js',
        'test/test/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    clean: ['tmp'],

    copy: {
      main: {
        files: [{
          expand: true,
          cwd:'src',
          src: ['**/*.js'],
          dest: 'tmp/javascript/'
        }]
      }
    },

    transpile: {
      main: {
        type: 'amd',
        moduleName: function(path) {
          return grunt.config.process('<%= pkg.moduleName %>/') + path;
        },
        files: [{
          expand: true,
          cwd: 'tmp/javascript/',
          src: ['**/*.js'],
          dest: 'tmp/transpiled/'
        }]
      }
    },

    concat: {
      options: {
        banner: banner
      },
      dist: {
        src: ['tmp/transpiled/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: banner
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
    
    watch: {
      lint: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'qunit']        
      },
      build: {
        files: ['src/**/*.js'],
        tasks: ['clean', 'copy', 'transpile', 'concat', 'uglify']
      }
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      watches: {
        tasks: ["watch:lint", "watch:build"]
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-es6-module-transpiler');

  // tasks
  grunt.registerTask('test', ['jshint', 'build', 'qunit']);
  grunt.registerTask('build', ['clean', 'copy', 'transpile', 'concat', 'uglify']);
  grunt.registerTask('watchBuild', ['jshint', 'build', 'qunit', 'concurrent:watches']);
  grunt.registerTask('default', ['watchBuild']);
};