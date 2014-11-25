---
layout: post 
title:  如何配置docker-plugin
date: 2014-11-25 19:03:02 
category: 
---

##  Docker Plugin插件

[官方链接](https://wiki.jenkins-ci.org/display/JENKINS/Docker+Plugin?showComments=true&showCommentArea=true#addcomment)

使用docker主机动态的管理奴隶节点，运行build，然后关掉奴隶节点。

## 环境简介

例如：
docker以及docker reigstry的地址 ： 172.16.12.23
jenkins的机器：172.16.12.7

## 步骤

### docker的主机(23)搭建docker以及docker registry。

在`/etc/default/docker`文件中增加：`DOCKER_OPTS="-H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock"`

### 配置 docker cloud

jenkins的`configure system`中，添加docker cloud，按照官网的配置，test connection通过即可。

### 配置docker slave

![docker slave ](/img/2014-11-25-docker-slave.png)

docker机器上比如装有ssh以及java和可以登录的账号以及密码。

laucher docker slave，测试奴隶节点是否连接成功。

### 配置 job

![docker job ](/img/2014-11-25-docker-job.jpg)

build信息保存在docker主机的`/home/jenkins/var/workspace/docker-build-test`目录下。

#### TODO:如何配置job参数达到个性化功能？？？
