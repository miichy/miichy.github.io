---
layout: post 
title:  oracle登录
date: 2015-09-17 09:27:49 
category:  oracle
tags : [oracle,login]
---

## oracle 登录

### 先要su到具有sqlplus权限的用户

### 普通用户登录：sqlplus sys/admin；可以使用conn连接到其他用户：conn sys/admin as sysdba

### 登录到特定数据库：sqlplus sys/admin@orcl

### 以特定用户登录：sqlplus sys/admin as sysdba

## 运行sql脚本

### 以 sqlpuls sys/admin@orcl登录后，进入 SQL>

### 运行sql 脚本

#### SQL>@c:\my_scripts\my_sql_script.sql

#### SQL>START /home/cjones/my_scripts/my_sql_script.sql