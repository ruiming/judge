global.Promise = require('bluebird')
const Docker = require('dockerode')
const config = require('../config')

const docker = new Docker({
    socketPath: '/var/run/docker.sock'
})

docker.createContainer = Promise.promisify(docker.createContainer)

// gcc 编译 c++ : gcc main.cpp -lstdc++ -o main
// 执行测试: ./main < test.txt
// 运行 Docker 测试: docker run -it -v /home/ruiming/Desktop:/data oj/cpp /bin/bash

// 启动容器 docker run -i -t ubuntu bash
// src: 用户代码名
async function run(src) {
    try {
        // 创建容器
        // Image: 已经 pull 的镜像
        // Binds: 挂载目录
        const container = await docker.createContainer({
            Image:        'oj/cpp',
            AttachStdin:  true,
            AttachStdout: true,
            AttachStderr: true,
            Tty:          true,
            Cmd:          ['/bin/bash'],
            Binds:        [`${config.SRC.CPP}:/data`]
        })
        container.start  = Promise.promisify(container.start)
        container.exec   = Promise.promisify(container.exec)
        container.stop   = Promise.promisify(container.stop)
        container.remove = Promise.promisify(container.remove)
        // 启动容器, 执行命令
        // FIXME g++ 编译??
        await container.start()
        const exec = await container.exec({
            /* eslint-disable */
            Cmd:          ["g++", "/data/2770.cpp", "-o", "/data/2770", "-v"],
            AttachStdin:  true,
            AttachStdout: true
            /* eslint-enable */
        })
        exec.start   = Promise.promisify(exec.start)
        exec.inspect = Promise.promisify(exec.inspect)
        const stream = await exec.start({
            stdin:  true,
            hijack: true,
            stdout: true,
            stderr: true
        })
        stream.setEncoding('utf8')
        stream.pipe(process.stdout)
        // 关闭容器
        await container.stop()
        await container.remove()
    } catch (e) {
        console.log(e)
    }
}

module.exports = run
