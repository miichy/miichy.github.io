---
layout: post 
title:  第一个微信小程序
date: 2016-11-07 23:04:00 
category:  weChat
tags : [wxml,wxss,weChat]
---

### 问题一

```javascript
{
  "pages":[
    "pages/index/index",
    "pages/logs/logs",
    "pages/component/index"
  ],
  "window":{
    "backgroundTextStyle":"light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "WeChat",
    "navigationBarTextStyle":"black"
  }
}
```

第三行第四行去掉后，首页可以正常显示；未删除时，首页不能显示。

### 问题2

如何写一个一秒增加10%的进度条progress。