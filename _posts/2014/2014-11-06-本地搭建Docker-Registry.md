---
layout: post
title:  "本地搭建Docker－registry"
date:   2014-11-06 13:24:00
categories: docker-registry
---

# 本地搭建Docker-Registry

## 获取 docker pull registry:latest

mkdir /home/registry  /home/registry/conf /home/registry/data

vim /home/registry/conf/config.yml

内容为：
common:
    loglevel: info
    secret_key: _env:SECRET_KEY
dev:
    storage: local
    storage_path: /registry-data

## 运行：
docker run \
-d -p 0.0.0.0:33307:22 \
-p 0.0.0.0:5000:5000 \
-v /opt/docker-image:/opt/docker-image \
-e SQLALCHEMY_INDEX_DATABASE:sqlite:////opt/docker-image/docker-registry.db \
-e STORAGE_PATH=/opt/docker-image \
registry

通过-v /opt/docker-image命令将本地的目录/opt/docker-image绑定到container的/opt目录。并通过-e DOCKER_REGISTRY_CONFIG=/opt/registry-config/config.yml设置container的环境变量。如果不设置，则默认使用config_sample.yml

## 将已有的image推到自己的registry中：

	先docker images  查看本地的image
	docker tag IMAGE ID  myregirepo
	docker images // 多了一个myregirepo
	docker push myregirepo

	在/opt/docker-image/repositories/library  //该目录为上述命令中的目录路径

搜索registry上的image：

    curl -XGET http://0.0.0.0:5000/v1/search?q=centos

    0.0.0.0:5000/v1/search
    展示registry上的所有的libs

## config_sample.yml配置

registry 启动时，会根据config_sample.yml配置来启动。

    common：基础配置
    local: 本地的存储数据路径
    s3：存储数据在AW3 S3 中
    ceph-s3:
    azureblob:
    dev:
    test:
    prod:
    gcs:
    swift:
    glance:
    glance-swift:
    elliptics:

config_sample.yml

    loglevel:日志级别
    storage_redirect：重置资源请求

[links1](http://blog.csdn.net/yfqnihao?viewmode=contents)

[link2](http://lavasoft.blog.51cto.com/62575/27069)
