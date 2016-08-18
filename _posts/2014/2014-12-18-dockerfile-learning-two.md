---
layout: post 
title:  Dockerfile学习
date: 2014-12-18 20:15:26 
category: 
---

## 将数据放到image中

其一就是在run的命令中加入 -v 命令，如下：

    docker run --name nami -e MYSQL_ROOT_PASSWORD=nami -p 3306:3306 -v /home/fun/sql/:/var/lib/mysql -d mysql:5.5

##### 注意：Dockerfile中的VOLUME与run命令中的`-v`有区别

VOLUME：创建的是host与container之间可以share的文件，（这个路径是同一的？）

我们需要的是将本地的一个文件映射到container的特定路径。比如我们的 `/usr/sql`到container的`/var/lib/mysql`。这个用VOLUME不好使，那我们就使用其他的方式吧。

COPY ： 将`/usr/sql`的文件先拷贝到Dockerfile目录下，COPY和ADD只能操作Dockerfile同目录下的文件；整个文件夹拷贝千万不能写成`COPY sql/* /var/lib/sql`.`*`不能写。

### docker commmit 没有将 -v 挂载的加到新的image中？

使用run命令时，-v进行挂载时，使用commit时，image没有将挂载的文件保存在image中。

### 修改后的Dockerfile，build的是以前的images？

build的参数时用是否使用cache，这个可以加入build过程；还有，如果修改没有对结果造成影响时，（比如错误语句改成错误语句）则images不会生成新的image。

### Dockerfile 中有VOLUME 和EXPOSE不生效，docker run -v -p 才生效？

VOLUME不生效是文章前面提及到的。

EXPOSE和-p的区别：

例子：指定-p run mysql的images，则本地的mysql客户端可以通过container所在的机器以及端口访问mysql。用EXPOSE，并且service 用link链接mysql，且run的时候不指定-p，则service可以链接mysql，但是本地的mysql客户端则不可以通过ip和端口链接mysql 的container。






####  有趣的网站

http://top.jobbole.com/?utm_source=jobboletop-top-nav
http://oszine.com/
http://www.tuicool.com/a/
http://www.geekfan.net/8663/

http://lamarquenyc.com/latest/

http://www.geekfan.net/12966/

