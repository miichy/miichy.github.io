---
layout: post 
title:  mongo replica set
date: 2014-12-25 10:16:36 
category: mongodb;replica set;
---


### 副本集设置



###  主节点负责读写

#### 读取备份节点需要设置“setSlaveOk”标识（连接中设置，不是在数据库中设置）

#### 自动故障转移（automatic failover）  主节点挂了，其中一个备份节点自动选为主节点

### docker 分享稿

#### docker常用的三个组件

为什么？ 快，小

三个组件：images、container、registry

images：模板
container：运行
registry：git hub类型


docker.png 图片

ubuntu系统上：

/var/lib/docker  目录内容多

docker images记录什么信息？

存放在 /var/lib/docker/graph/

    > json 保存着关于镜像的元数据
    > layer  文件夹，保存rootfs该容器的镜像(迁移至/var/lib/docker/aufs/mnt/CONTAINERID)
    > layersize 一个整数，表示layer的大小

#### docker daemon 和docker client

用户通过docker client与docker daemon通信，发送请求给后者。daemon有两部分：Server与Engine。Server用户通信部分，Engine用于执行接收到的请求。run，start，stop，rm等等。
docker client就是我们用到的docker run，info，inspect等等。

/etc/default/docker 文件:
三种方式： tcp://host:port, unix:///path/to/socket, fd://* 或fd://socketfd(-H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock" fd)

--insecure-registry dreg:5000   设置本地registry

docker run -d  已守护进行的形式运行

#### docker ubuntu bash实例以及nami-service实例



#### docker exec 命令  /var/lib/docker/aufs/mnt/

在运行中的容器内，运行一个新的操作。容器重启，该操作不会重启。docker exec这个操作仅仅当容器的主要进程 `PID 1`在运行时，才适用。如果容器paused，会等到容器unpaused再运行。

pause和stop的区别：
pause:用cgroups freezer 冻结(suspend)容器中的所有进程。`SIGSTOP`

stop：容器中的主要进程将接收`SIGTERM`，在宽限期后，`SIGKILL`.

    有两个信号可以停止进程:SIGTERM 和 SIGKILL。 SIGTERM比较友好，进程能捕捉这个信号， 根据您的需要来关闭程序。在关闭程序之前，您可以结束打开的记录文件和完成正在做的任务。 在某些情况下， 假如进程正在进行作业而且不能中断，那么进程可以忽略这个 SIGTERM信号。对于SIGKILL信号，进程是不能忽略的。

#### 其他

1，commit container 的时候，volume的内容不会复制到image中 
2，CMD与ENTRYPOINT区别：

实例：
####### CMD
CMD ["/bin/echo","this is a echo test"]

build后运行，`docker run XXX`,就输出:this is a echo test.

docker run命令会覆盖CMD的参数；比如`docker run -it ubuntu /bin/bash`中的`/bin/bash`会覆盖`/bin/echo "this is aecho test"`.

docker run XXX /bin/bash.则不会输出“this is a echo test”.

FROM ubuntu
CMD ["echo"]
docker run imagename echo hello
--> hello

####### ENTRYPOINT
ENTRYPOINT 让容器功能表现得想一个可执行的程序

ENTRYPOINT ["/bin/echo"]

build出来的容器就像一个/bin/echo 程序：比如build的镜像叫YYY
docker run -it YYY “this is a test”

就会输出“this is a test”字符串。

FROM ubuntu
ENTRYPOINT ["echo"]
docker run imagesname echo hello
--> echo hello

注意1：ENTRYPOINT的ENTRYPOINT command param1 param2 (shell form)模式会屏蔽掉docker run后面加的命令和CMD的参数

3，CMD和RUN的区别
RUN 在新的一层执行任何操作，这些操作的结果适用于下一层，并最终commit到结果image中。比如：需要创建一个已经安装了java和mysql的ubuntu 镜像，则可以以ubuntu为baseimages，然后使用RUN命令来安装java和mysql。
CMD 为正在执行的container提供默认值(main purpose is to provide defaults for an executing container)。比如：mysql的镜像，希望每次启动mysql的镜像时，service start的。

官方mysql的dockerfile：
{% highlight bash%}
    #
    # MySQL Dockerfile
    #
    # https://github.com/dockerfile/mysql
    #

    # Pull base image.
    FROM dockerfile/ubuntu

    # Install MySQL.
    RUN \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server && \
      rm -rf /var/lib/apt/lists/* && \
      sed -i 's/^\(bind-address\s.*\)/# \1/' /etc/mysql/my.cnf && \
      sed -i 's/^\(log_error\s.*\)/# \1/' /etc/mysql/my.cnf && \
      echo "mysqld_safe &" > /tmp/config && \
      echo "mysqladmin --silent --wait=30 ping || exit 1" >> /tmp/config && \
      echo "mysql -e 'GRANT ALL PRIVILEGES ON *.* TO \"root\"@\"%\" WITH GRANT OPTION;'" >> /tmp/config && \
      bash /tmp/config && \
      rm -f /tmp/config

    # Define mountable directories.
    VOLUME ["/etc/mysql", "/var/lib/mysql"]

    # Define working directory.
    WORKDIR /data

    # Define default command.
    CMD ["mysqld_safe"]

    # Expose ports.
    EXPOSE 3306
{% endhighlight%}

tomcat 官方文档
{% highlight bash%}
FROM java:7-jre

ENV CATALINA_HOME /usr/local/tomcat
ENV PATH $CATALINA_HOME/bin:$PATH
RUN mkdir -p "$CATALINA_HOME"
WORKDIR $CATALINA_HOME

# see https://www.apache.org/dist/tomcat/tomcat-8/KEYS
RUN gpg --keyserver pgp.mit.edu --recv-keys \
  05AB33110949707C93A279E3D3EFE6B686867BA6 \
  07E48665A34DCAFAE522E5E6266191C37C037D42 \
  47309207D818FFD8DCD3F83F1931D684307A10A5 \
  541FBE7D8F78B25E055DDEE13C370389288584E7 \
  61B832AC2F1C5A90F0F9B00A1C506407564C17A3 \
  79F7026C690BAA50B92CD8B66A3AD3F4F22C4FED \
  80FF76D88A969FE46108558A80B953A041E49465 \
  8B39757B1D8A994DF2433ED58B3A601F08C975E5 \
  A27677289986DB50844682F8ACB77FC2E86E29AC \
  A9C5DF4D22E99998D9875A5110C01C5A2F6059E7 \
  B3F49CD3B9BD2996DA90F817ED3873F5D3262722 \
  DCFD35E0BF8CA7344752DE8B6FB21E8933C60243 \
  F3A04C595DB5B6A5F1ECA43E3B7BBB100D811BBE \
  F7DA48BB64BCB84ECBA7EE6935CD23C10D498E23

ENV TOMCAT_MAJOR 6
ENV TOMCAT_VERSION 6.0.43
ENV TOMCAT_TGZ_URL https://www.apache.org/dist/tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz

RUN curl -SL "$TOMCAT_TGZ_URL" -o tomcat.tar.gz \
  && curl -SL "$TOMCAT_TGZ_URL.asc" -o tomcat.tar.gz.asc \
  && gpg --verify tomcat.tar.gz.asc \
  && tar -xvf tomcat.tar.gz --strip-components=1 \
  && rm bin/*.bat \
  && rm tomcat.tar.gz*

EXPOSE 8080
CMD ["catalina.sh", "run"]
{% endhighlight %}

4，docker attach CONTAINER

(lets you view or interact with any running container's primary process)

5，docker exec

Examples

    $ sudo docker run --name ubuntu_bash --rm -i -t ubuntu bash

This will create a container named ubuntu_bash and start a Bash session.

    $ sudo docker exec -d ubuntu_bash touch /tmp/execWorks

This will create a new file /tmp/execWorks inside the running container ubuntu_bash, in the background.

    $ sudo docker exec -it ubuntu_bash bash

This will create a new Bash session in the container ubuntu_bash.

6，volume保存config.json信息，vfs是真正volume的内容

7,VOLUME vs -v

`-v`:将挂载宿主机上的文件到container中；VOLUME则在宿主机上创建一个新的空的挂载文件,然后将将挂载到container中。

container之间共同share一个挂载文件则可以通过`--volumes-from`操作。


8，脚本运行生成mysql

~/liumq/test.sql

    create database docker_test;
    use docker_test;
    create table app_info(name varchar(20));

mysql < ~/liumq/test.sql

进入mysql >,show database 可以看到docker_test已经创建。

在dockerfile添加该功能？

dockerfile中如何设置mysql特定的 -u -p

进入 mysql：docker run -i -t --name mysql -e MYSQL_ROOT_PASSWORD=nami -p 3307:3306 mysql_1231:0.0.1 /bin/bash
用：mysql -uroot -pnami -h172.17.42.1 -P3306   进入mysql命令


http://stackoverflow.com/questions/25920029/setting-up-mysql-and-importing-dump-within-dockerfile


9.总结

docker中永久性的数据只能通过volume或者ADD/COPY到image中，尝试的在dockerfile增加运行数据脚本行不通。
