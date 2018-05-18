module.exports = function(grunt)
{
	require('load-grunt-tasks')(grunt);
	require('time-grunt')(grunt);

	grunt.initConfig({
		clean: {
			main: {
				files: [{
					dot: true,
					src: [
						'build/{,*/}*'
					]
				}]
			},
			tmp: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'Global'
					]
				}]
			},
			withoutmap: {
				files: [{
					dot: true,
					src: [
						'build/{,*/}*',
						'!build/Global',
						'!build/Global/ThirdParty/**',
						'build/Global/ThirdParty/*',
						'!build/Global/ThirdParty/agsjso318'
					]
				}]
			}
		},
		less: {
			build: {
				files: {
					"build/Global/css/tripfinder.css": "TripfinderWeb/Global/css/tripfinder.less",
					//Because cssconcat won't look at build folder, so output to here for cssconcat's use
					"TripfinderWeb/Global/css/tripfinder.css": "TripfinderWeb/Global/css/tripfinder.less"
				}
			}
		},

		sync: {
			js: {
				files: [{
					cwd: 'tripfinderweb/Global/JavaScript',
					src: [
						'**/*.*'
					],
					dest: 'build/Global/JavaScript',
					expand: true,
					filter: 'isFile'
				},
				{
					cwd: 'tripfinderweb/Global/ThirdParty',
					src: [
						'**/*.*'
					],
					dest: 'build/Global/ThirdParty',
					expand: true,
					filter: 'isFile'
				}
				]
			},
			jsbuild: {
				files: [{
					cwd: 'tripfinderweb/Global/ThirdParty',
					src: [
						'**/*.*'
					],
					dest: 'build/Global/ThirdParty',
					expand: true,
					filter: 'isFile'
				}]
			},
			html: {
				files: [{
					cwd: 'tripfinderweb/Html',
					src: [
						'**/*.*'
					],
					dest: 'build',
					expand: true,
					filter: 'isFile'
				}]
			},
			resource: {
				files: [{
					cwd: 'tripfinderweb/Global',
					src: [
						'**/*.ico',
						'**/*.jpg',
						'**/*.png',
						'**/*.gif',
						'**/*.eot',
						'**/*.svg',
						'**/*.ttf',
						'**/*.woff',
						'**/*.woff2'
					],
					dest: 'build/Global',
					expand: true,
					filter: 'isFile'
				}]
			},
			individual: {
				files: [{
					cwd: 'tripfinderweb',
					src: ['admin.html',
						'privatesite.html',
						'login.html',
						'index.html',
						'error.html',
						'local_settings.js',
						'Web.config'
					],
					dest: 'build',
					expand: true,
					filter: 'isFile'
				}]
			},
			localization: {
				files: [{
					expand: true,
					cwd: 'tripfinderweb/localization',
					src: ['**/*.json'],
					dest: 'build/localization',
					filter: 'isFile'
				}]
			}
		},
		concat: {
			options: {
				process: function(src, filepath)
				{
					if (filepath.indexOf('.js') > 0)
					{
						return src + ';\n';
					}
					return src;
				}
			}
		},
		uglify: {
			debug: {
				options: {
					sourceMap: true
				},
				files: [{
					expand: true,
					cwd: 'build/Global/JavaScript',
					src: '**/*.js',
					dest: 'build/Global/JavaScript',
					ext: '.min.js'
				}]
			},
			build: {
				options: {
					sourceMap: false
				},
				files: {
					'build/Global/JavaScript/tripfinder.js': ['build/Global/JavaScript/tripfinder.js']
				}
			}
		},
		cssmin: {
			target: {
				files: {
					'build/Global/css/tripfinder.css': ['build/Global/css/tripfinder.css'],
					'build/Global/css/tripfinderLogin.css': ['build/Global/css/tripfinderLogin.css']
				}
			}

		},
		jshint: {
			all: [
				'tripfinderweb/Global/JavaScript/**/*.js'
			],
			options: {
				//browser: true,
				//camelcase: true,
				//eqeqeq: true,
				//eqnull: true,
				//es5: true,
				//laxbreak: true, // Allow line breaking before && or ||
				//loopfunc: true,
				//newcap: true,
				//noarg: true,
				//onevar: true,
				//sub: true,
				//undef: true,
				//white: true,
				"globals": {
					"jQuery": false,
					"$": false,
					"ko": false,
					"moment": false,
					"Enumerable": false,
					"PubSub": false,
					"kendo": false,
					"google": false,
					"OpenLayers": false,
					"toastr": false,
					"i18n": false,
					"TF": false,
					"tf": false,
					"createNamespace": false,
					"isMobileDevice": false,
					"fullScreen": false,
					"pathCombine": false,
					"toISOStringWithoutTimeZone": false,
					"topicCombine": false,
				}
			}
		},

		watch: {
			options: {
				interval: 500
			},
			configFiles: {
				files: ['Gruntfile.js'],
				options: {
					reload: true
				}
			},
			js: {
				files: ['tripfinderweb/Global/**/*.js'],
				tasks: ['sync:js'],
				options: {
					livereload: 35731
				}
			},
			css: {
				files: ['tripfinderweb/Global/**/*.less'],
				tasks: ['less'],
				options: {
					livereload: 35731
				}
			},
			html: {
				files: ['tripfinderweb/**/*.html'],
				tasks: ['sync:html', 'sync:individual'],
				options: {
					livereload: 35731
				}
			}
		},

		useminPrepare: {
			html: 'tripfinderweb/index.html',
			options: {
				dest: 'build/',
				flow: {
					html: {
						steps: {
							js: ['concat'],
							jsUglify: ['concat', 'uglifyjs'],
							css: ['cssmin'],
							cssconcat: ['concat']
						},
						post: {}
					}
				}
			}
		},
		usemin: {
			html: 'build/index.html',
			options: {
				assetsDirs: [
					'build'
				],
				blockReplacements: {
					jsUglify: function(block)
					{
						return '<script src="' + block.dest + '"></script>';
					},
					cssconcat: function(block)
					{
						return '<link rel="stylesheet" href="' + block.dest + '">';
					}
				}
			}
		}
	});


	grunt.registerTask('default', 'debug');
	grunt.registerTask('debug', [
		'clean:main',
		'sync:resource',
		'sync:js',
		'sync:localization',
		'less',
		'sync:individual',
		'sync:html'
	]);


	grunt.registerTask('build', [
		'clean:main',
		'sync:resource',
		'sync:jsbuild',
		'sync:localization',
		'less:build',
		'sync:individual',
		'sync:html',
		'useminPrepare',
		'concat',
		'uglify:build',
		'cssmin',
		'usemin',
		'clean:tmp'
	]);

	grunt.registerTask('withoutmap', [
		'clean:withoutmap',
		'sync:resource',
		'sync:js',
		'sync:localization',
		'less',
		'sync:individual',
		'sync:html'
	]);
};