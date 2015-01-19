---
layout: post 
title:  Fig and Docker Compose
date: 2015-01-13 11:14:19 
category: fig;docker-compose;
---

## Home

`官网：快速、隔离部署环境的docker工具`

使用`fig.yml`配置文件定义隔离环境。实例如下：

{% highlight bash%}
web:
  build: .
  command: python app.py
  links:
   - db
  ports:
   - "8000:8000"
db:
  image: postgres
{% endhighlight%}

`fig up`命令将启动整个app。

## fig 在加载不同link之间的依赖时如何依次启动service

[源码](https://github.com/docker/fig/blob/master/fig/project.py)使用了邮箱图强连通分量的Tarjan算法。算法的链接如下：

[链接一-男神byvoid的](https://www.byvoid.com/blog/scc-tarjan)
[链接二-wiki](http://en.wikipedia.org/wiki/Topological_sorting)
[链接三-wiki](http://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm)

    重点：深度优先、广度优先


