---
layout: post
title:  "AngularJS 初识"
date:   2014-10-30 20:24:00
categories: AngularJS
---



# AngularJS lifecycle

**启动前**以文本的形式保存在文本编辑器中
启动后进行编译和链接，作用域会同HTML进行绑定，对用户在HTML中的操作进行实时响应

**编译阶段：**AngularJS遍历整个HTML文档且根据JavaScript中的指定定义来处理页面上的声明的指令

**模块加载阶段：**在提供者注册和配置的过程中对模块进行配置。

运行块，在注入器创建后就被执行，是AngularJS钟第一个被执行的方法

**依赖注入：**

**服务：**
视图如何同`$scope`绑定；控制器如何管理数据；
服务，提供能在应用的整个生命周期中保持数据的方法，能够在控制器之间进行通信，并保持数据一致性。

单例对象，被`$injector`实例化，延迟加载，需要用的时候才被创建。

如`$http`服务，

使用服务：在控制器、指令、过滤器或者另外一个服务中通过依赖声明的方式来使用服务。

- **5种方法创建：**
	
	- factory（）
	- service（）
	- constant（）
	- value()
	- provider()

同外界通信：XHR和服务器通信

拦截器是$http服务的基础中间件，用来向应用的业务流程注入新的逻辑。

Restangular：和外部世界通信

Promise：事件系统，promise的自动执行。

服务器通信


## 事件

### 事件传播

$emit  冒泡事件
$broadcast  向下传递事件

### 事件监听

$on  监听

## awsome sublime text pulugin url

[best plugins for sublime](http://ipestov.com/the-best-plugins-for-sublime-text/)

[meteor](https://www.meteor.com/install)

### 用Python写的插件，试试自己写个属于自己的！

## Note
https://signup.live.com/signup.aspx?lic=1

chateldon Liu

591859717@qq.com

\*\*\*\*\*\*\*\*\*\*

Primary Account Key:    RRpd2kU7pQdqNF8LfGaW4If3/9y/qwzcZqbARh52mKE

Customer ID:    f199f2c3-63c8-4a52-9470-65c99d8bfa44

