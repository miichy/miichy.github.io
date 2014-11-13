---
layout: post
title:  "本地搭建docker registry"
date:   2014-11-11 21:36:00
categories: docker registry
---

* docker-registry本地搭建
** 步骤
*** 初始状态：docker已安装
*** 创建目录
**** /home/registry
**** /home/registry/conf 配置文件目录
**** /home/registry/docker-image  image本地存放目录
*** 增加fun用户的docker目录权限 (chown -R fun.fun /home/registry)
*** 安装docker registry
**** sudo docker pull registry:latest（比较快，安装成功后进行下一步）
**** sudo cp /var/lib/docker/aufs/diff/2a6d40e2d8fed32f863f00e096035e611547a9c0ed25db17947b7741c58508da/docker-registry/config/config_sample.yml /home/registry/conf/  (拷贝config文件)
**** 修改config_sample.yml文件：
***** 配置sqlite数据库位置：sqlalchemy_index_database: _env:SQLALCHEMY_INDEX_DATABASE:sqlite://///home/registry/docker-image/docker-registry.db
***** 配置本地存储位置
****** local: &local
****** storage: local
****** storage_path: _env:STORAGE_PATH:/home/registry/docker-image
***** 启动registry
****** sudo docker run -p 0.0.0.0:5000:5000 -v /home/registry/docker-image:/opt/docker-image registry
****** 报错：Workers failed to boot.(安装网上说的python相应的依赖，错误同样存在)
**** 解法：修改config.yml配置(https://github.com/bacongobbler/deis/commit/9bf5e8e5a5b3ced96e625b2a516ac212a1c9d5ff)
*****        cache:
*****  -        host: {{ .deis_cache_host }}
*****  -        port: {{ .deis_cache_port }}
*****  +        host: {{ or (.deis_cache_host) "~" }}
*****  +        port: {{ or (.deis_cache_port) "~" }}
*****           password: _env:CACHE_REDIS_PASSWORD
*****           db: 1
**** 再次启动registry：sudo docker run -p 0.0.0.0:5000:5000 -v /home/registry/docker-image:/opt/docker-image registry  
**** !2014-11-11-docker.jpg!
*** 后台启动registry：sudo docker run -d -p 0.0.0.0:33307:22 -p 0.0.0.0:5000:5000 -v /home/registry/docker-image:/opt/docker-image registry
*** DONE

** 其他操作
*** 展示registry所有的repo：http://0.0.0.0:5000/v1/search
*** 将本地image push到registry中：
**** docker images 查看本地images
**** docker tag IMAGE_ID newRepoName（sudo docker tag e2c2 0.0.0.0:5000/tomcat7.0）
**** docker iamges //多一个 newRepoName的images
**** docker push newRepoName （sudo docker push 0.0.0.0:5000/tomcat7.0）

** TODO
*** 安装nginx(域名个性化)
*** 更多操作参考官网
*** docker file
*** jenkins的docker插件整合


** Please login prior to push：chateldon  *******  59*******7.qq.com

** **注意**：启动 - sudo docker run -d -p 0.0.0.0:33307:22 -p 0.0.0.0:5000:5000 -v /home/registry/docker-image:/opt/docker-image -e STORAGE_PATH=/opt/docker-image registry

    STORAGE_PATH=/opt/docker-image  ：image存放在docker container 中的/opt/docker-image目录；

    -v /home/registry/docker-image:/opt/docker-image  ： 将container中的/opt/docker-image目录中的内容存在docker host file system[运行docker registry服务器]中/home/registry/docker-image目录中
