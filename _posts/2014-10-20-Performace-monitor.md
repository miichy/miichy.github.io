---
layout: post
title:  "Performace Monitor"
date:   2014-10-20 00:16:00
categories: performace
---

------

# 性能测试监控

本文由前两天的thrift服务性能测试而来，用于记录测试中所习所得。测试服务为thrift服务，数据库为mongodb，施压端为本人自己的工作机器，运用的jmeter施压，与之相同且更出名的是LoadRunner。另：[酷壳关于系统调优的方法](http://coolshell.cn/articles/7490.html)

## 测试之前
服务端机器以及数据库所在的机器，关于防火墙设置，端口最大链接数，tcp链接数，tcp链接Alive时间，资源释放间隔时间等等配置。Jmeter的JVM内存配置为1G。RPC server数以及mongodb的连接池数都是需要调整的地方。

## 监控指标

- 监控的指标：服务器端：cpu，Memory，I/O，Disk
- 数据库：cpu，每秒执行操作次数
- 施压端：请求响应时间以及吞吐量

监控工具为nmon，分析数据为nmon analyser。

## 监控过程

测试之前，观察机器的指标是否处于正常。压力测试启动后，利用监控工具收集性能测试指标数据。测试完成后，查看机器的性能指标是否回归到正常范围，分析收集的性能数据，找出瓶颈，得出意见或者结论。

## 具体实施

本次压力测试为了测试用户服务业务所能承受的压力级别。用户服务是采用的thrift框架的rpc服务，前端php调用rpc接口获取跟用户相关的操作数据。

编写测试case，将读数据接口与写数据接口分开，施压工具采用的jmeter。施压开始时，将sample设置为1000*1000，sample跑到6w时，jmeter返回异常。通过查看tcp链接数，发现是tcp链接达到峰值且没有释放所造成的。这是case的编写bug，由于jmeter的junit request中，不能调用before和after class方法，导致的问题是：rpc服务的链接在哪一个阶段链接？

编写case时，将rpc服务的链接写在构造函数中，则case在第一次跑的时候，即刻open rpc服务，而在后续的loop中，则不用链接服务即可调用服务。则jmeter的1000*1000（1000threads ＊ 1000 Loop）sample即为1000个服务链接打开，且每个链接循环1000次。由于java没有希构函数，导致这些链接不会被释放。但是问题：tcp的链接数最大为65535个，为什么1000个就报错了呢？

为了解决这个异常，case的编写改为每一次test case run的时候就打开一次服务链接，获取数据后则关闭链接，则设置1000*1000samples时，意味着打开了一百万的服务链接。而每一次rpc的链接即为一次tcp链接，需要通过三次握手协议，这当然会对响应时间造成一定的影响。

由于希望服务达到的性能为一秒中能承受的服务链接数，因此将1000\*1000,改为1000\*1.读写数据的接口90%line的响应时间均在100ms以内，但是有一个读数据接口，每次读取数据非常大，给接口大响应时间在300ms左右，最大的可以达到十几秒的。这一点是无法忍受的。

并且这是将jmeter的system.out去掉后才有的结果。在调整rpc server的最小数据为1000，最大为5000，mongodb连接池为240\*10后，数据没有明显上升，且在1000\*1和1000\*10时，mongodb的每秒读写最大为2k，而在mongdb的性能测试中，读写最高峰值时2w和5w，而数据库和服务所在的机器cpu负载，仅仅cpu001的峰值为30%，mem最高为400m。

**20141020**
由于jmeter所在机器与rpc服务器不在同一个网段，且rpc服务的tcp三次握手链接比较耗时。因此将jmeter安装在rpc同台机器上施压。响应时间平均有了将近百毫秒的减少。这说明猜测有正确的一面。但是响应时间最大了接口play，在1000*10时，就已经达到了300ms的级别，并且，其中有概率的出现链接超时或者请求达不到指定地址。前者时rpc服务链接超时，后者可能时tcp链接释放不及时。

并且这其中，rpc服务cpu一直60%负荷，这与rpc和jmeter同时运行有关。而mongodb的每秒读写操作在2000左右，因此mongo的可以承受更大的负荷，所以我们将mongdb的连接池从240\*10改成1000\*10，mongodb的每秒读写达到了5000左右，随着sample的增大，甚至出现到9000的每秒读写。鉴于mongo时非cpu耗，于是将jmeter安装在mongdb机器，两台机器负载比较均衡。由于上次jmeter中打印日志造成响应时间的数量级改变，而这个接口是读数据且每条数据十分量大以及在log日志中打印出来。会不会log打印耗费大量读网络流量。从监控看出，最高峰网卡流量达到40M，而将log日志改称ERROR级别时，平均时间下降到40ms级别，这些均在2000\*10samples下的数据。除此之外，每次sample达到6w，则jmeter施压端返回超时链接和请求达不到指定地址。这应该是单台机器的限制，因为tcp的链接峰值就是65535.

---

jmeter的响应时间大大多于方法的调用时间（时序图表示），而这两者时间之差为jmeter发出请求到rpc服务所在机器到时间t1加上rpc服务所在机器将数据返回给jmeter的时间t2。而t1则是rpc服务打开链接且进行通信的时间，这包括rpc链接的tcp三次握手时间。t2为tcp close时间，初步分析，t1远大于t2。Jmeter之所以响应时间如此大跟t1成正比关系。

------

## 性能指标

**Performance tuning**
性能调试是一个过程：找到系统的瓶颈，调试操作系统从而消除瓶颈。这个过程中没有简单的“操作步骤、设置参数”，而是获得一种平衡态，操作系统不同的子系统之间的平衡态。

- **CPU** 
- **Memory**
- **IO**
- **Network**

这些子系统是互相依赖，任何之一满负荷均会影响其他：

- **大量的内存页IO请求会填满内存队列**
- **网络的满负荷也会将cpu耗尽**
- **试图保持内存队列空闲时，cpu也会大量被消耗**
- **大量的从内存写磁盘也可能消耗CPU和IO**

### 调试方法

- 确定监控目标
- 确定监控和分析信息
- 确定监控工具
- 收集数据
- 分析数据
- 调优\& 循环

### 监控工具

Profiler、Jstat、Jconsole、Jmap、Jprofiler、Nmon（监控指标列表）

### 20个常见的瓶颈

- **数据库**
  - 1,工作区超过可使用的RAM
  - 2,长或者短的查询操作
  - 3,写写冲突
  - 4,Large joins 耗费内存
- **Virtualisazion**
  - 1,sharing a HDD,disk seek death ；共享硬盘、磁盘seek death
  - 2,网络IO fluctuations in the cloud
- **程序**
  - 1,线程：死锁、heavyweight as compared to events debugging,non-linear scalability,etc...
  - 2,事件驱动程序：callback complexity，how to store state in function calls。
  - 3,Lack of profiling ,lack of tracing ,lack of loggin 缺少log日志分析
  - 4,one piece can't scale,SPOF,non horizontally scalable,etc；单点故障，非横向可扩展性；
  - 5,Stateful apps；
  - 6,不好的设计
  - 7,algorithm complexity  ；算法复杂性
  - 8,依赖DNS服务，DNS服务有可能阻碍服务。
  - 9,Stack space 堆栈空间
- **磁盘**
  - 1,Local disk access；本地磁盘获取
  - 2,Random disk I/O 随机磁盘I/O -> disk seeks,磁盘搜索
  - 3,Disk fragmentation 磁盘碎片
  - 4,SSDs performance drop once data written is greater than SSD size；一旦数据写入大于固态硬盘的大小，ssd的性能将大大下降
- **OS**
  - 1,Fsync flushing,linux buffer cache filling up  文件同步冲洗，linux缓冲区填满
  - 2,TCP 缓存太小
  - 3,文件描述符限制
  - 4,Power budget 功率分配
- **缓存**
  - 1,没有使用memcached（数据库pummeling）
  - 2,Http：header，etags，not gzipping，等等
  - 3,没有使用浏览器缓存
  - 4,Byte code 缓存，比如PHP
  - 5,L2/L2缓存，这是一个大的瓶颈。将重要的和热数据放在L1/L2.this spans so much:snappy for network I/O,column DBs run algorithms directly on compressed data,etc.Then there are techniques to not destroy your TLB.the most important idea is to have a firm grasp on computer architecture in terms of CPUs multi-core,L1/L2,shared L3,NUMA RAM,data transfer bandwidth/latency from DRAM to chip,DRAM caches DiskPages,DirtyPages,TCP packets travel thru CPU<>DRAM<>NIC.
- **CPU**
  - 1,CPU 超核负载
  - 2,上下文切换－单核中有太多线程，linux调度差，太多系统调用
  - 3,IO等待－所有的同一速率等待
  - 4,CPU缓存:Caching data is a fine grained process(In java think volatile for instance),in order to find the right balance between having multiple instances with different values for data and heavy synchronization to keep the cached date consistent.
  - 5,Backplane throughtput
-**网络**
  - 1,NIC 网卡
  - 2,DNS lookups DNS查找
  - 3,Dropped packets 丢包
  - 4,网络中意外路由 ；unexpected routes
  - 5,网络磁盘access
  - 6,Shared SANs
  - 7,服务失败－没有服务器的任何响应
-**进程Process**
  - 1,测试时间
  - 2,部署时间
  - 3,团队大小
  - 4,Budget
  - 5,Code debt 编程债务
- **内存**
  - 1,内存溢出－杀掉进程、go into swap & grind to a halt
  - 2,内存溢出造成的Disk Thrashing（swap有关）
  - 3,memory library overhead 内存库开销过大
  - 4,内存碎片fragmentation－java需要GC pauses；C中，malloc‘s taking forever。

### 决定程序类型

为了理解从哪里开始寻找和调试瓶颈，首先时要理解系统的行为。系统的应用程序堆栈通常有以下两种类型：

- **偏重IO** －需要大量使用内存和系统的底层存储。这是由于偏重IO的程序需要处理大量数据，并且不需要很多cpu或网络（除非存储系统非本地）。用cpu资源进行IO请求，然后然后进入睡眠状态。数据型应用程序通常被认为是偏重IO程序。
- **偏重CPU** －对CPU的需求量很大。批量处理and和or等数学计算。高容量等web服务、邮件服务、任何渲染类等服务均是偏重CPU应用程序。 

### 决定统计量的基线

举例：**vmstat**

#### procs

- r:运行队列中等待的进程数
- b:等待io的进程数
- w:可进入运行队列但被替换的进程 

### memory

- swpd:被使用的虚拟内存数
- free:空闲的内存
- buff:使用的内存buff数

### swap
- si:虚拟内存的页导入（SWAP DISK导入RAM）
- so:虚拟内存的页导出

### IO

- bi:写入
- bo:写出

### System
- in:每秒的中断数，包括clock？
- sc:每秒上下文的切换数

### CPU

- us:用户时间
- sy:系统时间
- id:空闲时间

## 安装监控软件

## CPU介绍

内核的调度被两种因素所影响：进程与中断。不同资源有不同的优先级，以下是两种优先级从高到低的概括：

- 中断：设备告诉内核已经完成处理：NIC发送包packet或者硬件提供IO请求。
- 系统内核级别处理：所有系统相关的处于这一级别
- 用户处理级别：所有应用程序在这一级别，这也是内和调度机制中最低的级别。

### 上下文切换



(未完待续)
