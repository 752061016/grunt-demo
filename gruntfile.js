const sass = require('sass')
const loadGruntTasks = require('load-grunt-tasks')
const swig = require('swig')
var useref = require('useref');

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
                    src: ['**/*.{png,jpg,jpeg}'],
                    dest: 'temp/'
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
                src: ['/node_modules/bootstrap/dist/css/bootstrap.css'],
                dest: 'dist/assets/styles/vendor.css'
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
        for (const key in obj) {
            if (obj[key]) {
                
            }
        }
        // result[1].forEach(element => {
            
        // });
    })

    grunt.registerTask('compile', ['sass','babel','pages'])
}