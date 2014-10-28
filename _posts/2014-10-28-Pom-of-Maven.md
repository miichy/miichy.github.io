---
layout: post
title:  "maven的POM认识"
date:   2014-10-28 23:27:00
categories: maven,pom
---

## POM的parent

> 子模块需要使用父项目的类

使用<parent>标示，子模块可以使用父项目的类以及资源。但是问题来了：子模块的pom中的parent指向父项目的pom，但是packeging为pom时，｀mvn install｀时，failure的原因是：缺少父项目的jar包，但是父项目的pom目标不是jar包或者war包。

## scope级别

> 将junit的scope设置为test，导致在build的时候，老是报错没有org.junit包。将scope的设置去掉，即可。

----------
明天待确认：将公共类和资源放到另外一个common子模块中，业务子模块继承common模块，是否可以解决mvn install问题？

## 由于本机的密码存储的是账号a的github，而现在将已有的project推到账号b的github，出现了`The requested URL returned error: 403`问题

### 解决方法：

- 编辑 `.git/config`文件
- `url=https://MichaelDrogalis@github.com/derekerdmann/lunch_call.git`改为`url=ssh://git@github.com/derekerdmann/lunch_call.git`
- 保存，然后执行`git push origin master`

文件的原文为下句：

*url = https://github.com/miichy/python_repo.git*