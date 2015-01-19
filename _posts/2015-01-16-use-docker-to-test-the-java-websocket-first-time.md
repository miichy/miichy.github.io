---
layout: post 
title:  ott-websocket利用docker测试
date: 2015-01-16 17:59:08 
category: websocket；docker；
---

##  java websocket 

[java的websocket相关信息](https://github.com/TooTallNate/Java-WebSocket)

客户端的链接以及消息发送：

{% highlight java%}
    WSClient c = new WSClient( new URI( "ws://172.16.12.95:8080/ottauth-    service/websocket/test" ) ); 
            c.connect();

    c.send("hello. websocket");
{% endhighlight%}

## linux运行jar 包

将工程打成jar，选择`Main Class`,指定main函数。linux命令行启动jar文件

    java -Djava.ext.dirs=lib -jar ott-websocket.jar

在jar包所在的目录下创建lib文件，将依赖的jar包(本工程中是java的websocket的jar包)放到lib目录中，运行即可。

## 定制docker image

base image为dockerfile/java

> 启动image: docker run -it --rm -v /home/fun/liumq:/tmp dockerfile/java
> 在container(0278d)中， cp -rf /tmp/ ./        (WORKDIR=/data)
> commit拥有jar包的image，在container所在的宿主机上，docker commit 0278d ott-ws:2.0
> 测试commit images是否可用： docker run -it --rm ott-ws:2.0 java -Djava.ext.dirs=lib -jar ott-websocket.jar 1 8081
> 将ott-ws:2.0 push到本地创库：先打tag：docker tag ott-ws:2.0 fun01:5000/windbell/ott-ws:2.0；然后push ：docker push fun01:5000/windbell/ott-ws:2.0；则仓库ott-ws:2.0为所需要的image。
> 使用：docker run -it --rm ott-ws:2.0 java -Djava.ext.dirs=lib -jar ott-websocket.jar 100 8081

##  初步施压结论

    场景说明：一台机器启动1000个client，（for循环方式启动）。服务器：172.16.XX.XXX:8081（虚拟机，内存：8G）

    实际情况：客户端：服务端接收到370个链接时，客户端报错（OutOfMemoryError: unable to create new native thread）
                                             free memory随着client的数量增加而减少，随着client链接数量的减少而增加，幅度明显
                           服务端：free memory随着成功连接client数目的增加而减少，随着client链接数的减少而增加，幅度不明显
                                                客户端关闭链接后，free memcached短期内仍然减少，过段时间后，free memory才逐渐回升。
    后期改进：1，部署多个客户端机器同时对服务端施压（本次是单台机器施压）
                             2，增加线程方式的启动（现有方式为for循环启动方式）
                             3，本次持续时间较短，短时间内客户端报outofmemory错误

#### TODO-list

使用websocket，现实功能：在手机上可以输入信息到电脑上。