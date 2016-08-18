---
layout: post 
title:  python中类的用法与脚本的用法
date: 2015-09-11 16:43:49 
category:  python
tags : [python,class,script]
---

##  类

实例：
<pre>
#!/usr/bin/env python
# -*- coding=utf-8 -*-

class MyClass:
	""" simple   """
	i = 12
	def say(self):
		print "hello"
		return "hello,world"

class Pet(object):
	def __init__(self,name,species):
		self.name = name
		self.species = species

	def getName(self):
		return self.name

	def getSpecies(self):
		return species

	def __str__(self):
		return "%s is a %s" % (self.name,self.species)

if __name__ == "__main__":
	x = MyClass()
	x.say()
	print x.i

	print "========="

	polly = Pet("polly","cat")
	print polly
	harry = Pet("harry","dog")
	print harry.getName()
</pre>

##  脚本

<pre>
SUFFIXES = {1000: ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            1024: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']}

def approximate_size(size, a_kilobyte_is_1024_bytes=True):
    '''Convert a file size to human-readable form.

    Keyword arguments:
    size -- file size in bytes
    a_kilobyte_is_1024_bytes -- if True (default), use multiples of 1024
                                if False, use multiples of 1000

    Returns: string

    '''
    if size < 0:
        raise ValueError('number must be non-negative')

    multiple = 1024 if a_kilobyte_is_1024_bytes else 1000
    for suffix in SUFFIXES[multiple]:
        size /= multiple
        if size < multiple:
            return '{0:.1f} {1}'.format(size, suffix)

    raise ValueError('number too large')

if __name__ == '__main__':
    print(approximate_size(1000000000000, False))
    print(approximate_size(1000000000000))
</pre>

## __init__等内置函数

- __init__(self,...)   初始化对象，创建新对象时调用
- __del__(self)   释放对象，在对象被删除之前调用
- __new__(cls,*args,**kwd)  实例的生成操作
- __str__(self)  使用print语句时被调用
- __getitem__(self,key)  获取序列的索引key对应的值，等价于seq[key]
- __len__(self) 在调用内联函数len()时被调用
- __cmp__(stc,dst)  比较两个对象src和dst
- __getattr__(s,name)  获取属性的值
- __setattr__(s,name,value)  设置属性的值
- __delattr__(s,name)  删除name属性
- __getattribute__()  __getattribute__()与__getattr__()类似
- __gt__(self,other)  判断self对象是否大于other对象
- __lt__(self,other)  判断self对象是否小于other对象
- __ge__(self,other)  判断self对象是否大于或等于other对象
- __le__(self,other)  判断self对象是否小于或等于other对象
- __ep__(self,other)  判断self对象是否等于other对象
- __call__(self,*args)  把实例对象作为函数调用


## __name__=="__main__"

Example

<pre>		
#!/usr/bin/python
# Filename: using_name.py

if __name__ == '__main__':
	print 'This program is being run by itself'
else:
	print 'I am being imported from another module'
</pre>			
				
Output

<pre>			
$ python using_name.py
This program is being run by itself

$ python
>>> import using_name
I am being imported from another module
>>>
</pre>				
				
How It Works?
每个python模块均有__name__这个属性，如果该属性为__main__,意味着该模块以单例模式被用户运行，我们可以采取相对应待合适的措施。
