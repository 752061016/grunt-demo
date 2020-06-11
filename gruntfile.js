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
        htmlmin: 'htmlmin', // 保存压缩的html文件
        paths: {
            styles: 'assets/styles/*.scss',
            scripts: 'assets/scripts/*.js',
            pages: '*.html',
            images: 'assets/images/*',
            fonts: 'assets/fonts/*'
        }
    }
}

module.exports = grunt => {
    grunt.initConfig({
        // 使用 grunt-sass 编译 scss 文件保存在 temp 文件夹
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
        // 使用 grunt-babel 编译js文件，
        // 使用 @babel/core 和 @babel/preset-env 插件转换js新特性
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
            src: [config.build.dist,config.build.temp,config.build.htmlmin,'.grunt']
        },
        imagemin: {
            image: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: config.build.src,
                    src: [config.build.paths.images],
                    dest: config.build.dist
                }]
            },
            font: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: config.build.src,
                    src: [config.build.paths.fonts],
                    dest: config.build.dist
                }]
            }
        },
        // 使用 grunt-contrib-copy 插件复制 public 文件夹中的静态文件
        copy: {
            public: {
                files:[{
                    expand: true,
                    src: ['**'],
                    cwd: 'public',
                    dest: 'dist'
                }]
            }
        },
        'font-spider': {
            options: {},
            main: {
                src: 'temp/*.html',
                dest: 'dist'
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
                  cwd: config.build.htmlmin,
                  src: [config.build.paths.pages],
                  dest: config.build.dist
              }]
            }
        },
        connect: {
            options: {
              port: 2080, //服务器的端口号，可用localhost:9000访问
              hostname: 'localhost', //服务器域名
              livereload: 35729, //声明给watch监听的端口
              
            },
            livereload: {
              options: {
                open: false, // 关闭自动开启浏览器

              }
            },
            temp: {
                options: {
                    base:[config.build.temp,'.']
                }
            },
            dist: {
                options: {
                    base:[config.build.dist,'.']
                }
            }
        },
        watch:{
            livereload: { //监听connect端口
                options: {
                  livereload: '<%= connect.options.livereload %>'
                },
                files: [
                  `${config.build.temp}/**`
                ]
            },
            css: {
                options:{cwd: config.build.src},
                files: [config.build.paths.styles],
                tasks: ['sass']
            },
            js: {
                options:{cwd: config.build.src},
                files: [config.build.paths.scripts],
                tasks: ['babel']
            },
            html: {
                options:{cwd: config.build.src},
                files: [config.build.paths.pages],
                tasks: ['pages']
            }
        },
        'gh-pages': {
            options: {
                base: config.build.dist
            },
            src: '**/*'
        }
    })
    grunt.registerTask('pages', function () {
        // 遍历 src 文件夹下符合条件的 html 文件，输出文件路径
        const pages = grunt.file.expand({cwd:'src'},'*.html')
        // 根据文件路径读取文件并使用 swig 插件编译后存入 temp 文件夹
        pages.forEach(page => {
            let tpl = swig.compileFile(`${config.build.src}/${page}`);
            const {data} = require('./pages.config.js')
            let renderedHtml = tpl(data);
            grunt.file.write(`${config.build.temp}/${page}`,renderedHtml)
        });
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

    // 编译文件： 先删除临时文件， 再编译 scss、js、html 文件
    grunt.registerTask('compile', ['clean','sass','babel','pages'])

    // 开发时开启服务器： 先编译文件，打开服务器再打开文件监听
    grunt.registerTask('openServe', ['compile','connect:temp','watch'])

    // 上线前压缩： 执行顺序：编译文件 -> 编译html引用 -> 合成html引用的css、js文件并压缩 -> 压缩图片和字体文件 -> 复制静态文件 -> 压缩html文件
    grunt.registerTask('build', ['compile','htmllink','uglify:jsmin','cssmin:cssmin','imagemin','copy:public','htmlmin'])
    
    // 部署：操作完 build 后部署到 github 上
    grunt.registerTask('deploy', ['build','gh-pages'])
}