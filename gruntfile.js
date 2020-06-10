const sass = require('sass')
const loadGruntTasks = require('load-grunt-tasks')
const swig = require('swig')
const useref = require('useref')


// 默认文件路径配置
let config = {
    build: {
        src: 'src',
        dist: 'dist',
        temp: 'temp',
        public: 'public',
        paths: {
            styles: 'assets/styles/*.scss',
            scripts: 'assets/scripts/*.js',
            pages: '*.html',
            images: 'assets/images/**',
            fonts: 'assets/fonts/**'
        }
    }
}

module.exports = grunt => {
    grunt.initConfig({
        sass: {
            options: {
                implementation: sass,
                sourceMap: true
            },
            main: {
                files: [{
                    expand: true,
                    cwd: `${config.build.src}/`,
                    src: config.build.paths.styles,
                    dest: `${config.build.temp}/`,
                    ext: '.css'
                }]
            }
        },
        babel: {
            options: {
                presets: ['@babel/preset-env']
            },
            main: {
                files: [{
                    expand: true,
                    cwd: `${config.build.src}/`,
                    src: config.build.paths.scripts,
                    dest: `${config.build.temp}/`,
                    ext: '.js'
                }]
            }
        },
        pages:{
            index: {
                input: 'src/index.html',
                output: 'temp/index.html'
            },
            about: {
                input: 'src/about.html',
                output: 'temp/about.html'
            }
        },
        clean: {
            src: ['dist','temp']
        },
        watch: {
            js: {
                files: ['src/assets/scripts/*.js'],
                tasks: ['babel']
            },
            css: {
                files: ['src/assets/styles/*.scss'],
                tasks: ['sass']
            },
            page: {
                files: ['src/*.html'],
                tasks: ['pages']
            }
        },
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.{png,jpg,jpeg,ttf,svg,woff,eot}'],
                    dest: 'dist/'
                }]
            }
        },
        concat: {
            options:{
                //文件内容的分隔符
                separator: ';',
                stripBanners: true
            },
            css: {
                src: ['/node_modules/jquery/dist/jquery.js',
                '/node_modules/popper.js/dist/umd/popper.js',
                '/node_modules/bootstrap/dist/js/bootstrap.js'],
                dest: 'dist/vor.js'
            }
        },
        uglify: {
            options:{
                sourceMap: false,
                stripBanners: true,
            }
        },
        cssmin: {

        },
        connect: {
            server: {
                options: {
                    port: 2080,
                    base: ['temp','.']
                }
            }
        },
        watch:{
            css: {
                options: {
                    livereload: true
                },
                files: ['temp/**/*.css']
            },
            js: {
                options: {
                    livereload: true
                },
                files: ['temp/**/*.js']
            }
        }
    })

    grunt.registerMultiTask('pages', function () {
        let tpl = swig.compileFile(this.data.input);
        const {data} = require('./pages.config.js')
        let renderedHtml = tpl(data);
        grunt.file.write(this.data.output,renderedHtml)
    })
    

    // 自动加载所有的 grout 插件
    loadGruntTasks(grunt) 

    grunt.registerTask('htmllink', function () {
        let inputHtml = grunt.file.read('temp/index.html')
        let result = useref(inputHtml)
        grunt.file.write('dist/index.html',result[0])
        let obj = Object.assign({},result[1].css,result[1].js)
        console.log(obj)
        
        let js = {}
        let css = {}
        for (let key in obj) {
            let data = obj[key]
            key = key.startsWith('assets') ? `dist/${key}` : key
            let arr = data.assets.map(i => {
                let val = i.startsWith('assets') ? `temp/${i}` : i
                val = val.startsWith('/node_modules') ? `.${val}` : val
                return val
            })
            if (key.endsWith('.js')) {
                js[key] = arr
            }
            if (key.endsWith('.css')) {
                css[key] = arr
            }
        }
        console.log(js)
        grunt.config.set('uglify.jsmin', {
            files: js
        })
        grunt.config.set('cssmin.cssmin', {
            files: css
        })
    })

    grunt.registerTask('compile', ['sass','babel','pages'])
    grunt.registerTask('build', ['htmllink','uglify:jsmin','cssmin:cssmin'])
    grunt.registerTask('srver', ['connect','watch'])
}