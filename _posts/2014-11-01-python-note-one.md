# python 学习笔记

## 缩进

python中没有明确的块标志`{}`，但是代码缩进却完成了这一个功能。

## 文件处理

### 用pickle dump的时候，每行之前多了一个字符？

`dump（object，file）`将对象写到文件，这个文件可以是实际的物理文件，但也可以是任何类似于文件的对象，这个对象具有write()方法，接受单个的字符串参数；load(file)返回包含在pickle文件中的对象。缺省情况下，dumps和dump使用可打印的ASCII表示来创建pickle。

### 如何解决？

TODO

### 处理异常

raise Exception

## TODO

### 常用模块

- copy 提供复合对象的浅拷贝和深拷贝
- pickle 序列化python对象到bytes流，从而适合存储到文件，网络传输，或数据库存储
- sys 包含跟python解释器和环境相关到变量和函数

- decimal 提高精确度，能表示更大范围到数字
- math 标准到数学方法
- random 提供各种方法用来产生随机数
- fractions
- numbers
- array 于list相似，但是list可以存储不同类型的对象
- bisect 有序的list，内部实现使用的二分法（bisection）
- heapq 使用heap实现的带有优先级的queue
- collections 容器的高性能实现
- operator 提供内置的操作和解析器提供的方法

- codecs 用来处理不同的字符编码于unicode text io的转化
- re 对字符串进行正则表达式的匹配和替换
- string 处理字符串
- struct python和二进制结构间实现转化
- unicodedata 提供访问unicode字符数据库

- sqlite3 SQlite数据库访问的接口
- DBM－style
- shelve 持久化对象

- bz2 处理以bzip2压缩算法压缩的文件
- filecmp 提供函数对比文件和目录
- fnmatch 使用UNIX shell－style的通配符来匹配文件名
- glob  gzip  shutil  tarfile  zipfile  zlib

- cmmands 提供简单的系统命令
- datetime
- errno
- io 实现各种IO形式和内置open函数
- logging 
- subprocess
- time

- multiprocessing
- threading
- queue

- asynchat 应用程序的网络异步处理
- ssl 实现数据加密和终端认证
- socketserver 

- ftplib
- http
- smtplib
- urllib
- cgi
- webbrowser

- base64
- json  xml

- wxPython

- django  web框架
- twisted 网络编程框架


### socket编程

上述模块的使用

### 多线程编程

同上