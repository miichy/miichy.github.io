---
layout: post
title:  "GoAgent3.0升级到3.2，uploader出现的error"
date:   2014-11-16 20:56:00
categories: GOAgent
---

## GoAgent install

[goagent github address](https://github.com/goagent/goagent)

goagent的github上面，有简单的图文教程以及常见问题、配置介绍等等。大家完全可以参考，step by step完成。

## uploader error

由于中间好长一段时间没有更新过goagent，因此在看完 interstellar 后，想看一下星际制作背后的事情，墙内竟然都木有。哎，还有F同学介绍都很多好看都美剧赢剧也得自备楼梯。因此，打算将goagent 升级。

- 下载3.2.2 正式版（github上都有）。
- uploader.bat 上传配置
	- 出现问题：` \“uploader.py\” line 103，in \<module\>`
- 解法
	- 打开goagent.exe，再上传
	- 打开VPN 再上传
	- 删除.appcfg.cookie文件再上传
	- 将ie得代理设置为127.0.0.1再上传
	- google账户关闭二次验证，再上传
	- 将google账号得“不信任应用权限”开启

在反复使用来前四种方法后，还是出现同样得问题。最终再第六种解法中搞定问题，得意顺利安装。

#### 官网文档很重要！

以上得几种解法，有些未必是解法问题所必须做得。但是这些，并且还有其他得解法，都在goagent的github中的常见问题页面中都有，但是网上搜索这些问题的还是很多，并且很多问题的解法都没有作用。所以，如果我当时仔细看官网介绍都常见问题以及其解法，完全不用浪费一个多小时的时间。所以**官网文档仔细看吧，少年！**

### interstellar

昨天跟F同学观看来Nolan兄弟的interstellar，实在是太cool啦。年度神作已不足以夸赞这部剧。在看完之后，看了很多观后感的帖子，（朋友圈里实在有太多人转里，幸亏先见之明，观看之前没有看这些帖子以及剧透）所以看之后更是惊叹不已。因为之前对一些简单对概念都有些许了解，并且F同学也是科幻作品的老残粉。看完之后，经过两个人的讨论，大概也对作品有了了解，没有朋友圈里所说的费脑一说。

在一座熟悉的城市，跟久违的朋友看了很棒的电影，一起交流彼此的生活状态，感觉很好。8.5分的周末。赞一个！