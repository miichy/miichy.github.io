---
layout: post 
title:  mongodb js 脚本以及MyISAM和InnoDB的区别AND@classmethod和@staticmethod
date: 2015-01-15 09:54:11 
category: database；
---

## mongodb 客户端js脚本

脚本test.js

    var x = new Mongo('127.0.0.1:27017');
    var mydb = x.getDB("test_script");
    mydb.createCollection("table_one",{autoIndexId:true});
    mydb.table_one.validate();

运行（本机 localhost:27017）：
    
     /usr/local/mongodb/bin/mongo ./test.js 

非本机以及特定端口实例：

    usage: /usr/local/mongodb/bin/mongo [options] [db address] [file names (ending in .js)]
    db address can be:
      foo                   foo database on local machine
      192.169.0.5/foo       foo database on 192.168.0.5 machine
      192.169.0.5:9999/foo  foo database on 192.168.0.5 machine on port 9999


## MyISAM和InnoDB的区别

|               | MyISAM        | InnoDB  |
| ------------- |:-------------:| -----:|
| 存储结构      | 每张表被存放在三个文件：frm-表格定义；MYD(MYData)-数据文件；MYI(MYIndex)-索引文件 | 所有的表都保存在同一个数据文件中（也可能是多个文件，或者是独立的表空间文件），InnoDB表的大小只受限于操作系统文件的大小，一般为2GB |
| 存储空间      | MyISAM可被压缩，存储空间较小      |   InnoDB的表需要更多的内存和存储，它会在主内存中建立其专用的缓冲池用于高速缓冲数据和索引 |
| 可移植性、备份及恢复 | 由于MyISAM的数据是以文件的形式存储，所以在跨平台的数据转移中会很方便。在备份和恢复时可单独针对某个表进行操作      |    免费的方案可以是拷贝数据文件、备份 binlog，或者用 mysqldump，在数据量达到几十G的时候就相对痛苦了 |
|事务安全|不支持 每次查询具有原子性|支持 具有事务(commit)、回滚(rollback)和崩溃修复能力(crash recovery capabilities)的事务安全(transaction-safe (ACID compliant))型表|
||||

## @classmethod 与 @staticmethod

区别：classmethod必须有一个类的引用作为第一个参数。staticmethod没有参数。

前者：被调用时，传入class作为第一个参数，这个class不是实例，这意味可以使用这个class以及这个class的属性。
后者：被调用时，不传class的实例，这意味着你可以在class类里放一个函数，但是不能获取class的实例。

[实例](http://stackoverflow.com/questions/12179271/python-classmethod-and-staticmethod-for-beginner)
[实例2](http://stackoverflow.com/questions/136097/what-is-the-difference-between-staticmethod-and-classmethod-in-python)

