---
layout: post 
title:  Docker run reference
date: 2014-11-27 14:48:27 
category: docker
---

## Docker run reference

### 通用形式

	docker run [OPTIONS] IMAGE[:TAG] [COMMAND] [ARG...]

    Run a command in a new container:
      -a, --attach=[]            Attach to STDIN, STDOUT or STDERR.
      --add-host=[]              Add a custom host-to-IP mapping (host:ip)
      -c, --cpu-shares=0         CPU shares (relative weight)
      --cap-add=[]               Add Linux capabilities
      --cap-drop=[]              Drop Linux capabilities
      --cidfile=""               Write the container ID to the file
      --cpuset=""                CPUs in which to allow execution (0-3, 0,1)
      -d, --detach=false         Detached mode: run the container in the background and print the new container ID
      --device=[]                Add a host device to the container (e.g. --device=/dev/sdc:/dev/xvdc:rwm)
      --dns=[]                   Set custom DNS servers
      --dns-search=[]            Set custom DNS search domains (Use --dns-search=. if you don't wish to set the search domain)
      -e, --env=[]               Set environment variables
      --entrypoint=""            Overwrite the default ENTRYPOINT of the image
      --env-file=[]              Read in a line delimited file of environment variables
      --expose=[]                Expose a port from the container without publishing it to your host
      -h, --hostname=""          Container host name
      -i, --interactive=false    Keep STDIN open even if not attached
      --link=[]                  Add link to another container in the form of name:alias
      --lxc-conf=[]              (lxc exec-driver only) Add custom lxc options --lxc-conf="lxc.cgroup.cpuset.cpus = 0,1"
      -m, --memory=""            Memory limit (format: <number><optional unit>, where unit = b, k, m or g)
      --name=""                  Assign a name to the container
      --net="bridge"             Set the Network mode for the container
                                   'bridge': creates a new network stack for the container on the docker bridge
                                   'none': no networking for this container
                                   'container:<name|id>': reuses another container network stack
                                   'host': use the host network stack inside the container.  Note: the host mode gives the container full access to local system services such as D-bus and is therefore considered insecure.
      -P, --publish-all=false    Publish all exposed ports to the host interfaces
      -p, --publish=[]           Publish a container's port to the host
                                   format: ip:hostPort:containerPort | ip::containerPort | hostPort:containerPort | containerPort
                                   (use 'docker port' to see the actual mapping)
      --privileged=false         Give extended privileges to this container
      --restart=""               Restart policy to apply when a container exits (no, on-failure[:max-retry], always)
      --rm=false                 Automatically remove the container when it exits (incompatible with -d)
      --sig-proxy=true           Proxy received signals to the process (even in non-TTY mode). SIGCHLD, SIGSTOP, and SIGKILL are not proxied.
      -t, --tty=false            Allocate a pseudo-TTY
      -u, --user=""              Username or UID
      -v, --volume=[]            Bind mount a volume (e.g., from the host: -v /host:/container, from Docker: -v /container)
      --volumes-from=[]          Mount volumes from the specified container(s)
      -w, --workdir=""           Working directory inside the container

#### [OPTIONS] 由两部分组成

1，设置独占操作，包括：

    - 单独或者前台运行
    - Container识别
    - 网络配置
    - CPU和内存的运行限制
    - 权限以及LXC配置

2，操作者[运行 `docker run`的人]和开发者之间的配置分享，操作者可以覆盖开发者在image编译的时候的默认设置

#### 独立或者前台运行

-d=true 或者 -d 为独立模式，所有的I/O必须通过网络连接或者共享卷来完成，因为Container不在监听操作docker run了。docker attach 可以重连一个独立的Container。 独立模式不能与rm 选项重用。

前台模式：不指定 -d 参数即可。

    - -a=[]           :Attach to 'STDIN' 'STDOUT' or 'STDERR'
    - -t=false        :允许
    - --sig-proxy=true:Proxify 
    - -i=false        :保持STDIN打开，如果没有attached

### Container标识

#### Name（--name）

三种标识Container的方式：

    - UUID long identifier ('f78375b1c487e03c9438c729345e54db9d20cfa2ac1fc3494b6eb60872e74778')
    - UUID short identifier ('f78375b1c487')
    - Name ("tomcat:lastest")

#### PID 对应

    --cidfile="" : Write the container ID to the file

#### Image[:tag]

`docker run ubuntu:14.04` 可以运行Container

##### 网络设置

    --dns=[]       :Set 为Container设置用户dns服务器
    --net="bridge" :设置网络模式
                    'bridge':为Container创建网络栈
                    'none':该Container没有网络
                    'container:<name|id>' : 重用network stack
                    'host':在Container内部使用host network
    --add-host=""  : 增加一行到/etc/hosts (host:IP)

#### Managing /etc/hosts

--add-host 

docker run -ti --add-host db-static:86.75.30.9 ubuntu cat /etc/hosts

    .....
    86.75.30.9   db-static

#### Clean up (--rm)

默认情况，当Container退出时，Container的file system还是会保留的。

    --rm=false : 自动删除Container，当其退出时(与 -d 不兼容)

#### Secutity 配置

    -security-opt="label:user:USER"   : Set the label user for the container
    --security-opt="label:role:ROLE"   : Set the label role for the container
    --security-opt="label:type:TYPE"   : Set the label type for the container
    --security-opt="label:level:LEVEL" : Set the label level for the container
    --security-opt="label:disable"     : Turn off label confinement for the container
    --secutity-opt="apparmor:PROFILE"  : Set the apparmor profile to be applied 
                                         to the container

#### CPU和内存的限制

操作者可以调整性能参数：

    -m="" : Memory limit（format：<number><optional unit>,where unit=b,k,m or g）
    -c=0  : CPU 数量(相对权值)

#### 运行权限，Linux性能和LXC配置

    --cap-add ： 添加linux capabilities
    --cap-drop ： drop linux capabilities
    --privileged=false ： 额外权限
    --device=[] ： 没有--privileged标识，允许在Container内部运行devices 
    --lxc-conf=[] : 增加lxc选项。--lxc-conf="lxc.cgroup.cpuset.cpus = 0,1"

