---
layout: post 
title:  thrift service link the mysql in docker container
date: 2014-12-11 21:10:23 
category: docker container
---

##  mysql与thrift 服务之间

### mysql 

启动：
	
	docker run --name nami -e MYSQL_ROOT_PASSWORD=nami -p 3306:3306 -v /home/fun/sql/:/var/lib/mysql -d mysql:5.5

写到Dockerfile中：

    FROM mysql
    VOLUME "/home/fun/sql" "/var/lib/mysql"
    EXPOSE 3306

### thrift 服务

    docker run -d -p 9527:9527 --link nami:mysql 172.16.12.223:5000/namiservice:0.0.1 

### jenkins部署说明

#### 构建war包

- 构建war包
- cp war到Dockerfile目录
- war中的替换文件：
    + ip改成 mysql
    + 用户名和密码：root 和 nami(mysql启动时设定的)

#### 构建thrift服务的dockerfile

启动时，加入 --link  ，命令行参考上面启动thrift服务。