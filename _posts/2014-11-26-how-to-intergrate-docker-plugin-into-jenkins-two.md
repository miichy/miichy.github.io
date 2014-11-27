---
layout: post 
title:  docker与jenkins的集合之job配置
date: 2014-11-26 15:37:37 
category: 
---


##  jenkins的job 配置中，选项： Build/Publish Docker Container  与  Docker build and publish 的区别

Docker build publish plugin：Docker build publish Plugin 利用Dockerfile编译项目，然后发布生成的image到registry中（私有registry也可以）。

Build/Publish Docker Container : Docker build step plugin   在build的过程中，允许在job中加入docker的操作命令。

## 继上一篇的job  配置问题

本文想实现的job配置是将docker 机器的dockerfile编译成image并且上传到local registry上。最后在docker机器上run image，查看是否成功编译。(自动push完成后，运行image？)

#### Docker Container

- Restrict where this project can be run
    + Label Expression :  配置docker 的slave节点
- Add build step
    + Docker build and publish(不是Build/Publish Docker Container！)
    + Repository Name： 172.16.12.XXX:5000/dockerj
    + Tag :  test
    + Directory Dockerfile is in  /home/registry/dockerfileDir
- Add build step
    + Execute shell
    + 添加：docker run -it --rm -p 8080:8080 -p 9060:9060 172.16.12.223:5000/dockerj:test &







