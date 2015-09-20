---
layout: post 
title:  docker中tomcat image的自定义化
date: 2015-09-17 21:27:49 
category:  docker
tags : [dockerfile,image,tomcat]
---

# 使用tomcat image的困惑

tomcat的dockerfile中为

<pre>
CMD ["catalina.sh","run"]
</pre>

这导致启动image时，attach到容器内部时，停留在的交互界面为catalina.out的log日志中，无法退出日志且保持tomcat不stop。这相信是很多人觉得不方便的地方。如何修改呢？

## CMD与RUN

很多文章都有讲这两个的区别，这里就不赘述了。纪录一下自己的理解。
CMD命令：
> *CMD*：image默认启动为container时的指令。

还有一个重点：每个Dockerfile只有最后一个CMD起作用。为什么是这样：因为是默认的初始指令，必须有明确的一个，所以后面的指令都会覆盖之前的CMD。
RUN命令：
> *RUN*：容器中执行的命令

### 问题
我的Dockerfile大致逻辑（请忽略语法错误）:
<pre>
From tomcat:latest
RUN [修改catalina.sh配置]
RUN [catalina.sh run]
CMD ["/bin/bash"]
</pre>
该dockerfile build得到的image，运行为容器时，该容器中可以与用户进行交互，但是ps没有看到tomcat启动。

#### 为什么出现上述情况？
CMD是默认的启动指定，在上述dockerfile中，<pre>CMD ["/bin/bash"]</pre>覆盖了base image tomcat的<pre>CMD ["catalina.sh","run"]</pre>。很多人会说那我们CMD之前不是还有RUN执行吗？RUN指令在前面说过：是在容器之中指定脚本等的指令。RUN中的运行catalina.sh的run，是在容器中运行的，容器刚启动是不会执行的，因为RUN不是CMD。

## 目标：catalina启动并且停留在bash shell以便交互

修改CMD：
<pre>CMD ["/bin/bash","-c","catalina.sh run ; /bin/bash"]</pre>
结果：tomcat启动了，但是还是停留在catalina.out的log日志中。这是因为shell命令用<pre>;</pre>连接时，前一个命令必须return 执行结果，也就是结束时，才会进行后一个shell命令。

修改CMD：
<pre>CMD ["/bin/bash","-c","catalina.sh start;/bin/bash"]</pre>
bingo!!!  

### catalina.sh run & start

run为停留在该窗口启动tomcat；start为另起窗口启动tomcat。
