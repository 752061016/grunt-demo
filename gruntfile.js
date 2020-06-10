// 实现这个项目的构建任务

const sass = require('sass')
const loadGruntTasks = require('load-grunt-tasks')

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
        clean : {
            build : [config.build.temp, config.build.dist],
            release : ['release']
        },
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
        }
    })

    // 自动加载所有的 grout 插件
    loadGruntTasks(grunt) 
}