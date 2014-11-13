---
layout: post
title:  "docker 源码分析"
date:   2014-11-10 21:36:00
categories: docker源码
---

## Docker 源码分析

本文转载至以下三个链接，本文仅供本人学习而用，如果有引用不当之处，请联系chateldon@126.com。

[学习链接系列1](http://www.infoq.com/cn/articles/docker-source-code-analysis-part1)

[学习链接系列2](http://www.infoq.com/cn/articles/docker-source-code-analysis-part2)

[学习链接系列3](http://www.infoq.com/cn/articles/docker-source-code-analysis-part3)

### docker 架构

用户是使用Docker Client 与Docker Daemon通信。DockerDaemon为Docker架构的主题，提供Server功能，可以接受DockerClient请求；Engine执行Docker内部的一系列工作，每一个项工作以一个Job形式存在。(如图)

![docker架构](./img/docker-articultrue001.jpg)

job运行过程中，

    当需要容器镜像时，则从DockerRegistry中下载镜像，并通过镜像管理驱动graphdriver将下载的镜像以Graph的形式存储；

    当需要为Docker创建网络环境时，网络管理驱动networkdrive创建并配置Docker容器的网络环境。

    当需要限制Docker容器运行资源或执行用户指令等操作时，则通过execdriver来完成。

    libcontainer是一项独立的容器管理报，networkdriver以及execdriver都是通过libcontainer来实现具体对容器的操作。

执行完运行容器的命令后，一个实际的Docker容器就处于运行状态，该容器拥有独立的文件系统，独立并且安全的运行环境。

### Docker架构 各模块功能与实现

主要模块：DockerClient DockerDaemon DockerRegistry Graph Drive libcontainer DockerContainer

DockerClient与DockerDaemon通信的方式：

    tcp://host:port
    unix://path_to_socket
    fd://socketfd

与DockerDaemon建立连接并传输请求的时候，DockerClient可以通过设置命令行flag参数的形式设置安全传输层协议(TLS)的有关参数，保证传输的安全性。

### DockerDaemon

接受并处理DockerClient发送的请求。该守护进程在后台启动一个Server，负责接受DockerClient发送的请求；接口请求后，Server通过路由与分发调度，找到对应的Handler来执行请求。

DockerClient和DockerDaemon启动的可执行文件时使用docker，在docker执行时，通过传入的参数来判断是daemon还是client。

DockerDaemon的架构(如图)：

    Docker Server
    Engine
    Job

#### Docker Server

接收并调度分发Docker Client发送的请求。如图

Docker的启动过程中，通过包gorilla/mux，创建一个mux.Router，提供请求的路由功能。在Golang中，gorilla/mux是一个强大的URL路由器以及调度分发器。该mux.Router中添加了众多的路由项，每一个路由项由HTTP请求方法（PUT、POST、GET或DELETE）、URL、Handler三部分组成。

DockerClient通过HTTP形式访问DockerDaemon，创建完mux.Router之后，Docker将Server的监听地址以及mux.Router作为参数，创建一个httpSrv=http.Server{},最终执行httpSrv.Server()为请求服务。

在Server的服务过程中，Server在listener上接受Docker Client的访问请求，并创建一个全新的goroutine来服务该请求。在goroutine中，首先读取请求内容，然后做解析工作，接着找到相应的路由项，随后调用相应的Handler来处理该请求，最后Handler处理完请求之后回复该请求。

需要注意的是：Docker Server的运行在Docker的启动过程中，是靠一个名为"serveapi"的job的运行来完成的。原则上，Docker Server的运行是众多job中的一个，但是为了强调Docker Server的重要性以及为后续job服务的重要特性，将该"serveapi"的job单独抽离出来分析，理解为Docker Server。

#### Engine

Docker架构的运行引擎，也是核心模块。它扮演Docker container存储创库的角色，并且通过执行job的方式来管理这些容器。

Engin数据结构设计中，有一个Handler对象。该handler对象存储的是job的handler处理访问。举例，Engine的handler对象中有一项为：{"create":daemon.ContainerCreate,},则说明当create的job在运行时，执行的是daemon.ContainerCreate的handler。

#### Job

一个Job可以认为是Docker中Engine内部最基本的工作执行单元。Docker可以做的每一项工作都可以抽象为一个job。例如：在容器内部运行一个进程，这是一个job；创建一个新的容器，这是一个job，从Internet上下载一个文档，这是一个job；包括之前在Docker Server部分说过的，创建Server服务于HTTP的API，这也是一个job，等等。

Job的设计者，把Job设计得与Unix进程相仿。比如说：Job有一个名称，有参数，有环境变量，有标准的输入输出，有错误处理，有返回状态等。

### Docker Registry

存储容器镜像的仓库。而容器镜像是在容器被创建时，被加载用来初始化容器的文件架构与目录。

在Docker的运行过程中，Docker Daemon会与Docker Registry通信，并实现搜索镜像、下载镜像、上传镜像三个功能，这三个功能对应的job名称分别为"search"，"pull" 与 "push"。

其中，在Docker架构中，Docker可以使用公有的Docker Registry，即大家熟知的[Docker Hub](https://registry.hub.docker.com/)，如此一来，Docker获取容器镜像文件时，必须通过互联网访问Docker Hub；同时Docker也允许用户构建本地私有的Docker Registry，这样可以保证容器镜像的获取在内网完成。

### Graph

Graph在Docker架构中扮演已下载容器镜像的保管者，以及已下载容器镜像之间关系的记录者。一方面，Graph存储着本地具有版本信息的文件系统镜像，另一方面也通过GraphDB记录着所有文件系统镜像彼此之间的关系。如图


其中，GraphDB是一个构建在SQLite之上的小型图数据库，实现了节点的命名以及节点之间关联关系的记录。它仅仅实现了大多数图数据库所拥有的一个小的子集，但是提供了简单的接口表示节点之间的关系。

同时在Graph的本地目录中，关于每一个的容器镜像，具体存储的信息有：该容器镜像的元数据，容器镜像的大小信息，以及该容器镜像所代表的具体rootfs。

### Driver

Driver是Docker架构中的驱动模块。通过Driver驱动，Docker可以实现对Docker容器执行环境的定制。由于Docker运行的生命周期中，并非用户所有的操作都是针对Docker容器的管理，另外还有关于Docker运行信息的获取，Graph的存储与记录等。因此，为了将Docker容器的管理从Docker Daemon内部业务逻辑中区分开来，设计了Driver层驱动来接管所有这部分请求。

在Docker Driver的实现中，可以分为以下三类驱动：graphdriver、networkdriver和execdriver。

graphdriver主要用于完成容器镜像的管理，包括存储与获取。即当用户需要下载指定的容器镜像时，graphdriver将容器镜像存储在本地的指定目录；同时当用户需要使用指定的容器镜像来创建容器的rootfs时，graphdriver从本地镜像存储目录中获取指定的容器镜像。

在graphdriver的初始化过程之前，有4种文件系统或类文件系统在其内部注册，它们分别是aufs、btrfs、vfs和devmapper。而Docker在初始化之时，通过获取系统环境变量”DOCKER_DRIVER”来提取所使用driver的指定类型。而之后所有的graph操作，都使用该driver来执行。如图


networkdriver的用途是完成Docker容器网络环境的配置，其中包括Docker启动时为Docker环境创建网桥；Docker容器创建时为其创建专属虚拟网卡设备；以及为Docker容器分配IP、端口并与宿主机做端口映射，设置容器防火墙策略等。如图


execdriver作为Docker容器的执行驱动，负责创建容器运行命名空间，负责容器资源使用的统计与限制，负责容器内部进程的真正运行等。在execdriver的实现过程中，原先可以使用LXC驱动调用LXC的接口，来操纵容器的配置以及生命周期，而现在execdriver默认使用native驱动，不依赖于LXC。具体体现在Daemon启动过程中加载的ExecDriverflag参数，该参数在配置文件已经被设为"native"。这可以认为是Docker在1.2版本上一个很大的改变，或者说Docker实现跨平台的一个先兆。如图


#### libcontainer

libcontainer是Docker架构中一个使用Go语言设计实现的库，设计初衷是希望该库可以不依靠任何依赖，直接访问内核中与容器相关的API。

正是由于libcontainer的存在，Docker可以直接调用libcontainer，而最终操纵容器的namespace、cgroups、apparmor、网络设备以及防火墙规则等。这一系列操作的完成都不需要依赖LXC或者其他包。libcontainer架构如图4.7

另外，libcontainer提供了一整套标准的接口来满足上层对容器管理的需求。或者说，libcontainer屏蔽了Docker上层对容器的直接管理。又由于libcontainer使用Go这种跨平台的语言开发实现，且本身又可以被上层多种不同的编程语言访问，因此很难说，未来的Docker就一定会紧紧地和Linux捆绑在一起。而于此同时，Microsoft在其著名云计算平台Azure中，也添加了对Docker的支持，可见Docker的开放程度与业界的火热度。

暂不谈Docker，由于libcontainer的功能以及其本身与系统的松耦合特性，很有可能会在其他以容器为原型的平台出现，同时也很有可能催生出云计算领域全新的项目。

#### Docker container

Docker container（Docker容器）是Docker架构中服务交付的最终体现形式。

Docker按照用户的需求与指令，订制相应的Docker容器：

用户通过指定容器镜像，使得Docker容器可以自定义rootfs等文件系统；
用户通过指定计算资源的配额，使得Docker容器使用指定的计算资源；
用户通过配置网络及其安全策略，使得Docker容器拥有独立且安全的网络环境；
用户通过指定运行的命令，使得Docker容器执行指定的工作。
Docker容器示意图如图4.8

### Docker运行案例分析

docker pull  和  docker run.

#### docker pull

从Docker Registry中下载指定的容器镜像，并存储在本地的Graph中，以备后续创建Docker容器时的使用。docker pull命令执行流程如图5.1


图中标记的红色箭头表示docker pull命令在发起后，Docker所做的一系列运行。以下逐一分析这些步骤。

(1) Docker Client接受docker pull命令，解析完请求以及收集完请求参数之后，发送一个HTTP请求给Docker Server，HTTP请求方法为POST，请求URL为"/images/create? "+"xxx"；

(2) Docker Server接受以上HTTP请求，并交给mux.Router，mux.Router通过URL以及请求方法来确定执行该请求的具体handler；

(3) mux.Router将请求路由分发至相应的handler，具体为PostImagesCreate；

(4) 在PostImageCreate这个handler之中，一个名为"pull"的job被创建，并开始执行；

(5) 名为"pull"的job在执行过程中，执行pullRepository操作，即从Docker Registry中下载相应的一个或者多个image；

(6) 名为"pull"的job将下载的image交给graphdriver；

(7) graphdriver负责将image进行存储，一方创建graph对象，另一方面在GraphDB中记录image之间的关系。

#### docker run

docker run命令的作用是在一个全新的Docker容器内部运行一条指令。Docker在执行这条命令的时候，所做工作可以分为两部分：第一，创建Docker容器所需的rootfs；第二，创建容器的网络等运行环境，并真正运行用户指令。因此，在整个执行流程中，Docker Client给Docker Server发送了两次HTTP请求，第二次请求的发起取决于第一次请求的返回状态。Docker run命令执行流程如图5.2。


图中标记的红色箭头表示docker run命令在发起后，Docker所做的一系列运行。以下逐一分析这些步骤。

(1) Docker Client接受docker run命令，解析完请求以及收集完请求参数之后，发送一个HTTP请求给Docker Server，HTTP请求方法为POST，请求URL为"/containers/create? "+"xxx"；

(2) Docker Server接受以上HTTP请求，并交给mux.Router，mux.Router通过URL以及请求方法来确定执行该请求的具体handler；

(3) mux.Router将请求路由分发至相应的handler，具体为PostContainersCreate；

(4) 在PostImageCreate这个handler之中，一个名为"create"的job被创建，并开始让该job运行；

(5) 名为"create"的job在运行过程中，执行Container.Create操作，该操作需要获取容器镜像来为Docker容器创建rootfs，即调用graphdriver；

(6) graphdriver从Graph中获取创建Docker容器rootfs所需要的所有的镜像；

(7) graphdriver将rootfs所有镜像，加载安装至Docker容器指定的文件目录下；

(8) 若以上操作全部正常执行，没有返回错误或异常，则Docker Client收到Docker Server返回状态之后，发起第二次HTTP请求。请求方法为"POST"，请求URL为"/containers/"+container_ID+"/start"；

(9) Docker Server接受以上HTTP请求，并交给mux.Router，mux.Router通过URL以及请求方法来确定执行该请求的具体handler；

(10)mux.Router将请求路由分发至相应的handler，具体为PostContainersStart；

(11)在PostContainersStart这个handler之中，名为"start"的job被创建，并开始执行；

(12)名为"start"的job执行完初步的配置工作后，开始配置与创建网络环境，调用networkdriver；

(13)networkdriver需要为指定的Docker容器创建网络接口设备，并为其分配IP，port，以及设置防火墙规则，相应的操作转交至libcontainer中的netlink包来完成；

(14)netlink完成Docker容器的网络环境配置与创建；

(15)返回至名为"start"的job，执行完一些辅助性操作后，job开始执行用户指令，调用execdriver；

(16)execdriver被调用，初始化Docker容器内部的运行环境，如命名空间，资源控制与隔离，以及用户命令的执行，相应的操作转交至libcontainer来完成；

(17)libcontainer被调用，完成Docker容器内部的运行环境初始化，并最终执行用户要求启动的命令。

## Docker Client 创建与命令执行

- Docker Client的创建
    + 如何通过Docker命令，解析命令行flag参数以及docker命令中的请求参数
    + 如何处理具体的flag参数信息，并收集Docker Client所需的配置信息
    + 如何创建一个Docker Client
- 在已有docker Client的基础上，分析如何执行docker命令
    + 如何解析docker命令中的请求参数，获取相应请求的类型
    + docker client如何执行具体的请求命令，最终将亲请求发送至docker server

整个docker源代码运行的流程图：docker-run-flow 如图：


### docker命令的flag参数解析




众所周知，在Docker的具体实现中，Docker Server与Docker Client均由可执行文件docker来完成创建并启动。那么，了解docker可执行文件通过何种方式区分两者，就显得尤为重要。

对于两者，首先举例说明其中的区别。Docker Server的启动，命令为docker -d或docker --daemon=true；而Docker Client的启动则体现为docker --daemon=false ps、docker pull NAME等。

可以把以上Docker请求中的参数分为两类：第一类为命令行参数，即docker程序运行时所需提供的参数，如: -D、--daemon=true、--daemon=false等；第二类为docker发送给Docker Server的实际请求参数，如：ps、pull NAME等。

对于第一类，我们习惯将其称为flag参数，在go语言的标准库中，同时还提供了一个flag包，方便进行命令行参数的解析。

交待以上背景之后，随即进入实现Docker Client创建的源码，位于./docker/docker/docker.go，该go文件包含了整个Docker的main函数，也就是整个Docker（不论Docker Daemon还是Docker Client）的运行入口。部分main函数代码如下：

{{{ % highlight go %}}}
func main() {
    if reexec.Init() {
      return
    }
    flag.Parse()
    // FIXME: validate daemon flags here
    ……
}
{{{ % endhighlight  %}}}

在以上代码中，首先判断reexec.Init()方法的返回值，若为真，则直接退出运行，否则的话继续执行。查看位于./docker/reexec/reexec.go中reexec.Init()的定义，可以发现由于在docker运行之前没有任何的Initializer注册，故该代码段执行的返回值为假。

紧接着，main函数通过调用flag.Parse()解析命令行中的flag参数。查看源码可以发现Docker在./docker/docker/flag.go中定义了多个flag参数，并通过init函数进行初始化。代码如下：

{{{ % highlight go %}}}
var (
  flVersion     = flag.Bool([]string{"v", "-version"}, false, "Print version information and quit")
  flDaemon      = flag.Bool([]string{"d", "-daemon"}, false, "Enable daemon mode")
  flDebug       = flag.Bool([]string{"D", "-debug"}, false, "Enable debug mode")
  flSocketGroup = flag.String([]string{"G", "-group"}, "docker", "Group to assign the unix socket specified by -H when running in daemon mode use '' (the empty string) to disable setting of a group")
  flEnableCors  = flag.Bool([]string{"#api-enable-cors", "-api-enable-cors"}, false, "Enable CORS headers in the remote API")
  flTls         = flag.Bool([]string{"-tls"}, false, "Use TLS; implied by tls-verify flags")
  flTlsVerify   = flag.Bool([]string{"-tlsverify"}, false, "Use TLS and verify the remote (daemon: verify client, client: verify daemon)")

  // these are initialized in init() below since their default values depend on dockerCertPath which isn't fully initialized until init() runs
  flCa    *string
  flCert  *string
  flKey   *string
  flHosts []string
)

func init() {
  flCa = flag.String([]string{"-tlscacert"}, filepath.Join(dockerCertPath, defaultCaFile), "Trust only remotes providing a certificate signed by the CA given here")
  flCert = flag.String([]string{"-tlscert"}, filepath.Join(dockerCertPath, defaultCertFile), "Path to TLS certificate file")
  flKey = flag.String([]string{"-tlskey"}, filepath.Join(dockerCertPath, defaultKeyFile), "Path to TLS key file")
  opts.HostListVar(&flHosts, []string{"H", "-host"}, "The socket(s) to bind to in daemon mode\nspecified using one or more tcp://host:port, unix:///path/to/socket, fd://* or fd://socketfd.")
}
{{{ % endhighlight  %}}}

这里涉及到了Golang的一个特性，即init函数的执行。在Golang中init函数的特性如下：

    init函数用于程序执行前包的初始化工作，比如初始化变量等；
    每个包可以有多个init函数；
    包的每一个源文件也可以有多个init函数；
    同一个包内的init函数的执行顺序没有明确的定义；
    不同包的init函数按照包导入的依赖关系决定初始化的顺序；
    init函数不能被调用，而是在main函数调用前自动被调用。

因此，在main函数执行之前，Docker已经定义了诸多flag参数，并对很多flag参数进行初始化。定义的命令行flag参数有：flVersion、flDaemon、flDebug、flSocketGroup、flEnableCors、flTls、flTlsVerify、flCa、flCert、flKey等。

以下具体分析flDaemon：

    定义：flDaemon = flag.Bool([]string{"d", "-daemon"}, false, "Enable daemon mode")
    flDaemon的类型为Bool类型
    flDaemon名称为”d”或者”-daemon”，该名称会出现在docker命令中
    flDaemon的默认值为false
    flDaemon的帮助信息为”Enable daemon mode”
    访问flDaemon的值时，使用指针* flDaemon解引用访问

在解析命令行flag参数时，以下的语言为合法的：

    -d, --daemon
    -d=true, --daemon=true
    -d=”true”, --daemon=”true”
    -d=’true’, --daemon=’true’
当解析到第一个非定义的flag参数时，命令行flag参数解析工作结束。举例说明，当执行docker命令docker --daemon=false --version=false ps时，flag参数解析主要完成两个工作：

    完成命令行flag参数的解析，名为-daemon和-version的flag参数flDaemon和flVersion分别获得相应的值，均为false；
    
    遇到第一个非flag参数的参数ps时，将ps及其之后所有的参数存入flag.Args()，以便之后执行Docker Client具体的请求时使用。

如需深入学习flag的解析，可以参见源码命令行[参数flag的解析](https://github.com/docker/docker/blob/master/pkg/mflag/flag.go)。

### 处理flag信息并收集docker client配置信息

有了以上flag参数解析的相关知识，分析Docker的main函数就变得简单易懂很多。通过总结，首先列出源代码中处理的flag信息以及收集Docker Client的配置信息，然后再一一对此分析：

    处理的flag参数有：flVersion、flDebug、flDaemon、flTlsVerify以及flTls；

    为Docker Client收集的配置信息有：protoAddrParts(通过flHosts参数获得，作用为提供Docker Client与Server的通信协议以及通信地址)、tlsConfig(通过一系列flag参数获得，如*flTls、*flTlsVerify，作用为提供安全传输层协议的保障)。

然后分析处理这些flag参数信息，以及配置信息。

在flag.Parse()之后的代码如下：

{{{ % highlight go %}}}
if *flVersion {
    showVersion()
    return
  }
{{{ % endhighlight  %}}}

当经过解析flag参数后，若flVersion参数为真时，调用showVersion()显示版本信息，并从main函数退出；否则继续执行。

{{{ % highlight go %}}}
if *flDebug {
    os.Setenv("DEBUG","1")
  }
{{{ % endhighlight  %}}}

若flDebug参数为真时，通过os包中Setenv函数创建一个名为DEBUG的系统环境变量，并将其值设为"1"。继续执行

{{{ % highlight go %}}}
if len(flHosts) == 0 {
    defaultHost := os.Getenv("DOCKER_HOST")
    if defaultHost == "" || *flDaemon {
      // If we do not have a host, default to unix socket
      defaultHost = fmt.Sprintf("unix://%s", api.DEFAULTUNIXSOCKET)
    }
    if _, err := api.ValidateHost(defaultHost); err != nil {
      log.Fatal(err)
    }
    flHosts = append(flHosts, defaultHost)
  }
{{{ % endhighlight  %}}}

变量flHosts，flHosts的作用是为Docker Client提供所需要链接的host对象，也为Docker Server提供所要监听的对象。

分析过程中，判断flHosts变量是否长度为0，若是，通过os包获取DOCKER_HOST环境变量的值，将其复制给defaultHost。若defaultHost为空或者flDaemon为真时，说明目前还没有一个定义的host对象，则将其默认设置为unix socket，值为api.DEFAULTUNIXSOCKET，该常量位于./docker/api/common.go,值为"/var/run/docker.sock",故defaultHost为"unix:///var/run/docker.sock".验证该defaultHost的合法性后，将defaultHost的值追加至flHost的末尾。继续执行。

{{{ % highlight go %}}}
  if *flDaemon {
    mainDaemon()
    return
  }
{{{ % endhighlight  %}}}

若flDaemon为真时，执行mainDaemon函数，实现Docker Daemon的启动，若mainDaemon函数执行完毕，则退出main函数，一般mainDaemon函数不会主动终结。由于本章节介绍Docker Client的启动，故假设flDaemon参数为假，不执行以上代码块。继续往下执行。

{{{ % highlight go %}}}
  if len(flHosts) > 1 {
    log.Fatal("Please specify only one -H")
  }
  protoAddrParts := strings.SplitN(flHosts[0], "://", 2)
{{{ % endhighlight  %}}}

若flHosts的长度大于1的话，则抛出错误日志。接着将flHosts这个string数组中的第一个元素，进行分割，通过”://”来分割，分割出的两个部分放入变量protoAddrParts数组中。protoAddrParts的作用为解析出与Docker Server建立通信的协议与地址，为Docker Client创建过程中不可或缺的配置信息之一。

{{{ % highlight go %}}}
   var (
    cli       *client.DockerCli
    tlsConfig tls.Config
  )
tlsConfig.InsecureSkipVerify = true
{{{ % endhighlight  %}}}

由于之前已经假设过flDaemon为假，则可以认定main函数的运行是为了Docker Client的创建与执行。在这里创建两个变量：一个为类型是client.DockerCli指针的对象cli，另一个为类型是tls.Config的对象tlsConfig。并将tlsConfig的InsecureSkipVerify属性设置为真。TlsConfig对象的创建是为了保障cli在传输数据的时候，遵循安全传输层协议(TLS)。安全传输层协议(TLS) 用于两个通信应用程序之间保密性与数据完整性。tlsConfig是Docker Client创建过程中可选的配置信息。

{{{ % highlight go %}}}
   // If we should verify the server, we need to load a trusted ca
  if *flTlsVerify {
    *flTls = true
    certPool := x509.NewCertPool()
    file, err := ioutil.ReadFile(*flCa)
    if err != nil {
      log.Fatalf("Couldn't read ca cert %s: %s", *flCa, err)
    }
    certPool.AppendCertsFromPEM(file)
    tlsConfig.RootCAs = certPool
    tlsConfig.InsecureSkipVerify = false
  }
{{{ % endhighlight  %}}}

若flTlsVerify这个flag参数为真的话，则说明需要验证server端的安全性，tlsConfig对象需要加载一个受信的ca文件。该ca文件的路径为*flCA参数的值，最终完成tlsConfig对象中RootCAs属性的赋值，并将InsecureSkipVerify属性置为假。

{{{ % highlight go %}}}
  // If tls is enabled, try to load and send client certificates
  if *flTls || *flTlsVerify {
    _, errCert := os.Stat(*flCert)
    _, errKey := os.Stat(*flKey)
    if errCert == nil && errKey == nil {
      *flTls = true
      cert, err := tls.LoadX509KeyPair(*flCert, *flKey)
      if err != nil {
        log.Fatalf("Couldn't load X509 key pair: %s. Key encrypted?", err)
      }
      tlsConfig.Certificates = []tls.Certificate{cert}
    }
  }
{{{ % endhighlight  %}}}

如果flTls和flTlsVerify两个flag参数中有一个为真，则说明需要加载以及发送client端的证书。最终将证书内容交给tlsConfig的Certificates属性。

至此，flag参数已经全部处理，并已经收集完毕Docker Client所需的配置信息。之后的内容为Docker Client如何实现创建并执行。

### Docker Client的创建

Docker Client创建其实就是在已有配置参数信息的情况下，通过Client包中的NewDockerCli方法创建一个实例cli，源码如下：

{{{ % highlight go %}}}
 if *flTls || *flTlsVerify {
    cli = client.NewDockerCli(os.Stdin, os.Stdout, os.Stderr, protoAddrParts[0], protoAddrParts[1], &tlsConfig)
  } else {
    cli = client.NewDockerCli(os.Stdin, os.Stdout, os.Stderr, protoAddrParts[0], protoAddrParts[1], nil)
  }
{{{ % endhighlight  %}}}

如果flag参数flTls为真或者flTlsVerify为真的话，则说明需要使用TLS协议来保证传输的安全性，故创建DockerClient的时候，将TlsConfig参数传入；否则，同样创建Docker Client，只不过TlsConfig为nil。

关于Client包中的NewDockerCli函数的实现，可以具体参见./docker/api/client/cli.go.

{{{ % highlight go %}}}
func NewDockerCli(in io.ReadCloser, out, err io.Writer, proto, addr string, tlsConfig *tls.Config) *DockerCli {
  var (
    isTerminal = false
    terminalFd uintptr
    scheme     = "http"
  )

  if tlsConfig != nil {
    scheme = "https"
  }

  if in != nil {
    if file, ok := out.(*os.File); ok {
      terminalFd = file.Fd()
      isTerminal = term.IsTerminal(terminalFd)
    }
  }

  if err == nil {
    err = out
  }
  return &DockerCli{
    proto:      proto,
    addr:       addr,
    in:         in,
    out:        out,
    err:        err,
    isTerminal: isTerminal,
    terminalFd: terminalFd,
    tlsConfig:  tlsConfig,
    scheme:     scheme,
  }
}
{{{ % endhighlight  %}}}

总体而言，创建DockerCli对象较为简单，较为重要的DockerCli的属性有proto：传输协议；addr：host的目标地址，tlsConfig：安全传输层协议的配置。若tlsConfig为不为空，则说明需要使用安全传输层协议，DockerCli对象的scheme设置为“https”，另外还有关于输入，输出以及错误显示的配置，最终返回该对象。

通过调用NewDockerCli函数，程序最终完成了创建Docker Client，并返回main函数继续执行。

## Docker命令执行

main函数执行到目前为止，有一下内容需要为Docker命令的执行服务：创建完毕的DockerClient，docker命令中的请求参数(经flag解析后存放于flag.Arg())。也就是说，需要使用DockerClient来分析docker命令中的请求参数，并最终发送相应请求给DockerServer。

### Docker Client解析请求命令

Docker Client解析请求命令的工作，在Docker命令执行部分第一个完成，直接进入main函数之后的源码./docker/docker/docker.go ：

{{{ % highlight go %}}}
if err := cli.Cmd(flag.Args()...); err != nil {
    if sterr, ok := err.(*utils.StatusError); ok {
      if sterr.Status != "" {
        log.Println(sterr.Status)
      }
      os.Exit(sterr.StatusCode)
    }
    log.Fatal(err)
  }
{{{ % endhighlight  %}}}

首先解析存放于flag.Args()中的具体请求参数，执行的函数为cli对象的Cmd函数。进入./docker/api/client/cli.go的Cmd函数：

{{{ % highlight go %}}}
// Cmd executes the specified command
func (cli *DockerCli) Cmd(args ...string) error {
  if len(args) > 0 {
    method, exists := cli.getMethod(args[0])
    if !exists {
      fmt.Println("Error: Command not found:", args[0])
      return cli.CmdHelp(args[1:]...)
    }
    return method(args[1:]...)
  }
  return cli.CmdHelp(args...)
}
{{{ % endhighlight  %}}}

Cmd函数执行具体的指令。源码实现中，首先判断请求参数列表的长度是否大于0，若不是的话，说明没有请求信息，返回docker命令的Help信息；若长度大于0的话，说明有请求信息，则首先通过请求参数列表中的第一个元素args[0]来获取具体的method的方法。如果上述method方法不存在，则返回docker命令的Help信息，若存在的话，调用具体的method方法，参数为args[1]及其之后所有的请求参数。

还是以一个具体的docker命令为例，docker –daemon=false –version=false pull Name。通过以上的分析，可以总结出以下操作流程：

- (1) 解析flag参数之后，将docker请求参数”pull”和“Name”存放于flag.Args();

- (2) 创建好的Docker Client为cli，cli执行cli.Cmd(flag.Args()…);

在Cmd函数中，通过args[0]也就是”pull”,执行cli.getMethod(args[0])，获取method的名称；

- (3) 在getMothod方法中，通过处理最终返回method的值为”CmdPull”;

- (4) 最终执行method(args[1:]…)也就是CmdPull(args[1:]…)。


### Docker Client执行请求命令

上一节通过一系列的命令解析，最终找到了具体的命令的执行方法，本节内容主要介绍Docker Client如何通过该执行方法处理并发送请求。

由于不同的请求内容不同，执行流程大致相同，本节依旧以一个例子来阐述其中的流程，例子为：docker pull NAME。

Docker Client在执行以上请求命令的时候，会执行CmdPull函数，传入参数为args[1:]...。源码具体为./docker/api/client/command.go中的CmdPull函数。

以下逐一分析CmdPull的源码实现。

(1) 通过cli包中的Subcmd方法定义一个类型为Flagset的对象cmd。

    cmd := cli.Subcmd("pull", "NAME[:TAG]", "Pull an image or a repository from the registry")

(2) 给cmd对象定义一个类型为String的flag，名为”#t”或”#-tag”，初始值为空。

    tag := cmd.String([]string{"#t", "#-tag"}, "", "Download tagged image in a repository")

(3) 将args参数进行解析，解析过程中，先提取出是否有符合tag这个flag的参数，若有，将其给赋值给tag参数，其余的参数存入cmd.NArg();若无的话，所有的参数存入cmd.NArg()中。

    if err := cmd.Parse(args); err != nil {
      return nil }

(4) 判断经过flag解析后的参数列表，若参数列表中参数的个数不为1，则说明需要pull多个image，pull命令不支持，则调用错误处理方法cmd.Usage()，并返回nil。

    if cmd.NArg() != 1 {
      cmd.Usage()
      return nil
          }

(5) 创建一个map类型的变量v，该变量用于存放pull镜像时所需的url参数；随后将参数列表的第一个值赋给remote变量，并将remote作为键为fromImage的值添加至v；最后若有tag信息的话，将tag信息作为键为”tag”的值添加至v。

    var (
          v      = url.Values{}
          remote = cmd.Arg(0)
    )
    v.Set("fromImage", remote)
        if *tag == "" {
          v.Set("tag", *tag)
    }

(6) 通过remote变量解析出镜像所在的host地址，以及镜像的名称

    remote, _ = parsers.ParseRepositoryTag(remote)
    // Resolve the Repository name from fqn to hostname + name
    hostname, _, err := registry.ResolveRepositoryName(remote)
    if err != nil {
      return err
    }

(7) 通过cli对象获取与DockerServer通信所需要的认证配置信息

    cli.LoadConfigFile()
    // Resolve the Auth config relevant for this server
    authConfig := cli.configFile.ResolveAuthConfig(hostname)

(8) 定义一个名为pull的函数，传入的参数类型为registry.AuthConfig，返回类型为error。函数执行块中最主要的内容为：cli.stream(……)部分。该部分具体发起了一个给Docker Server的POST请求，请求的url为"/images/create?"+v.Encode()，请求的认证信息为：map[string][]string{"X-Registry-Auth": registryAuthHeader,}。

     pull := func(authConfig registry.AuthConfig) error {
      buf, err := json.Marshal(authConfig)
      if err != nil {
        return err
      }
      registryAuthHeader := []string{
        base64.URLEncoding.EncodeToString(buf),
      }
      return cli.stream("POST", "/images/create?"+v.Encode(), nil, cli.out, map[string][]string{
      "  X-Registry-Auth": registryAuthHeader,
      })
    }

(9) 由于上一个步骤只是定义pull函数，这一步骤具体调用执行pull函数，若成功则最终返回，若返回错误，则做相应的错误处理。若返回错误为401，则需要先登录，转至登录环节，完成之后，继续执行pull函数，若完成则最终返回。

     if err := pull(authConfig); err != nil {
      if strings.Contains(err.Error(), "Status 401") {
        fmt.Fprintln(cli.out, "\nPlease login prior to pull:")
        if err := cli.CmdLogin(hostname); err != nil {
          return err
        }
            authConfig := cli.configFile.ResolveAuthConfig(hostname)
            return pull(authConfig)
      }
      return err
    }

以上便是pull请求的全部执行过程，其他请求的执行在流程上也是大同小异。总之，请求执行过程中，大多都是将命令行中关于请求的参数进行初步处理，并添加相应的辅助信息，最终通过指定的协议给Docker Server发送Docker Client和Docker Server约定好的API请求。

## 总结

本文从源码的角度分析了从docker可执行文件开始，到创建Docker Client，最终发送给Docker Server请求的完整过程。

笔者认为，学习与理解Docker Client相关的源码实现，不仅可以让用户熟练掌握Docker命令的使用，还可以使得用户在特殊情况下有能力修改Docker Client的源码，使其满足自身系统的某些特殊需求，以达到定制Docker Client的目的，最大发挥Docker开放思想的价值。

## Docker Daemon 启动

Docker Daemon是Docker架构中运行在后台的守护进程，大致可以分为Docker Server、Engine和Job三部分。Docker Daemon可以认为是通过Docker Server模块接受Docker Client的请求，并在Engine中处理请求，然后根据请求类型，创建出指定的Job并运行，运行过程的作用有以下几种可能：向Docker Registry获取镜像，通过graphdriver执行容器镜像的本地化操作，通过networkdriver执行容器网络环境的配置，通过execdriver执行容器内部运行的执行工作等.

Docker Daemon框架示意图如图：


### Docker Daemon 源码分析内容安排

主要分析Docker Daemon启动流程，由于Docker Daemon和Docker Client的启动流程有很大的相似之处，故在介绍启动流程之后，本文着重分析启动流程中最为重要的环节：创建daemon过程中mainDaemon()的实现。

### Docker Daemon启动流程

由于Docker Daemon和Docker Client的启动都是通过可执行文件docker来完成的，因此两者的启动流程非常相似。Docker可执行文件运行时，运行代码通过不同的命令行flag参数，区分两者，并最终运行两者各自相应的部分。

启动Docker Daemon时，一般可以使用以下命令：docker --daemon=true; docker –d; docker –d=true等。接着由docker的main()函数来解析以上命令的相应flag参数，并最终完成Docker Daemon的启动。

首先，附上Docker Daemon的启动流程图：


### mainDaemon函数具体实现

通过Docker Daemon的流程图，可以得出一个这样的结论：有关Docker Daemon的所有的工作，都被包含在mainDaemon()方法的实现中。

宏观来讲，mainDaemon()完成创建一个daemon进程，并使其正常运行。

从功能的角度来说，mainDaemon()实现了两部分内容：第一，创建Docker运行环境；第二，服务于Docker Client，接收并处理相应请求。

从实现细节来讲，[mainDaemon()的实现过程](https://github.com/docker/docker/blob/v1.2.0/docker/daemon.go#L28)主要包含以下步骤：

- daemon的配置初始化（这部分在init()函数中实现，即在mainDaemon()运行前就执行，但由于这部分内容和mainDaemon()的运行息息相关，故可认为是mainDaemon()运行的先决条件）；
- 命令行flag参数检查
- 创建engine对象
- 设置engine的信号捕获以及处理方法
- 加载builtins
- 使用goroutine加载daemon对象并运行
- 打印Docker版本以及驱动信息
- job之“serverapi”的创建与运行。

#### 配置初始化

在mainDaemon()运行之前，关于Docker Daemon所需要的config配置信息均已经初始化完毕。具体实现如下，位于./docker/docker/daemon.go：

    var (
      daemonCfg = &daemon.Config{}
    )
    func init() {
      daemonCfg.InstallFlags()
    }

首先，声明一个为daemon包中Config类型的变量，名为daemonCfg。而Config对象，定义了Docker Daemon所需的配置信息。在Docker Daemon在启动时，daemonCfg变量被传递至Docker Daemon并被使用。

Config对象的定义如下（含部分属性的解释），位于./docker/daemon/config.go：

    type Config struct {
      Pidfile                  string   //Docker Daemon所属进程的PID文件
      Root                   string   //Docker运行时所使用的root路径
      AutoRestart             bool    //已被启用，转而支持docker run时的重启
      Dns                   []string  //Docker使用的DNS Server地址
      DnsSearch              []string  //Docker使用的指定的DNS查找域名
      Mirrors                 []string  //指定的优先Docker Registry镜像
      EnableIptables           bool    //启用Docker的iptables功能
      EnableIpForward         bool    //启用net.ipv4.ip_forward功能
      EnableIpMasq            bool      //启用IP伪装技术
      DefaultIp                net.IP     //绑定容器端口时使用的默认IP
      BridgeIface              string      //添加容器网络至已有的网桥
      BridgeIP                 string     //创建网桥的IP地址
      FixedCIDR               string     //指定IP的IPv4子网，必须被网桥子网包含
      InterContainerCommunication   bool  //是否允许相同host上容器间的通信
      GraphDriver             string      //Docker运行时使用的特定存储驱动
      GraphOptions            []string   //可设置的存储驱动选项
      ExecDriver               string    // Docker运行时使用的特定exec驱动
      Mtu                    int      //设置容器网络的MTU
      DisableNetwork          bool     //有定义，之后未初始化
      EnableSelinuxSupport      bool     //启用SELinux功能的支持
      Context                 map[string][]string   //有定义，之后未初始化
    }

已经有声明的daemonCfg之后，init()函数实现了daemonCfg变量中各属性的赋值，具体的实现为：daemonCfg.InstallFlags()，位于./docker/daemon/config.go，代码如下：

    func (config *Config) InstallFlags() {
      flag.StringVar(&config.Pidfile, []string{"p", "-pidfile"}, "/var/run/docker.pid",
     "Path to use for daemon PID file")
      flag.StringVar(&config.Root, []string{"g", "-graph"}, "/var/lib/docker",
    "Path to use as the root of the Docker runtime")
      ……
      opts.IPVar(&config.DefaultIp, []string{"#ip", "-ip"}, "0.0.0.0", "Default IP address to 
    use when binding container ports")
      opts.ListVar(&config.GraphOptions, []string{"-storage-opt"}, "Set storage driver options")
      ……
    }

在InstallFlags()函数的实现过程中，主要是定义某种类型的flag参数，并将该参数的值绑定在config变量的指定属性上，如：

    flag.StringVar(&config.Pidfile, []string{"p", "-pidfile"}, " /var/run/docker.pid", "Path to use for daemon PID file")

以上语句的含义为：

- 定义一个为String类型的flag参数；
- 该flag的名称为”p”或者”-pidfile”;
- 该flag的值为” /var/run/docker.pid”,并将该值绑定在变量config.Pidfile上；
- 该flag的描述信息为"Path to use for daemon PID file"。

至此，关于Docker Daemon所需要的配置信息均声明并初始化完毕。

#### flag参数检查

从这一节开始，真正进入Docker Daemon的mainDaemon()运行分析。

第一个步骤即flag参数的检查。具体而言，即当docker命令经过flag参数解析之后，判断剩余的参数是否为0。若为0，则说明Docker Daemon的启动命令无误，正常运行；若不为0，则说明在启动Docker Daemon的时候，传入了多余的参数，此时会输出错误提示，并退出运行程序。具体代码如下：

    if flag.NArg() != 0 {
      flag.Usage()
      return
    }

#### 创建engine对象

在mainDaemon()运行过程中，flag参数检查完毕之后，随即创建engine对象，代码如下：

    eng := engine.New()

Engine是Docker架构中的运行引擎，同时也是Docker运行的核心模块。Engine扮演着Docker container存储仓库的角色，并且通过job的形式来管理这些容器。

在./docker/engine/engine.go中,Engine结构体的定义如下：

      type Engine struct {
        handlers   map[string]Handler
        catchall   Handler
        hack       Hack // data for temporary hackery (see hack.go)
        id         string
        Stdout     io.Writer
        Stderr     io.Writer
        Stdin      io.Reader
        Logging    bool
        tasks      sync.WaitGroup
        l          sync.RWMutex // lock for shutdown
        shutdown   bool
        onShutdown []func() // shutdown handlers
      }

其中，Engine结构体中最为重要的即为handlers属性。该handlers属性为map类型，key为string类型，value为Handler类型。其中Handler类型的定义如下：

    type Handler func(*Job) Status

可见，Handler为一个定义的函数。该函数传入的参数为Job指针，返回为Status状态。

介绍完Engine以及Handler，现在真正进入New()函数的实现中：

    func New() *Engine {
      eng := &Engine{
        handlers: make(map[string]Handler),
        id:       utils.RandomString(),
        Stdout:   os.Stdout,
        Stderr:   os.Stderr,
        Stdin:    os.Stdin,
        Logging:  true,
      }
      eng.Register("commands", func(job *Job) Status {
        for _, name := range eng.commands() {
          job.Printf("%s\n", name)
        }
        return StatusOK
      })
      // Copy existing global handlers
      for k, v := range globalHandlers {
        eng.handlers[k] = v
      }
      return eng
    }

分析以上代码，可以知道New()函数最终返回一个Engine对象。而在代码实现部分，第一个工作即为创建一个Engine结构体实例eng；第二个工作是向eng对象注册名为commands的Handler，其中Handler为临时定义的函数func(job *Job) Status{ } , 该函数的作用是通过job来打印所有已经注册完毕的command名称，最终返回状态StatusOK；第三个工作是：将已定义的变量globalHandlers中的所有的Handler，都复制到eng对象的handlers属性中。最后成功返回eng对象。

#### 设置engine的信息捕获

回到mainDaemon()函数的运行中，执行后续代码：

    signal.Trap(eng.Shutdown)

该部分代码的作用是：在Docker Daemon的运行中，设置Trap特定信号的处理方法，特定信号有SIGINT，SIGTERM以及SIGQUIT；当程序捕获到SIGINT或者SIGTERM信号时，执行相应的善后操作，最后保证Docker Daemon程序退出。

该部分的代码的实现位于./docker/pkg/signal/trap.go。实现的流程分为以下4个步骤：

- 创建并设置一个channel，用于发送信号通知；
- 定义signals数组变量，初始值为os.SIGINT, os.SIGTERM;若环境变量DEBUG为空的话，则添加os.SIGQUIT至signals数组；
- 通过gosignal.Notify(c, signals...)中Notify函数来实现将接收到的signal信号传递给c。需要注意的是只有signals中被罗列出的信号才会被传递给c，其余信号会被直接忽略；
- 创建一个goroutine来处理具体的signal信号，当信号类型为os.Interrupt或者syscall.SIGTERM时，执行传入Trap函数的具体执行方法，形参为cleanup(),实参为eng.Shutdown。

Shutdown()函数的定义位于./docker/engine/engine.go，主要做的工作是为Docker Daemon的关闭做一些善后工作。

善后工作如下：

- Docker Daemon不再接收任何新的Job；
- Docker Daemon等待所有存活的Job执行完毕；
- Docker Daemon调用所有shutdown的处理方法；
- 当所有的handler执行完毕，或者15秒之后，Shutdown()函数返回。

由于在signal.Trap( eng.Shutdown )函数的具体实现中执行eng.Shutdown，在执行完eng.Shutdown之后，随即执行os.Exit(0)，完成当前程序的立即退出。

#### 加载builtins

为eng设置王Trap特定辛哈的处理方法之后，Docker Daemon实现了builtins的加载。代码实现如下：

    if err := builtins.Register(eng); err != nil {
      log.Fatal(err)
    }


加载builtins的主要工作是为：为engine注册多个Handler，以便后续在执行相应任务时，运行指定的Handler。这些Handler包括：网络初始化、web API服务、事件查询、版本查看、Docker Registry验证与搜索。代码实现位于./docker/builtins/builtins.go,如下：

    func Register(eng *engine.Engine) error {
      if err := daemon(eng); err != nil {
        return err
      }
      if err := remote(eng); err != nil {
        return err
      }
      if err := events.New().Install(eng); err != nil {
        return err
      }
      if err := eng.Register("version", dockerVersion); err != nil {
        return err
      }
      return registry.NewService().Install(eng)
    }

以下分析实现过程中最为主要的5个部分：daemon(eng)、remote(eng)、events.New().Install(eng)、eng.Register(“version”,dockerVersion)以及registry.NewService().Install(eng)。

#### 注册初始化网络驱动的Handler

daemon(eng)的实现过程，主要为eng对象注册了一个key为”init_networkdriver”的Handler，该Handler的值为bridge.InitDriver函数，代码如下：

    func daemon(eng *engine.Engine) error {
      return eng.Register("init_networkdriver", bridge.InitDriver)
    }

需要注意的是，向eng对象注册Handler，并不代表Handler的值函数会被直接运行，如bridge.InitDriver，并不会直接运行，而是将bridge.InitDriver的函数入口，写入eng的handlers属性中。

Bridge.InitDriver的具体实现位于./docker/daemon/networkdriver/bridge/driver.go ，主要作用为：

- 获取为Docker服务的网络设备的地址；
- 创建指定IP地址的网桥；
- 配置网络iptables规则；
- 另外还为eng对象注册了多个Handler,如 ”allocate_interface”， ”release_interface”， ”allocate_port”，”link”。

#### 注册API服务的Handler

events.New().Install(eng)的实现过程，为Docker注册了多个event事件，功能是给Docker用户提供API，使得用户可以通过这些API查看Docker内部的events信息，log信息以及subscribers_count信息。具体的代码位于./docker/events/events.go，如下：

    func (e *Events) Install(eng *engine.Engine) error {
      jobs := map[string]engine.Handler{
        "events":            e.Get,
        "log":               e.Log,
        "subscribers_count": e.SubscribersCount,
      }
      for name, job := range jobs {
        if err := eng.Register(name, job); err != nil {
          return err
        }
      }
      return nil
    }

#### 注册版本的Handler

eng.Register(“version”,dockerVersion)的实现过程，向eng对象注册key为”version”，value为”dockerVersion”执行方法的Handler，dockerVersion的执行过程中，会向名为version的job的标准输出中写入Docker的版本，Docker API的版本，git版本，Go语言运行时版本以及操作系统等版本信息。dockerVersion的具体实现如下：

    func dockerVersion(job *engine.Job) engine.Status {
      v := &engine.Env{}
      v.SetJson("Version", dockerversion.VERSION)
      v.SetJson("ApiVersion", api.APIVERSION)
      v.Set("GitCommit", dockerversion.GITCOMMIT)
      v.Set("GoVersion", runtime.Version())
      v.Set("Os", runtime.GOOS)
      v.Set("Arch", runtime.GOARCH)
      if kernelVersion, err := kernel.GetKernelVersion(); err == nil {
        v.Set("KernelVersion", kernelVersion.String())
      }
      if _, err := v.WriteTo(job.Stdout); err != nil {
        return job.Error(err)
      }
      return engine.StatusOK
    }

#### 注册registry的Handler

registry.NewService().Install(eng)的实现过程位于./docker/registry/service.go，在eng对象对外暴露的API信息中添加docker registry的信息。当registry.NewService()成功被Install安装完毕的话，则有两个调用能够被eng使用：”auth”，向公有registry进行认证；”search”，在公有registry上搜索指定的镜像。

Install的具体实现如下：

    func (s *Service) Install(eng *engine.Engine) error {
      eng.Register("auth", s.Auth)
      eng.Register("search", s.Search)
      return nil
    }

至此，所有builtins的加载全部完成，实现了向eng对象注册特定的Handler。

#### 使用goroutine 加载daemon对象并运行

执行完builtins的加载，回到mainDaemon()的执行，通过一个goroutine来加载daemon对象并开始运行。这一环节的执行，主要包含三个步骤：

- 通过init函数中初始化的daemonCfg与eng对象来创建一个daemon对象d；
- 通过daemon对象的Install函数，向eng对象中注册众多的Handler；
- 在Docker Daemon启动完毕之后，运行名为”acceptconnections”的job，主要工作为向init守护进程发送”READY=1”信号，以便开始正常接受请求。

代码实现如下：

    go func() {
      d, err := daemon.MainDaemon(daemonCfg, eng)
      if err != nil {
        log.Fatal(err)
      }
      if err := d.Install(eng); err != nil {
        log.Fatal(err)
      }
      if err := eng.Job("acceptconnections").Run(); err != nil {
        log.Fatal(err)
      }
    }()

分析三个步骤所做的工作。

##### 创建daemon对象

daemon.MainDaemon(daemonCfg, eng)是创建daemon对象d的核心部分。主要作用为初始化Docker Daemon的基本环境，如处理config参数，验证系统支持度，配置Docker工作目录，设置与加载多种driver，创建graph环境等，验证DNS配置等。

由于daemon.MainDaemon(daemonCfg, eng)是加载Docker Daemon的核心部分，且篇幅过长，故安排《Docker源码分析》系列的第四篇专文分析这部分。

##### 通过daemon对象为engine注册Handler

当创建完daemon对象，goroutine执行d.Install(eng)，具体实现位于./docker/daemon/daemon.go:

    func (daemon *Daemon) Install(eng *engine.Engine) error {
      for name, method := range map[string]engine.Handler{
        "attach":            daemon.ContainerAttach,
        ……
        "image_delete":      daemon.ImageDelete, 
      } {
        if err := eng.Register(name, method); err != nil {
          return err
        }
      }
      if err := daemon.Repositories().Install(eng); err != nil {
        return err
      }
      eng.Hack_SetGlobalVar("httpapi.daemon", daemon)
      return nil
    }

以上代码的实现分为三部分：

- 向eng对象中注册众多的Handler对象；
- daemon.Repositories().Install(eng)实现了向eng对象注册多个与image相关的Handler，Install的实现位于./docker/graph/service.go；
- eng.Hack_SetGlobalVar("httpapi.daemon", daemon)实现向eng对象中map类型的hack对象中添加一条记录，key为”httpapi.daemon”，value为daemon。

##### 运行acceptconnections的job

在goroutine内部最后运行名为”acceptconnections”的job，主要作用是通知init守护进程，Docker Daemon可以开始接受请求了。

这是源码分析系列中第一次涉及具体Job的运行，以下简单分析”acceptconnections”这个job的运行。

可以看到首先执行eng.Job("acceptconnections")，返回一个Job，随后再执行eng.Job("acceptconnections").Run()，也就是该执行Job的run函数。

eng.Job(“acceptconnections”)的实现位于./docker/engine/engine.go，如下：

    func (eng *Engine) Job(name string, args ...string) *Job {
      job := &Job{
        Eng:    eng,
        Name:   name,
        Args:   args,
        Stdin:  NewInput(),
        Stdout: NewOutput(),
        Stderr: NewOutput(),
        env:    &Env{},
      }
      if eng.Logging {
        job.Stderr.Add(utils.NopWriteCloser(eng.Stderr))
      }
      if handler, exists := eng.handlers[name]; exists {
        job.handler = handler
      } else if eng.catchall != nil && name != "" {
        job.handler = eng.catchall
      }
      return job
    }

由以上代码可知，首先创建一个类型为Job的job对象，该对象中Eng属性为函数的调用者eng，Name属性为”acceptconnections”，没有参数传入。另外在eng对象所有的handlers属性中寻找键为”acceptconnections”记录的值，由于在加载builtins操作中的remote(eng)中已经向eng注册过这样的一条记录，key为”acceptconnections”，value为apiserver.AcceptConnections。因此job对象的handler为apiserver.AcceptConnections。最后返回已经初始化完毕的对象job。

创建完job对象之后，随即执行该job对象的run()函数。Run()函数的实现位于./docker/engine/job.go，该函数执行指定的job，并在job执行完成前一直阻塞。对于名为”acceptconnections”的job对象，运行代码为job.status = job.handler(job)，由于job.handler值为apiserver.AcceptConnections，故真正执行的是job.status = apiserver.AcceptConnections(job)。

进入AcceptConnections的具体实现，位于./docker/api/server/server.go,如下：

    func AcceptConnections(job *engine.Job) engine.Status {
      // Tell the init daemon we are accepting requests
      go  systemd.SdNotify("READY=1")
      if activationLock != nil {
        close(activationLock)
      }
      return engine.StatusOK
    }

重点为go systemd.SdNotify("READY=1")的实现，位于./docker/pkg/system/sd_notify.go，主要作用是通知init守护进程Docker Daemon的启动已经全部完成，潜在的功能是使得Docker Daemon开始接受Docker Client发送来的API请求。

至此，已经完成通过goroutine来加载daemon对象并运行。

#### 打印Docker版本及驱动信息

 回到mainDaemon()的运行流程中，在goroutine的执行之时，mainDaemon()函数内部其它代码也会并发执行。

第一个执行的即为显示docker的版本信息，以及ExecDriver和GraphDriver这两个驱动的具体信息，代码如下：

    log.Printf("docker daemon: %s %s; execdriver: %s; graphdriver: %s",
      dockerversion.VERSION,
      dockerversion.GITCOMMIT,
      daemonCfg.ExecDriver,
      daemonCfg.GraphDriver,
    )

#### Job之serverapi的创建于运行

打印部分Docker具体信息之后，Docker Daemon立即创建并运行名为”serveapi”的job，主要作用为让Docker Daemon提供API访问服务。实现代码位于./docker/docker/daemon.go#L66，如下：

      job := eng.Job("serveapi", flHosts...)
      job.SetenvBool("Logging", true)
      job.SetenvBool("EnableCors", *flEnableCors)
      job.Setenv("Version", dockerversion.VERSION)
      job.Setenv("SocketGroup", *flSocketGroup)

      job.SetenvBool("Tls", *flTls)
      job.SetenvBool("TlsVerify", *flTlsVerify)
      job.Setenv("TlsCa", *flCa)
      job.Setenv("TlsCert", *flCert)
      job.Setenv("TlsKey", *flKey)
      job.SetenvBool("BufferRequests", true)
      if err := job.Run(); err != nil {
        log.Fatal(err)
      }

实现过程中，首先创建一个名为”serveapi”的job，并将flHosts的值赋给job.Args。flHost的作用主要是为Docker Daemon提供使用的协议与监听的地址。随后，Docker Daemon为该job设置了众多的环境变量，如安全传输层协议的环境变量等。最后通过job.Run()运行该serveapi的job。

由于在eng中key为”serveapi”的handler，value为apiserver.ServeApi，故该job运行时，执行apiserver.ServeApi函数，位于./docker/api/server/server.go。ServeApi函数的作用主要是对于用户定义的所有支持协议，Docker Daemon均创建一个goroutine来启动相应的http.Server，分别为不同的协议服务。

由于创建并启动http.Server为Docker架构中有关Docker Server的重要内容，《Docker源码分析》系列会在第五篇专文进行分析。

至此，可以认为Docker Daemon已经完成了serveapi这个job的初始化工作。一旦acceptconnections这个job运行完毕，则会通知init进程Docker Daemon启动完毕，可以开始提供API服务。

#### 总结

本文从源码的角度分析了Docker Daemon的启动，着重分析了mainDaemon()的实现。

Docker Daemon作为Docker架构中的主干部分，负责了Docker内部几乎所有操作的管理。学习Docker Daemon的具体实现，可以对Docker架构有一个较为全面的认识。总结而言，Docker的运行，载体为daemon，调度管理由engine，任务执行靠job。