---
layout: post 
title:  redis 初试
date: 2014-12-08 16:55:04 
category: redis
---

### 启动redis-server

    /usr/local/bin/redis-server /root/redis-2.6.17/redis.conf

### 启动redis-cli

     /usr/local/bin/redis-cli -h 127.0.0.1 -p 6379 -a passw0rd

### command

[官网文档](http://redis.io/commands)

    > SET foo bar
    > GET foo
    > DEL key1 key2

#### APPEND

#### KEYS

显示符合pattern的key值，`KEYS *`所有的key值。



