---
layout: post
title:  "Dockerfile学习"
date:   2014-11-11 21:36:00
categories: dockerfile
---

## Dockerfile

### single sample

vim Dockerfile

	RUN echo "I am running dockerfile"

sudo docker build .

OUTPUT:

    Sending build context to Docker daemon  2.56 kB
    Sending build context to Docker daemon 
    Step 0 : RUN echo "download"
    2014/11/12 16:19:22 Please provide a source image with `from` prior to run

从本地registry获取image：

vim Dockerfile

    # Version :0.0.1
    FROM 172.16.12.223:5000/test
    RUN echo "download"

OUTPUT：

    Sending build context to Docker daemon  2.56 kB
    Sending build context to Docker daemon 
    Step 0 : FROM 172.16.12.223:5000/test
    Pulling repository 172.16.12.223:5000/test
    826544226fdc: Download complete 
    511136ea3c5a: Download complete 
    b3553b91f79f: Download complete 
    ca63a3899a99: Download complete 
    ff01d67c9471: Download complete 
    7428bd008763: Download complete 
    c7c7108e0ad8: Download complete 
    Status: Downloaded newer image for 172.16.12.223:5000/test:latest
     ---> 826544226fdc
    Step 1 : RUN echo "download"
     ---> Running in e4af2f219841
    download
     ---> 505895dd33db
    Removing intermediate container e4af2f219841
    Successfully built **505895dd33db**

然后执行：sudo docker images

    XXX@XXX:/home/registry/dockerfile-dir$ sudo docker images
    REPOSITORY  TAG         IMAGE ID      CREATED            VIRTUAL SIZE
    <none>      <none>  **505895dd33db**  4 minutes ago       194.2 MB

删掉\<none\>的image ： sudo docker rmi 5058

    没有指定build的image的存储名称和目录

### Reference

#### 用途（Usage）

从资源库中创建image，在根目录创建描述文件‘Dockerfile’，该文件秒速组装image的步骤。然后执行 docker build 命令，且增加根目录参数，上述的例子中为：

    sudo docker build .

这个 build 命令被Docker daemon运行，而不是CLI(client)，所以文件中的上下文被交给daemon执行。当上下文被sent到daemon时，Docker client打印 "Sending build context to Docker Daemon"。

    如果用/ 作为目录路径，则所有的根目录下的文件都会被sent to daemon。所以不要这样做！

最好一个目录创建一个dockerfile。如何需要屏蔽某些dockerfile文件，则在相同的目录下增加 .dockerignore 文件。

可以指定新的image存放在哪里：

    $sudo docker build -t shykes/myapp .

在最终输出新image的ID之前，docker daemon会自动将接收到的上下文给清除干净。

每一个指令都是独立运行的，会导致新的image生成。所以 RUN cd /tmp 将不会对下一步产生任何影响。

在可能的情况下，docker会从用中间images，极大的加快 build 过程(使用cache 参数).更多信息[参考](http://docs.docker.com/articles/dockerfile_best-practices/)

build完成后，还可以push到registry上。[参考](https://docs.docker.com/userguide/dockerrepos/#image-push)

#### 格式(Format)

格式如下 Dockerfile ：

    #Comment
    指令   参数

这个指令是不区分大小写的，但是最好都是用大写以与参数区分。

docker顺序运行dockerfile中的指令。为了指定正在build的基本image，第一个指令必须是'FROM'。

\# 为注释信息，\# 标记在行之间的话，将被作为一个参数。 比如：

    # Comment
    RUN echo 'we are running some # of cool things' 

#### 环境置换

环境变量使用 ENV 表示。\# 表示解析后的情况

    FROM busybox
    ENV foo /bar
    WORKDIR ${foo}   # WORKDIR /bar
    ADD . $foo       # ADD . /bar
    COPY \$foo /quux # COPY $foo /quux

在dockerfile中，处理环境变量的指令有以下：

- ENV
- ADD
- COPY
- WORKDIR
- EXPOSE
- VOLUME
- USER

ONBUILD 指令不支持环境置换。

#### .dockerignore 文件

感觉跟 .gitignore的用法和作用是一致的。文件路劲匹配的[原则GoLang](http://golang.org/pkg/path/filepath#Match).自备楼梯。

例子：包含.git目录的.dockerignore文件，在上传上下文的大小可以看出区别：

    $ sudo docker build .
    Uploading context 18.829 MB
    Uploading context
    Step 0 : FROM busybox
     ---> 769b9341d937
    Step 1 : CMD echo Hello World
     ---> Using cache
     ---> 99cc1ad10469
    Successfully built 99cc1ad10469
    $ echo ".git" > .dockerignore
    $ sudo docker build .
    Uploading context  6.76 MB
    Uploading context
    Step 0 : FROM busybox
     ---> 769b9341d937
    Step 1 : CMD echo Hello World
     ---> Using cache
     ---> 99cc1ad10469
    Successfully built 99cc1ad10469

#### From

    FROM <image>
或者
    
    FROM <image>:<tag>
FROM 指令为后续的指令指定基础image。一个有效的Dockerfile必须在第一个指令中声明FROM指令。这个image可以是共有库的，也可以是自己搭建的私有库的。如文章一开始所示的实例中。

FROM 必须是第一个非注释信息的指令。

在一个dockerfile中，FROM可以出现很多次，以创建复杂的images。在每一个新的FROM指令之前，仅仅最后一个image的ID会打印出来。

如果没有tag在FROM的指令参数中时，latest是默认的。如果tag不存在，则也会出错。

#### MAINTAINER

    MAINTAINER <name>
MAINTAINER指令允许用户设置生成的image的作者信息。

#### RUN

RUN有两种形式：

- RUN <command> (shell 模式)
- RUN ["executable","param1","param2"]  (执行模式)

RUN指令将在最顶上的现有image上 执行操作，然后提交结果。提交的结果将被使用于下一步。

分层的RUN指令和生成的commit结果符合Docker的核心概念- 提交很容易，容器可以在image的过程历史中的任何一时间点创建。

执行形式可以避免shell字符串，基础image 运行RUN 操作不包含 /bin/sh.

    不使用/bin/sh ，用执行模式传递需要执行的shell命令。 RUN ["/bin/bash","-c","echo hello"]

    执行模式当做JSON格式被传送，所以必须用双""而不是单引号

    执行模式不调用command shell。这意味着正常的shell进行不会发生。比如 RUN ["echo","$HOME"] 将不会得到$HOME代替的变量。如果想要得到$HOME变量，RUN ["sh","-c","echo","$HOME"]

RUN指令的缓存在下一次build时，不会自动失效。像RUN apt-get dist-upgrade -y 指令的缓存将在下一次build时，再被利用。RUN指令的缓存在用 --no-cache flag时，会时期cache失效， docker build --no-cache 。[更多详情](https://docs.docker.com/articles/dockerfile_best-practices/#build-cache)

RUN指令的缓存可以通过ADD指令被失效。见下面的细节。

##### 已知问题(RUN)

    [Issue 783](https://github.com/docker/docker/issues/783) 使用AUFS文件系统时出现的问题。

#### CMD

CMD 指令有三种形式：
    
- CMD ["executable","param1","param2"]   (执行模式)
- CMD ["param1","param2"]   (默认参数ENTRYPOINT)
- CMD command param1 param2   (shell模式)

dockerfile中仅仅只能有一个CMD，如果有多个，仅最后一个生效。

CMD的主要目的是为正在执行的容器提供默认值。这些默认值可以包含可执行的，或者省略可执行的，这样的情况下，你必须同事制定ENTRYPOINT指令。

    如果CMD被用来为ENTRYPOINT指令提供默认值，那么CMD和ENTRYPOINT指令都必须被制定成JSON格式

    执行模式是解析为JSON格式，同样的双引号而非单引号。

    执行模式不调用command shell。这意味着正常的shell进行不会发生。比如 RUN ["echo","$HOME"] 将不会得到$HOME代替的变量。如果想要得到$HOME变量，RUN ["sh","-c","echo","$HOME"]

当使用shell或者执行形式时，当image正在运行时，CMD指令将操作设置为可执行的。

如果使用shell形式的CMD，则<command> 将在 /bin/sh -c中执行。

    FROM ubuntu
    CMD echo "This is a test" | wc -

如果你想在shell之外，运行你的<command>，那么你必须使用JSON格式表示command操作，给出一个完整的可执行目录。这种数组格式是CMD指令的首选模式。任何多余的参数都被当做数组中的一个字符串：

    FROM ubuntu
    CMD ["/usr/bin/wc","--help"]

如果希望容器每次运行同样的执行，则可以使用ENTRYPOINT与CMD指令结合。[ENTRYPOINT](https://docs.docker.com/reference/builder/#entrypoint)

如果用户指定参数到docker run ，则将覆盖CMD默认的指定。

    不要讲RUN和CMD搞混了，RUN实际上是运行操作和提交结果；CMD在build过程中部执行任何事情，但是指定image的预期命令。

#### EXPOSE

    EXPOSE <port> [<port> ...]

EXPOSE指令通知Docker，容器将监听指定的网络端口。Docker通过这个信息使用链接互连容器。EXPOSE仅仅在容器之间的链接才有用。这不是是主机的可链接端口。公开主机对外的端口使用 -p 标识.[参见](https://docs.docker.com/userguide/dockerlinks)

#### ENV

    ENV <key> <value>

ENV指令设置环境变量<key>,赋值<value>.该值将传给将使用到的RUN指令。这等价于在操作前，增加<key>=<value>的前缀。

当容器从一个结果image运行时，用ENV设置环境变量将一直有效。使用docker inspect 可以查看这些变量，使用docker run --env <key>=<value> 来改变变量值。

    可以引起意料之外的结果的例子是，设置ENV DEBIAN_FRONTEND noninteractive。当容器在交互运行时，将会持续，docker run -t -i image bash

#### ADD

    ADD <src> ... <dest>

ADD 指令复制新的文件、目录或者远程的url文件到容器的文件系统，从<src>目录，将其加到<dest> 目录。

多资源的<src>资源将被指定，但是如果是文件或者目录，则必须与正在创建的源资源目录相关。

实例：
    
    ADD hom* /mydir/        # adds all files starting with "hom"
    ADD hom?.txt /mydir/    # ? is replaced with any single character

#### TODO

#### COPY

#### ENTRYPOINT

ENTRYPOINT有两种形式：

    ENTRYPOINT ["executable","param1","param2"]
    ENTRYPOINT command param1 param2

ENTRYPOINT 允许你配置容器，容器可以将可执行程序一样运行。比如，下面的命令可以以默认的内容(监听80端口)启动nginx：

    docker run -i -t --rm -p 80:80 nginx




#### VOLUME

    VOLUME ["/data"]
VOLUME 指令将欧诺个指定的名字创建一个mount point，使其从本地主机或其他容器掌握外部安装卷(mounted volumes)。该值也是JSON格式，VOLUME ["/var/log"] ，或者 VOLUME /var/long 或者 VOLUME /var/log /var/db。[更多详情](https://docs.docker.com/userguide/dockervolumes/#volume-def)

#### USER

    USER daemon

USER指令在image运行时，针对dockerfile中的任何RUN，CMD和ENTRYPOINT指令设置用户名字或者UID。

#### WORKDIR

    WORKDIR /path/to/workdir

#### ONBUILD

    ONBUILD [INSTRUCTION]

#### Dockerfile Example

    # Nginx
    #
    # VERSION               0.0.1

    FROM      ubuntu
    MAINTAINER Victor Vieux <victor@docker.com>

    RUN apt-get update && apt-get install -y inotify-tools nginx apache2 openssh-server

    # Firefox over VNC
    #
    # VERSION               0.3

    FROM ubuntu

    # Install vnc, xvfb in order to create a 'fake' display and firefox
    RUN apt-get update && apt-get install -y x11vnc xvfb firefox
    RUN mkdir ~/.vnc
    # Setup a password
    RUN x11vnc -storepasswd 1234 ~/.vnc/passwd
    # Autostart firefox (might not be the best way, but it does the trick)
    RUN bash -c 'echo "firefox" >> /.bashrc'

    EXPOSE 5900
    CMD    ["x11vnc", "-forever", "-usepw", "-create"]

    # Multiple images example
    #
    # VERSION               0.1

    FROM ubuntu
    RUN echo foo > bar
    # Will output something like ===> 907ad6c2736f

    FROM ubuntu
    RUN echo moo > oink
    # Will output something like ===> 695d7793cbe4

    # You᾿ll now have two images, 907ad6c2736f with /bar, and 695d7793cbe4 with
    # /oink.




