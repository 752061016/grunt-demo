const sass = require('sass')
const loadGruntTasks = require('load-grunt-tasks')
const swig = require('swig')
const useref = require('useref')
const serveStatic = require('serve-static');

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
            src: ['dist','temp','htmllink']
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
        htmlmin: {
            options:{
                removeComments: true, //移除注释
                removeCommentsFromCDATA: true,//移除来自字符数据的注释
                collapseWhitespace: true,//无用空格
                collapseBooleanAttributes: true,//失败的布尔属性
                removeAttributeQuotes: true,//移除属性引号      有些属性不可移走引号
                removeRedundantAttributes: true,//移除多余的属性
                useShortDoctype: true,//使用短的跟元素
                removeEmptyAttributes: true,//移除空的属性
                removeOptionalTags: true,//移除可选附加标签
                minifyCSS: true, // 缩小样式元素和样式属性中的CSS
                minifyJS: true // 缩小脚本元素和事件属性中的JavaScript
            },
            dev: {                                       // Another target
                files: [{
                  expand: true,
                  cwd: 'htmlmin',
                  src: ['*.html'],
                  dest: 'dist'
              }]
            }
        },
        connect: {
            options: {
              port: 2080, //服务器的端口号，可用localhost:9000访问
              hostname: 'localhost', //服务器域名
              livereload: 35729, //声明给watch监听的端口
              base:['temp','.']
            },
            livereload: {
              options: {
                open: false, // 关闭自动开启浏览器

              }
            }
        },
        watch:{
            livereload: { //监听connect端口
                options: {
                  livereload: '<%= connect.options.livereload %>'
                },
                files: [
                  'temp/**'
                ]
            },
            css: {
                files: ['src/assets/styles/*.scss'],
                tasks: ['sass']
            },
            js: {
                files: ['src/assets/scripts/*.js'],
                tasks: ['babel']
            },
            html: {
                files: ['src/*.html'],
                tasks: ['pages']
            }
        },
        'gh-pages': {
            options: {
                base: 'dist'
            },
            src: '**/*'
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
    grunt.registerTask('htmllink',function () {
        const all = grunt.file.expand({cwd:'temp'},'*.html')
        let obj = {
            js:  {},
            css: {}
        }
        for (let i = 0; i < all.length; i++) {
            const {js,css} = getpages(all[i],'temp/')
            obj.js = Object.assign(obj.js,js)
            obj.css = Object.assign(obj.css,css)
        }
        grunt.config.set('uglify.jsmin', {
            files: obj.js
        })
        grunt.config.set('cssmin.cssmin', {
            files: obj.css
        })
    })
    function getpages(url,cd) {
        let inputHtml = grunt.file.read(cd+url)
        let result = useref(inputHtml)
        grunt.file.write(`htmlmin/${url}`,result[0])
        let obj = Object.assign({},result[1].css,result[1].js)
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
        return {js,css}
    }
    // grunt.registerTask('htmllink', function () {
    //     let inputHtml = grunt.file.read('temp/index.html')
    //     let result = useref(inputHtml)
    //     grunt.file.write('dist/index.html',result[0])
    //     let obj = Object.assign({},result[1].css,result[1].js)
    //     let js = {}
    //     let css = {}
    //     for (let key in obj) {
    //         let data = obj[key]
    //         key = key.startsWith('assets') ? `dist/${key}` : key
    //         let arr = data.assets.map(i => {
    //             let val = i.startsWith('assets') ? `temp/${i}` : i
    //             val = val.startsWith('/node_modules') ? `.${val}` : val
    //             return val
    //         })
    //         if (key.endsWith('.js')) {
    //             js[key] = arr
    //         }
    //         if (key.endsWith('.css')) {
    //             css[key] = arr
    //         }
    //     }
    //     console.log(js)
    //     grunt.config.set('uglify.jsmin', {
    //         files: js
    //     })
    //     grunt.config.set('cssmin.cssmin', {
    //         files: css
    //     })
    // })

    grunt.registerTask('compile', ['clean','sass','babel','pages'])

    grunt.registerTask('openServe', ['compile','connect','watch'])

    grunt.registerTask('build', ['compile','htmllink','uglify:jsmin','cssmin:cssmin','htmlmin'])
    
    grunt.registerTask('deploy', ['build','gh-pages'])
}