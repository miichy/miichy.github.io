---
layout: post 
title:  docker container 操作   &   位操作
date: 2014-12-03 19:31:53 
category: 
---

## container 操作

#### 实例

获取正在运行的container的file system (Container ID):

	/var/lib/docker/aufs/mnt/fcb5f68b80d507380ccd5061c90d599fa80b1788ab4062fc8c80e3469bf8e4b1/tomcat/webapps/nami-service/WEB-INF/classes/

实例：
mysql container是file system： 

	/var/lib/docker/aufs/mnt/f1d561252d4c5f83aa5d3fe20e3e1cf35ba98a2a451362f6dbc2c13e68ab6445

mysql存储的数据在： 

	/var/lib/docker/vfs/dir/5b2b2d05b66ad536af040cd024f70aa2dc4600a4baf72241fa0eb9417264823c

将上述的5b2b2d~  目录中的内容拷贝到 /tmp/sql中，使用mnt命令可以将5b2b2d~ 中的数据映射到运行的mysql中：
    
    docker run --name nami -e MYSQL_ROOT_PASSWORD=nami -p 3306:3306 -v /home/fun/sql/:/var/lib/mysql -d mysql:5.5

运行mysql：docker run --name nami -e MYSQL_ROOT_PASSWORD=nami -p 3306:3306 -d mysql:5.5 


	* --name :container的名字
	* 登录sql的用户为：root
	* 密码为docker run中设置的 PASSWORD

### 运行带有nami-docker模板的mysql

    docker run --name nami -e MYSQL_ROOT_PASSWORD=nami -p 3306:3306 -v /home/fun/nami_sql/:/var/lib/mysql -d nami_mysql:0.0.1

#### rethinkdb & shipyard 命令实例

{% highlight bash%}

temari:~# docker run -it -P -d --name shipyard-rethinkdb shipyard/rethinkdb  ///运行rethinkdb
7174232c498685af29d4ace7d6bf9d3de29878503cee2c00167436fed5bf4d62

temari:~# docker port shipyard-rethinkdb 28015   ///查看端口映射情况，没有28015则看所有的映射端口情况
0.0.0.0:49167


temari:~# docker run -it -p 8080:8080 -d --name shipyard shipyard/shipyard:v2 -rethinkdb-addr 0.0.0.0:49167  // 0.0.0.0 比如改为本机的host地址
03581198d10ba76784bc82752a9a371b1be5176019b84744958e2d5ad3a556cb

temari:~# docker ps -a 
CONTAINER ID        IMAGE                       COMMAND                CREATED              STATUS                     PORTS                                                                         NAMES
03581198d10b        shipyard/shipyard:v2        "/app/controller -re   10 seconds ago       Exited (1) 9 seconds ago                                                                                 shipyard             
7174232c4986        shipyard/rethinkdb:latest   "/usr/bin/rethinkdb    About a minute ago   Up About a minute          0.0.0.0:49165->29015/tcp, 0.0.0.0:49166->8080/tcp, 0.0.0.0:49167->28015/tcp   shipyard-rethinkdb   

temari:~# docker logs shipyard
FATA[0000] factory is not able to fill the pool: gorethink: dial tcp 0.0.0.0:49167: connection refused 

{% endhighlight %}

## 位运算符

### NOT

`~`

NOT 0111
=   1000

	与“逻辑非（！）”操作不同

### OR

`|`

   0101
OR 0011
=  0111

与逻辑或运算符(||)区分开

### XOR

`^`

    0101
XOR 0011
=   0110

### AND

`&`

    0101
AND 0011
=   0001

### 位移

左移  `<<`

右移  `>>`

#### 算术移位

固定标志位，移动后补0还是补1，与标志位同。

#### 逻辑移位

连标志位一起操作，空缺补0；
