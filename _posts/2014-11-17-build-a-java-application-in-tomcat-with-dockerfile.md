---
layout: post
title: build a java application in tomcat 
date: 2014-11-17 19:40:00
category: dockerfile
---

## 流程

- 编写dockerfile
    + vim Dockerfile
    {% highlight js %}
    FROM 172.16.12.223:5000/tomcat7.0
    ADD v2.war /tomcat/webapps/
    EXPOSE 8080
    {% endhighlight %}
    + Dockerfile最好是每个工程一个单独的目录放Dockerfile
- 编译dockerfile
    + sudo docker build -t tomcat7.0/test-1 .
    + . 为dockerfile所在的目录路径
    + tomcat7.0/test-1 为build成功后存储的image名字
- 运行dockerfile
    + sudo docker run -it --rm -p 8080:8080 tomcat7.0/test-1
    + 上述启动后，rest接口功能正常，但是rpc的端口一直没有。端口映射问题！
- 正确：sudo docker run -it --rm -p 8080:8080 -p 9060:9060 tomcat7.0/test-1  

### 端口映射

#### sudo docker run -it --rm -p 8080:8080 -p 9060:9060 tomcat7.0/test-1  

本application中，有rest接口8080，也有rpc端口9060，因此两个端口均需要将其映射出来。

#### 提示：在registry.hub上，使用官网网站的image，然后使用dockerfile进行整合，每个images有tags信息以及information的使用方法。

## dockerfile与jenkins的集合

### jenkins的Docker Plugin

[docker plugin官网](https://wiki.jenkins-ci.org/display/JENKINS/Docker+Plugin) 关于插件的安装过程很详细。

#### Docker Environment

docker 宿主机允许jenkins主机连接，则需要开启TCP端口，在/etc/init/docker.conf或者/etc/init/docker.io.conf文件中设置以下配置：

    DOCKER_OPTS="-H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock"

阻碍：

    DockerPlugin的0.7版本只能Docker1.2之前的版本兼容，更1.3版本的docker不兼容。
    DockerPlugin的0.8版本需要jenkins的1.58以上的版本，jenkins需要升级。

jenkins升级且安装了DockerPlugin的0.8版本后，根据官网的步骤设置。大致分为：配置Docker的环境，tcp链接方式配置(修改配置需要重启Docker)。然后就是image中需要安装sshd以及jdk，然后就是image和job的配置。

##### 坑 One

配置以上的配置文件后，将docker进行kill掉(docker daemon会自动启动，这个在后面说).但是配置ms没有生效，netstat 没有2375端口监听。点击 jenkins中docker cloud中的test connection，显示ERROR。

解法：在 /etc/default/docker 文件中添加上述配置，关掉docker进程，当docker daemon再次启动时，可以看到端口 2375 在监听。点击test connection，显示正确的docker版本信息。DONE。

#### 创建jenkins以及images

跟着官网文档step by step即可

#### Configuration

##### Manage Jenkins -> Configure System

找到 Cloud 项，点击 "Add a new cloud",下拉框选择"Docker".然后在Docker URL中输入docker宿主机的地址以及docker daemon监听的端口。

Docker
- Docker URL：链接Docker Server API的url
- Connection Timeout：链接超时设置
- Read Timeout：读超时时间设置
- Container Cap：允许正在运行的最大数设置，空的话就是无限制

Image
- ID：image的tag名
- Labels：
- Credentials：
- Remote Filing System Root：
- Remote FS Root Mapping：
- Instance Cap
- DNS
- Port Bindings: 端口绑定
- Hostname：
- Idle termination time：
- JavaPath：
- JVM Options：
- Docker Command：
- LXC Conf Options：
- Volumes：
- Volumes From：
- Run container privileged：
- Prefix Start Slave Command：
- Suffix Start Slave Command：

Job Configuration(Docker Container)
- Commit on successful build:
- Additional tag to add
- Push on successful build
- Clean local images

#### images
需要在ID下面的Labels添加一个唯一的labels，在job的配置中，“additional tag to add” 添加运行的labels。

## deis

## fig

通過Dockerfile定義應用環境，並且可以隨時隨地的複製：

    FROM python:2.7
    ADD . /code
    WORKDIR /code
    RUN pip install -r requirements.txt

在fig.yml中定义组装应用的service，以至于他们可以在隔离的环境中run together。

    web:
      build: .
      command: python app.py
      links:
       - db
      ports:
       - "8000:8000"
    db:
      image: postgres

然后敲 fig up，Fig将启动并运行你的整个应用。

![figExample](/img/fig-example-large.gif)

更多的操作：

- 启动，停止和重新编译服务
- 查看运行中的服务状态
- 跟中运行中的服务的log输出
- 在一个服务中运行一次性操作

安装 docker，安装fig：

    curl -L https://github.com/docker/fig/releases/download/1.0.1/fig-`uname -s`-`uname -m` > /usr/local/bin/fig; chmod +x /usr/local/bin/fig

    fig --version

###  fig.yml文件

每个fig.yml中定义的服务，必须指定一个image或者build。其他的均为可选的，并且操作与docker run的对应操作参数时类似一致的。

当`docker run`时，`Dockerfile`中指定的选项(比如CMD、EXPOSE、VOLUME、ENV)是默认的，不需要再在fig.yml中指定。

#### images

tag或者image ID 的前四位。可以是本地的也可以是远程的。如果本地没有，则会pull。

    image: ubuntu
    image: orchardup/postgresql
    image: a4bc65fd

#### build

有`Dockerfile`的目录路径，Fig将编译以及用一个通用的name tag 编译后的image，在后面的过程中使用这个tag标识的image。

#### command

覆盖默认的操作。

    command: bundle exec thin -p 3000

#### links

链接其他服务的container。及指定两个服务的名字，也要指定ling alias(SERVICE:ALIAS).或者仅仅是服务的名字。

    links:
     - db
     - db:database
     - redis

有alias名字的目录将在container内部的/etc/hosts中产生：

    172.17.2.186  db
    172.17.2.186  database
    172.17.2.187  redis

#### 坏境变量

每个linked的container注入一系列环境变量，这些变量都以container的大写字母名字开头。

run `fig run SERVICE env`，哪些变量为可用的：

    name_PORT
    Full URL, e.g. DB_PORT=tcp://172.17.0.5:5432

    name_PORT_num_protocol
    Full URL, e.g. DB_PORT_5432_TCP=tcp://172.17.0.5:5432

    name_PORT_num_protocol_ADDR
    Container's IP address, e.g. DB_PORT_5432_TCP_ADDR=172.17.0.5

    name_PORT_num_protocol_PORT
    Exposed port number, e.g. DB_PORT_5432_TCP_PORT=5432

    name_PORT_num_protocol_PROTO
    Protocol (tcp or udp), e.g. DB_PORT_5432_TCP_PROTO=tcp

    name_NAME
    Fully qualified container name, e.g. DB_1_NAME=/myapp_web_1/myapp_db_1

#### ports 端口

端口暴露。要么指定`HOST：CONTAINER`，或者仅仅是container的端口(随机的)。

    ports:
     - "3000"
     - "8000:8000"
     - "49100:22"
     - "127.0.0.1:8001:8001"

#### expose

没有指定host机器的，仅仅是linked的服务可连接。仅仅内部端口可以被指定。

    expose:
     - "3000"
     - "8000"

#### volumes

挂载路径作为卷，选择性的指定主机的路径（HOST：CONTAINER），或者可访问的模式（HOST：CONTAINER：ro）。

volumes:
 - /var/lib/mysql
 - cache/:/tmp/cache
 - ~/configs:/etc/configs/:ro

#### volumes_from

从另一个服务或者CONTAINER中挂载所有的卷。

volumes_from:
 - service_name
 - container_name

#### environment

增加环境变量,可以是数组也可以是字典类型.

    environment:
      RACK_ENV: development
      SESSION_SECRET:

    environment:
      - RACK_ENV=development
      - SESSION_SECRET

#### net

网络模式。与docker client的--net 参数一样的作用.(网桥模式可以向外暴露独立的ip)

    net: "bridge"
    net: "none"
    net: "container:[name or id]"
    net: "host"

#### dns

用户DNS服务，可以使一条或者多条。

    dns: 8.8.8.8
    dns:
      - 8.8.8.8
      - 9.9.9.9

#### working_dir, entrypoint, user, hostname, domainname, mem_limit, privileged

与docker run中的参数一一对应，属性相同。

    working_dir: /code
    entrypoint: /code/entrypoint.sh
    user: postgresql

    hostname: foo
    domainname: foo.com

    mem_limit: 1000000000
    privileged: true

### CLI 参考

[CLI reference](http://www.fig.sh/cli.html)

## 将registry hub的常用images推到本地registry

##### tomcat
##### java
##### memcached
##### mongo
##### zookeeper？
