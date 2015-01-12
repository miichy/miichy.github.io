---
layout: post 
title:  Docker源码分析-四
date: 2014-12-19 17:07:28 
category: docker resource
---

## 转载文章 

[原文出处](http://www.infoq.com/cn/articles/docker-source-code-analysis-part4)

## NewDaemon 作用简介

Docker Daemon中的daemon实例用于统一化管理graph，graphdrive，execdrive，networkdriver，volums等资源的。

NewDaemon函数的执行完成了Docker Daemon创建并加载daemon的任务，最终实现统一管理Docker Daemon的资源

## NewDaemon源码分析

Docker Daemon加载过程中的实现如下图：

![NewDaemon-1](img/NewDaemon-1.jpg)

过程包括12个独立的步骤：处理配置信息、检测系统支持及用户权限、配置工作路径、加载并配置graphdriver、创建DockerDaemon网络环境、创建并初始化graphdb、创建execdrive、创建daemon实例、检测DNS配置、加载已有container、设置shutdown处理方法、返回daemon实例。

## NewDaemon具体实现

goroutine加载daemon对象并运行，在加载并运行daemon对象时，第一个工作即：

    d,err := daemon.NewDaemon(daemonCfg.eng)

该部分代码分析如下：

    > 函数名：NewDaemon
    > 位置：./docker/daemon;
    > 文件：./docker/daemon/daemon.go
    > 实参：daemonCfg，定义运行过程的配置信息；eng,在mainDaemon创建Engine对象实例。
    > 函数返回：d,具体的Daemon对象；err，错误状态。

具体的实现代码：

{% highlight go%}
func NewDaemon(config *Config, eng *engine.Engine) (*Daemon, error) {
    daemon, err := NewDaemonFromDirectory(config, eng)
    if err != nil {
        return nil, err
    }
    return daemon, nil
}
{% endhighlight %}

通过NewDaemonFromDirectory函数实现创建Daemon的运行环境。该函数的实现，参数与返回类型与NewDaemon函数相同。

### 应用配置信息

NewDaemonFromDirectory的第一个工作：如何传入配置信息。配置信息功能：供用户配置Docker的可选功能，使得Docker的运行更贴近用户期待的运行场景。

配置信息的处理包括：

    > 配置Docker容器MTU
    > 检测网桥配置信息
    > 查验容器通信配置
    > 处理PID文件配置

#### 配置Docker容器的MTU

config信息中的mtu应用于容器网络的最大传输单元(MTU)特性。有关MTU的源码：

    if config.Mtu == 0 {
    config.Mtu = GetDefaultNetworkMtu()

若config信息中mtu的值为0时，则通过GetDefaultNetworkMtu函数将MTU设定为默认的值；否则，采用config的mtu值。由于默认的配置文件`./docker/daemon/config.go`中，初始化时mtu属性值为0，所以执行GetDefaultNetworkMtu。

GetDefaultNetworkMtu函数具体实现在`./docker/daemon/config.go`：

    func GetDefaultNetworkMtu() int {
        if iface, err := networkdriver.GetDefaultRouteIface(); err == nil {
            return iface.MTU
        }
        return defaultNetworkMtu
    }

GetDefaultNetworkMtu通过networkdriver包的GetDefaultRouteIface方法获取具体的网络设备，若该网络设备存在，则返回该网络设备的MTU属性值；否则的话，返回默认的MTU值defaultNetworkMtu，值为1500.

#### 检测网桥配置信息

处理完config的Mtu属性后，马上检测config的BridgeIface和BridgeIP这两个信息。BridgeIface和BridgeIP的作用是为创建网桥的任务“init_networkdriver”提供参数。代码如下：

    if config.BridgeIface != "" && config.BridgeIP != "" {
        return nil, fmt.Errorf("You specified -b & --bip, mutually exclusive options. 
    Please specify only one.")
    }

以上的代码含义为：若config中BridgeIface和BridgeIP两个属性均不为空，则返回nil对象，并返回错误信息，错误信息内容为：用户同时制定了BridgeIface和BridgeIp，该两个属性为互斥类型，至多指定其中之一。默认配置中，BridgeIface和BridgeIp均为空。

#### 查验容器通信配置

检测容器的通信配置，主要是针对config中的EnableIptables和InterContainerCommunication这两个属性。EnableIptables属性的作用是启动Docker对iptables规则的添加功能；InterContainerCommunication的作用是启用Docker container之间互相通信的功能。代码如下：

    if !config.EnableIptables && !config.InterContainerCommunication {
        return nil, fmt.Errorf("You specified --iptables=false with --icc=
    false. ICC uses iptables to function. Please set --icc or --iptables to true.")
    }

若EnableIptables和InterContainerCommunication两个属性均为false，则返回nil对象以及错误信息。两个属性至少其中之一为true。在默认配置中，两个属性均为true。

#### 处理网络功能配置

处理config中的DisableNetwork属性，以备后续在创建并执行创建Docker Daemon网络环境时使用，即在名为“init_networkdriver”的job创建并运行中体现。

    config.DisableNetwork = config.BridgeIface == DisableNetworkBridge

由于config中的BridgeIface属性为空，另外DisableNetworkBridge的值为字符串“none”，因此最终config中DisableNetwork的值为false。后续名为“init_networkdriver”的job在执行过程中需要使用该属性。

#### 处理PID文件配置

处理PID文件配置，主要工作是：为DockerDaemon进程运行时的PID号创建一个PID文件，文件的路径为config的Pidfile属性。并且为DockerDaemon的shutdown操作添加一个删除该Pidfile的函数，以便在DockerDaemon退出的时候，可以在第一时间删除该Pidfile。处理PID文件配置信息的代码如下：

    if config.Pidfile != "" {
        if err := utils.CreatePidFile(config.Pidfile); err != nil {
            return nil, err
        }
        eng.OnShutdown(func() {
            utils.RemovePidFile(config.Pidfile)
        })
    }

首先检测config的Pidfile属性是否为空，为空则跳过代码块继续执行；若不为空，则首先在文件系统中创建具体的Pidfile，然后想eng的onShutdown属性添加一个处理函数，函数具体完成的工作位utils.RemovePidFile(config.Pidfile)，即在DockerDaemon进行shutdown操作时，删除Pidfile文件。默认配置中，Pidfile文件的初始值为`/var/run/docker.pid`.

### 检测系统支持以及用户权限

初步处理完Docker的配置信息后，Docker对自身运行的环境进行了一些列的检测，主要包括三方面：

    > 操作系统类型对DockerDaemon的支持；
    > 用户权限的级别；
    > 内核版本与处理器的支持

系统支持与用户权限检测的实现，实现代码如下：

    if runtime.GOOS != "linux" {
        log.Fatalf("The Docker daemon is only supported on linux")
    }
    if os.Geteuid() != 0 {
        log.Fatalf("The Docker daemon needs to be run as root")
    }
    if err := checkKernelAndArch(); err != nil {
        log.Fatalf(err.Error())
    }

首先通过runtime.GOOS，检测操作系统的类型。runtime.GOOS返回运行程序所在操作系统的类型，可以是Linux，Darwin，FreeBSD等。结合具体代码，可以发现，若操作系统不为Linux的话，则报错Fatal错误日志，内容为“DockerDaemon只能支持Linux操作系统”。

接着，通过os.Geteuid()，检测程序用户是否拥有足够的权限。os.Geteuid()返回调用者所在组的group id。结合具体代码，也就是说若返回不为0，则说明不是以root用户的身份运行，报出Fatal日志。

最后，通过checkKernelAndArch()，检测内核版本以及主机处理器类型。checkKernelAndArch()的实现位于`./docker/daemon/daemon.go`。实现过程汇总，第一个工作是：检测程序运行所在的处理器架构是否为“amd64”，而目前Docker运行时只能支持amd64的处理器架构。第二个工作是：检测Linux内核版本是否满足要求，而目前DockerDaemon运行所需的内核版本若过低，则必须升级至3.8.0.

### 配置工作路径

配置DockerDaemon的工作路径，主要创建DockerDaemon运行中所在的工作目录。实现过程中，通过config的Root属性来完成。在默认配置中，Root属性为`/var/lib/docker`。

在配置工作路径的代码实现中，步骤如下：

    > 使用规范路径创建一个TempDir，路径名为tmp；
    > 通过tmp，创建一个指向tmp的文件符号链接realTmp；
    > 使用realTemp的值，创建并复制为环境变量TMPDIR；
    > 处理config的属性EnableSelinuxSupport；
    > 将realRoot重新赋值给config.Root,并创建DockerDaemon的工作根目录。


### 加载并配置graphdriver

加载并配置存储驱动graphdriver，目的在于：使得DockerDaemon创建Docker镜像管理所需的驱动环境。Graphdriver用于完成Docker容器镜像的管理，包括存储与获取。

#### 创建graphdriver

源码： `./docker/daemon/daemon.go#L743-L790`,具体细节如下：

    graphdriver.DefaultDriver = config.GraphDriver
    driver, err := graphdriver.New(config.Root, config.GraphOptions)

首先，为graphdriver包中的DefaultDriver对象赋值，值为config中的Graphdriver属性，在默认配置中，GraphDriver属性的值为空；同样，属性GraphOption也为空。然后通过graphDrive中的new函数实现加载graph的存储驱动。

创建具体的graphdriver是相当重要的一个环节，实现细节由graphdriver包中的New函数来完成。进入`./docker/daemon/graphdriver/driver.go`中，实现步骤如下：

第一，遍历数组选择graphdriver，数组内容为os.Getenv("DOCKER_DRIVER")和DefaultDriver。若不为空，则通过GetDriver函数直接返回相应的Driver对象实例，若均为空，则继续往下执行。这部分的作用是：让graphdriver的加载，首先满足用户的自动以选择，然后满足默认值。代码如下：

    for _, name := range []string{os.Getenv("DOCKER_DRIVER"), DefaultDriver} {
        if name != "" {
            return GetDriver(name, root, options)
        }
    }

第二，遍历优先级数组选择graphdriver，优先级数组的内容依次为“aufs”，“brtfs”，“devicemapper”和“vfs”。若依次验证时，GetDriver成功，则直接返回相应的Driver对象实例，若均不成功，则继续往下执行。这个部分的作用是：在没有指定以及默认的Driver时，从优先级数组中选择Driver，目前优先级最高的为“aufs”。代码如下：

    for _, name := range priority {
        driver, err = GetDriver(name, root, options)
        if err != nil {
            if err == ErrNotSupported || err == ErrPrerequisites || err == ErrIncompatibleFS {
                continue
            }
            return nil, err
        }
        return driver, nil
    }

第三，从已经注册的drivers数组中选择graphdriver。在“aufs”，“btrfs”，“devicemapper”和“vfs”四个不同类型的drivers的init函数中，它们均想graphdriver的drivers数组注册了相应的初始化方法。分别位于`./docker/daemon/graphdriver/aufs/aufs.go`，以及其他三类driver的相应位置。这部分内容的作用是：在没有优先级drivers数组的时候，同样可以通过注册的drivers来选择具体的graphdriver。

#### 验证btrfs与SELinux的兼容性

由于目前在btrfs文件系统上运行的Docker不兼容SELinux，因此当config中配置信息需要的启用SELinux的支持并且driver的类型为btrfs时，返回nil对象，并报出Fatel日志。代码如下：

    // As Docker on btrfs and SELinux are incompatible at present, error on both being enabled
    if config.EnableSelinuxSupport && driver.String() == "btrfs" {
    return nil, fmt.Errorf("SELinux is not supported with the BTRFS graph driver!")
    }

#### 创建容器创库目录

DockerDaemon在创建Docker容器之后，需要将容器放置在某个创库目录下，统一管理。而这个目录即为daemonRepo，值为`/var/lib/docker/containers`，并通过daemonRepo创建相应的目录。代码如下：

    daemonRepo := path.Join(config.Root, "containers")
    if err := os.MkdirAll(daemonRepo, 0700); err != nil && !os.IsExist(err) {
        return nil, err
    }

#### 迁移容器至aufs类型

当graphdriver的类型为aufs时，需要将现有graph的所有内容都迁移至aufs类型；若不为aufs，则继续往下执行。实现代码如下：

    if err = migrateIfAufs(driver, config.Root); err != nil {
    return nil, err
    }

这部分的迁移内容主要包括Repositories，Images以及Containers，具体实现位于.`/docker/daemon/graphdriver/aufs/migrate.go`。

    func (a *Driver) Migrate(pth string, setupInit func(p string) error) error {
        if pathExists(path.Join(pth, "graph")) {
            if err := a.migrateRepositories(pth); err != nil {
                return err
            }
            if err := a.migrateImages(path.Join(pth, "graph")); err != nil {
                return err
            }
            return a.migrateContainers(path.Join(pth, "containers"), setupInit)
        }
        return nil
    }

    migrate repositories的功能是：在Docker Daemon的root工作目录下创建repositories-aufs的文件，存储所有与images相关的基本信息。

    migrate images的主要功能是：将原有的image镜像都迁移至aufs driver能识别并使用的类型，包括aufs所规定的layers，diff与mnt目录内容。

    migrate container的主要功能是：将container内部的环境使用aufs driver来进行配置，包括，创建container内部的初始层（init layer），以及创建原先container内部的其他layers。


#### 创建镜像graph

创建镜像graph的主要工作是：在文件系统中指定的root目录下，实例化一个全新的graph对象，作用为：存储所有标记的文件系统镜像，并记录镜像之间的关系。实现代码如下：

    g, err := graph.NewGraph(path.Join(config.Root, "graph"), driver)

NewGraph的具体实现位于`./docker/graph/graph.go`，实现过程中返回的对象为Graph类型，定义如下：

type Graph struct {
    Root    string
    idIndex *truncindex.TruncIndex
    driver  graphdriver.Driver
}
其中Root表示graph的工作根目录，一般为”/var/lib/docker/graph”；idIndex使得检索字符串标识符时，允许使用任意一个该字符串唯一的前缀，在这里idIndex用于通过简短有效的字符串前缀检索镜像与容器的ID；最后driver表示具体的graphdriver类型。

#### 创建volumesdriver以及volumes graph

在Docker中volume的概念是：可以从Docker宿主机上挂载到Docker容器内部的特定目录。一个volume可以被多个Docker容器挂载，从而Docker容器可以实现互相共享数据等。在实现volumes时，Docker需要使用driver来管理它，又由于volumes的管理不会像容器文件系统管理那么复杂，故Docker采用vfs驱动实现volumes的管理。代码实现如下：

    volumesDriver, err := graphdriver.GetDriver("vfs", config.Root, config.GraphOptions)
    volumes, err := graph.NewGraph(path.Join(config.Root, "volumes"), volumesDriver)

主要完成工作为：使用vfs创建volumesDriver；创建相应的volumes目录，并返回volumes graph对象。

#### 创建TagStore

TagStore主要是用于存储镜像的仓库列表（repository list）。代码如下：

    repositories, err := graph.NewTagStore(path.Join(config.Root, "repositories-"+driver.String()), g)

NewTagStore位于./docker/graph/tags.go，TagStore的定义如下：

    type TagStore struct {
        path         string
        graph        *Graph
        Repositories   map[string]Repository
        sync.Mutex
        pullingPool    map[string]chan struct{}
        pushingPool   map[string]chan struct{}
    }

需要阐述的是TagStore类型中的多个属性的含义：

    > path：TagStore中记录镜像仓库的文件所在路径；
    > graph：相应的Graph实例对象；
    > Repositories：记录具体的镜像仓库的map数据结构；
    > sync.Mutex：TagStore的互斥锁
    > pullingPool ：记录池，记录有哪些镜像正在被下载，若某一个镜像正在被下载，则驳回其他Docker Client发起下载该镜像的请求；
    > pushingPool：记录池，记录有哪些镜像正在被上传，若某一个镜像正在被上传，则驳回其他Docker Client发起上传该镜像的请求；


### 创建DockerDaemon网络环境

创建Docker Daemon运行环境的时候，创建网络环境是极为重要的一个部分，这不仅关系着容器对外的通信，同样也关系着容器间的通信。

在创建网络时，Docker Daemon是通过运行名为”init_networkdriver”的job来完成的。代码如下：

    if !config.DisableNetwork {
        job := eng.Job("init_networkdriver")

        job.SetenvBool("EnableIptables", config.EnableIptables)
        job.SetenvBool("InterContainerCommunication", config.InterContainerCommunication)
        job.SetenvBool("EnableIpForward", config.EnableIpForward)
        job.Setenv("BridgeIface", config.BridgeIface)
        job.Setenv("BridgeIP", config.BridgeIP)
        job.Setenv("DefaultBindingIP", config.DefaultIp.String())

        if err := job.Run(); err != nil {
            return nil, err
        }
    }

分析以上源码可知，通过config中的DisableNetwork属性来判断，在默认配置文件中，该属性有过定义，却没有初始值。但是在应用配置信息中处理网络功能配置的时候，将DisableNetwork属性赋值为false，故判断语句结果为真，执行相应的代码块。

首先创建名为”init_networkdriver”的job，随后为该job设置环境变量，环境变量的值如下：

    > 环境变量EnableIptables，使用config.EnableIptables来赋值，为true；
    > 环境变量InterContainerCommunication，使用config.InterContainerCommunication来赋值，为true；
    > 环境变量EnableIpForward，使用config.EnableIpForward来赋值，值为true；
    > 环境变量BridgeIface，使用config.BridgeIface来赋值，为空字符串””;
    > 环境变量BridgeIP，使用config.BridgeIP来赋值，为空字符串””;
    > 环境变量DefaultBindingIP，使用config.DefaultIp.String()来赋值，为”0.0.0.0”。

设置完环境变量之后，随即运行该job，由于在eng中key为”init_networkdriver”的handler，value为bridge.InitDriver函数，故执行bridge.InitDriver函数，具体的实现位于./docker/daemon/networkdriver/bridge/dirver.go，作用为：

    > 获取为Docker服务的网络设备的地址；
    > 创建指定IP地址的网桥；
    > 启用Iptables功能并配置；
    > 另外还为eng实例注册了4个Handler,如 ”allocate_interface”， ”release_interface”， ”allocate_port”，”link”。    

#### 创建Docker网络设备

创建Docker网络设备，属于Docker Daemon创建网络环境的第一步，实际工作是创建名为“docker0”的网桥设备。

在InitDriver函数运行过程中，首先使用job的环境变量初始化内部变量；然后根据目前网络环境，判断是否创建docker0网桥，若Docker专属网桥已存在，则继续往下执行；否则的话，创建docker0网桥。具体实现为createBridge(bridgeIP)，以及createBridgeIface(bridgeIface)。

createBridge的功能是：在host主机上启动创建指定名称网桥设备的任务，并为该网桥设备配置一个与其他设备不冲突的网络地址。而createBridgeIface通过系统调用负责创建具体实际的网桥设备，并设置MAC地址，通过libcontainer中netlink包的CreateBridge来实现。

#### 启用iptables功能

创建完网桥之后，Docker Daemon为容器以及host主机配置iptables，包括为container之间所需要的link操作提供支持，为host主机上所有的对外对内流量制定传输规则等。代码位于`./docker/daemon/networkdriver/bridge/driver/driver.go#L133-L137`,如下：

    // Configure iptables for link support
    if enableIPTables {
        if err := setupIPTables(addr, icc); err != nil {
            return job.Error(err)
        }
    }

其中setupIPtables的调用过程中，addr地址为Docker网桥的网络地址，icc为true，即为允许Docker容器间互相访问。假设网桥设备名为docker0，网桥网络地址为docker0_ip,设置iptables规则，操作步骤如下：

(1) 使用iptables工具开启新建网桥的NAT功能，使用命令如下：

    iptables -I POSTROUTING -t nat -s docker0_ip ! -o docker0 -j MASQUERADE

(2) 通过icc参数，决定是否允许container间通信，并制定相应iptables的Forward链。Container之间通信，说明数据包从container内发出后，经过docker0，并且还需要在docker0处发往docker0，最终转向指定的container。换言之，从docker0出来的数据包，如果需要继续发往docker0，则说明是container的通信数据包。命令使用如下：

    iptables -I FORWARD -i docker0 -o docker0 -j ACCEPT

(3) 允许接受从container发出，且不是发往其他container数据包。换言之，允许所有从docker0发出且不是继续发向docker0的数据包，使用命令如下：

    iptables -I FORWARD -i docker0 ! -o docker0 -j ACCEPT

(4) 对于发往docker0，并且属于已经建立的连接的数据包，Docker无条件接受这些数据包，使用命令如下：

    iptables -I FORWARD -o docker0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

#### 启用系统数据包转发功能

在Linux系统上，数据包转发功能是被默认禁止的。数据包转发，就是当host主机存在多块网卡的时，如果其中一块网卡接收到数据包，并需要将其转发给另外的网卡。通过修改/proc/sys/net/ipv4/ip_forward的值，将其置为1，则可以保证系统内数据包可以实现转发功能，代码如下：

    if ipForward {
        // Enable IPv4 forwarding
        if err := ioutil.WriteFile("/proc/sys/net/ipv4/ip_forward", []byte{'1', '\n'}, 0644); err != nil {
            job.Logf("WARNING: unable to enable IPv4 forwarding: %s\n", err)
        }
    }

#### 创建DOCKER链

在网桥设备上创建一条名为DOCKER的链，该链的作用是在创建Docker container并设置端口映射时使用。实现代码位于.`/docker/daemon/networkdriver/bridge/driver/driver.go`，如下：

    if err := iptables.RemoveExistingChain("DOCKER"); err != nil {
        return job.Error(err)
    }
    if enableIPTables {
        chain, err := iptables.NewChain("DOCKER", bridgeIface)
        if err != nil {
            return job.Error(err)
        }
            portmapper.SetIptablesChain(chain)
    }

#### 注册Handler至Engine

在创建完网桥，并配置完基本的iptables规则之后，Docker Daemon在网络方面还在Engine中注册了4个Handler，这些Handler的名称与作用如下：

    > allocate_interface：为Docker container分配一个专属网卡；
    > realease_interface：释放网络设备资源；
    > allocate_port：为Docker container分配一个端口；
    > link：实现Docker container间的link操作。

由于在Docker架构中，网络是极其重要的一部分，因此Docker网络篇会安排在《Docker源码分析》系列的第六篇。

#### 创建graphdb并初始化

Graphdb是一个构建在SQLite之上的图形数据库，通常用来记录节点命名以及节点之间的关联。Docker Daemon使用graphdb来记录镜像之间的关联。创建graphdb的代码如下：

    graphdbPath := path.Join(config.Root, "linkgraph.db")
    graph, err := graphdb.NewSqliteConn(graphdbPath)
    if err != nil {
        return nil, err
    }

以上代码首先确定graphdb的目录为`/var/lib/docker/linkgraph.db`；随后通过graphdb包内的NewSqliteConn打开graphdb，使用的驱动为”sqlite3”，数据源的名称为” /var/lib/docker/linkgraph.db”；最后通过NewDatabase函数初始化整个graphdb，为graphdb创建entity表，edge表，并在这两个表中初始化部分数据。NewSqliteConn函数的实现位于`./docker/pkg/graphdb/conn_sqlite3.go`，代码实现如下：

    func NewSqliteConn(root string) (*Database, error) {
        ……
        conn, err := sql.Open("sqlite3", root)
        ……
        return NewDatabase(conn, initDatabase)
    }

#### 创建execdriver

Execdriver是Docker中用来执行Docker container任务的驱动。创建并初始化graphdb之后，Docker Daemon随即创建了execdriver，具体代码如下：

    ed, err := execdrivers.NewDriver(config.ExecDriver, config.Root, sysInitPath, sysInfo)

可见，在创建execdriver的时候，需要4部分的信息，以下简要介绍这4部分信息：

    > config.ExecDriver:Docker运行时中指定使用的exec驱动类别，在默认配置文件中默认使用”native”,也可以将这个值改为”lxc”，则使用lxc接口执行Docker container内部的操作;
    > config.Root:Docker运行时的root路径，默认配置文件中为”/var/lib/docker”;
    > sysInitPath:系统上存放dockerinit二进制文件的路径，一般为”/var/lib/docker/init/dockerinit-1.2.0”;
    > sysInfo:系统功能信息，包括：容器的内存限制功能，交换区内存限制功能，数据转发功能，以及AppArmor安全功能等。

在执行execdrivers.NewDriver之前，首先通过以下代码，获取期望的目标dockerinit文件的路径localPath，以及系统中dockerinit文件实际所在的路径sysInitPath：

    localCopy := path.Join(config.Root, "init", fmt.Sprintf("
    dockerinit-%s", dockerversion.VERSION))
    sysInitPath := utils.DockerInitPath(localCopy)

通过执行以上代码，localCopy为”/var/lib/docker/init/dockerinit-1.2.0”，而sysyInitPath为当前Docker运行时中dockerinit-1.2.0实际所处的路径，utils.DockerInitPath的实现位于 ./docker/utils/util.go。若localCopy与sysyInitPath不相等，则说明当前系统中的dockerinit二进制文件，不在localCopy路径下，需要将其拷贝至localCopy下，并对该文件设定权限。

设定完dockerinit二进制文件的位置之后，Docker Daemon创建sysinfo对象，记录系统的功能属性。SysInfo的定义，位于.`/docker/pkg/sysinfo/sysinfo.go`，如下：

    type SysInfo struct {
        MemoryLimit            bool
        SwapLimit              bool
        IPv4ForwardingDisabled bool
        AppArmor               bool
    }

其中MemoryLimit通过判断cgroups文件系统挂载路径下是否均存在`memory.limit_in_bytes`和`memory.soft_limit_in_bytes`文件来赋值，若均存在，则置为true，否则置为false。SwapLimit通过判断`memory.memsw.limit_in_bytes`文件来赋值，若该文件存在，则置为true，否则置为false。AppArmor通过host主机是否存在`/sys/kernel/security/apparmor`来判断，若存在，则置为true，否则置为false。

执行execdrivers.NewDriver时，返回execdriver.Driver对象实例，具体代码实现位于 `./docker/daemon/execdriver/execdrivers/execdrivers.go`，由于选择使用native作为exec驱动，故执行以下的代码，返回最终的execdriver，其中native.NewDriver实现位于.`/docker/daemon/execdriver/native/driver.go`：

    return native.NewDriver(path.Join(root, "execdriver", "native"), initPath)

至此，已经创建完毕一个execdriver的实例ed。

### 创建daemon实例

Docker Daemon在经过以上诸多设置以及创建对象之后，整合众多内容，创建最终的Daemon对象实例daemon，实现代码如下：

    daemon := &Daemon{
        repository:     daemonRepo,
        containers:     &contStore{s: make(map[string]*Container)},
        graph:          g,
        repositories:   repositories,
        idIndex:        truncindex.NewTruncIndex([]string{}),
        sysInfo:        sysInfo,
        volumes:        volumes,
        config:         config,
        containerGraph: graph,
        driver:         driver,
        sysInitPath:    sysInitPath,
        execDriver:     ed,
        eng:            eng,
    }

以下分析Daemon类型的属性：

属性名|作用 
:---------------|:---------------
repository|部署所有Docker容器的路径
containers|用于存储具体Docker容器信息的对象
graph|存储Docker镜像的graph对象
repositories|存储Docker镜像元数据的文件
idIndex|用于通过简短有效的字符串前缀定位唯一的镜像
sysInfo|系统功能信息
volumes|管理host主机上volumes内容的graphdriver，默认为vfs类型
config|Config.go文件中的配置信息，以及执行产生的配置DisableNetwork
containerGraph|存放Docker镜像关系的graphdb
driver|管理Docker镜像的驱动graphdriver，默认为aufs类型
sysInitPath|系统dockerinit二进制文件所在的路径
execDriver|Docker Daemon的exec驱动，默认为native类型
eng|Docker的执行引擎Engine类型实例

### 检测DNS配置

创建完Daemon类型实例daemon之后，Docker Daemon使用daemon.checkLocaldns()检测Docker运行环境中DNS的配置， checkLocaldns函数的定义位于`./docker/daemon/daemon.go`，代码如下：

    func (daemon *Daemon) checkLocaldns() error {
        resolvConf, err := resolvconf.Get()
        if err != nil {
            return err
        }
        if len(daemon.config.Dns) == 0 && utils.CheckLocalDns(resolvConf) {
            log.Infof("Local (127.0.0.1) DNS resolver found in resolv.conf and 
    containers can't use it. Using default external servers : %v", DefaultDns)
            daemon.config.Dns = DefaultDns
        }
        return nil
    }

以上代码首先通过resolvconf.Get()方法获取/etc/resolv.conf中的DNS服务器信息。若本地DNS 文件中有127.0.0.1，而Docker container不能使用该地址，故采用默认外在DNS服务器，为8.8.8.8，8.8.4.4，并将其赋值给config文件中的Dns属性。

### 启动时加载已有Docker  containers

当Docker Daemon启动时，会去查看在daemon.repository，也就是在/var/lib/docker/containers中的内容。若有存在Docker container的话，则让Docker Daemon加载这部分容器，将容器信息收集，并做相应的维护。

#### 设置shutdown的处理方法

加载完已有Docker container之后，Docker Daemon设置了多项在shutdown操作中需要执行的handler。也就是说：当Docker Daemon接收到特定信号，需要执行shutdown操作时，先执行这些handler完成善后工作，最终再实现shutdown。实现代码如下：

    eng.OnShutdown(func() {
        if err := daemon.shutdown(); err != nil {
            log.Errorf("daemon.shutdown(): %s", err)
        }
        if err := portallocator.ReleaseAll(); err != nil {
            log.Errorf("portallocator.ReleaseAll(): %s", err)
        }
        if err := daemon.driver.Cleanup(); err != nil {
            log.Errorf("daemon.driver.Cleanup(): %s", err.Error())
        }
        if err := daemon.containerGraph.Close(); err != nil {
            log.Errorf("daemon.containerGraph.Close(): %s", err.Error())
        }
    })

可知，eng对象shutdown操作执行时，需要执行以上作为参数的func(){……}函数。该函数中，主要完成4部分的操作：

    > 运行daemon对象的shutdown函数，做daemon方面的善后工作；
    > 通过portallocator.ReleaseAll()，释放所有之前占用的端口资源；
    > 通过daemon.driver.Cleanup()，通过graphdriver实现unmount所有layers中的挂载点；
    > 通过daemon.containerGraph.Close()关闭graphdb的连接。

### 返回daemon对象实例

当所有的工作完成之后，Docker Daemon返回daemon实例，并最终返回至mainDaemon()中的加载daemon的goroutine中继续执行。

### 总结

本文从源码的角度深度分析了Docker Daemon启动过程中daemon对象的创建与加载。在这一环节中涉及内容极多，本文归纳总结daemon实现的逻辑，一一深入，具体全面。

在Docker的架构中，Docker Daemon的内容是最为丰富以及全面的，而NewDaemon的实现而是涵盖了Docker Daemon启动过程中的绝大部分。可以认为NewDaemon是Docker Daemon实现过程中的精华所在。深入理解NewDaemon的实现，即掌握了Docker Daemon运行的来龙去脉。