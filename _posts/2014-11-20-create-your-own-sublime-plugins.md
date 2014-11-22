--- 
layout: post
title:  create your own sublime plugins
date: 2014-11-20 19-11-01 
category: sublime plugins
author:liumq 
---


##  创建自己的sublime插件

sublime是款优秀的editor，这个不用多说。由于经常使用sublime编写jekyll模板的文章，所以今天要自己写一个插件，用户新建一个带有jekyll头文件的模板。[参考的文章](http://code.tutsplus.com/tutorials/how-to-create-a-sublime-text-2-plugin--net-22685).

### 制作一个最简单插件的步骤

#### step one：Starting a Plugin

选择Tools > New Plugin ...菜单，一个新的plugin模板窗口会打开。

{% highlight python %}
import sublime, sublime_plugin
 
class ExampleCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        self.view.insert(edit, 0, "Hello, World!")
{% endhighlight %}

保存文件，更改文件保存目录至/Sublime/Data/Packages/NewPluginName 目录下，NewPluginName为插件的名字，文件名则为XXX.py。sublime使用python写的。

#### step two：Command Types and Naming

三种不同的操作：

- Text commands，通过view提供文件内容操作
- Window commands，通过Window提供当前窗口的操作
- Application commands，没有指定的矿口或者文件流等属性，很少被用到。

运行plugin ： 

    - 打开console控制台，ctrl+`
    - view.run_command('example')

则看以看到，文件的头部增加了`Hello,World!`.It works!是不是有点兴奋呢。

为什么是`example`呢？原来是因为class的名字(run的类名)为`ExampleCommand`.将`ExampleCommand`改成`HeadCommand`，则运行`view.run_command('head')`即可。如果是驼峰式的`MyNewPluginCommand`,则运行`view.run_command('my_new_plugin')`即可。想必大家也知道其中的规律了。

#### step three：Key Bindings

高大上的快捷键绑定。一般的会有三个平台的快捷键，windows、linux、OSX，所以要创建三个文件，名字分别为：Default (Windows).sublime-keymap, Default (Linux).sublime-keymap 和 Default (OSX).sublime-keymap。windows和linux基本一样，OSX需要将windows中的ctrl键改成cmd键。

该文件是JSON格式的，给出下列实例（假设类名为HeadCommand）：

    [
        { 
            "keys": ["ctrl+alt+x"], "command": "head"
        }
    ]

在觉得使用什么组合键之前，你当然还要确认一下会不会与其他的快捷键重复，点击Preferences > Key Bindings - Default 菜单，使用菜单文件中，没有使用过的。本文使用的是`ctrl+shift+c`.这个会因为每个sublime安装的package的多少回有些不同。

现在，点击组合键`ctrl+shift+c`,你会发现，当前文本的首行出现`Hello,World!`.一个简单的sublime插件就完成了。后续的工作就是发布你的插件了。发布插件，参考文章开始给出的参考链接。

### jekyll博客模板的插件

介绍完最简单的插件的步骤后，介绍一下本人的jekyll博客模板插件以及遇到的一些坑。简单的来说，其功能就是新增一个file窗口，并且添加jekyll模板所需的头部，避免每次都需要手动敲入。

先上代码Prefixr.py：

{% highlight python %}
import sublime, sublime_plugin
import time

class HeadCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        """test doc"""
        a = time.localtime(time.time())
        b = time.strftime('%Y-%m-%d %H:%M:%S',a)
        self.view.insert(edit, 0, "---\nlayout: post \ntitle:  \ndate: %s \ncategory: \nauthor:liumq \n---\n" % (b))

class NewCommand(sublime_plugin.WindowCommand):
    def  run(self,commands):
        self.window.new_file()
        window = self.window
        for command in commands:
            command_name = command[0]
            command_args = command[1:]
            window.run_command(command_name,*command_args)
{% endhighlight %}

    Default (Windows).sublime-keymap：

    [
        {
            "keys":["ctrl+shift+c"],
            "command":"new",
            "args":{
                "commands":[
                    ["head"]
                ]
            }
        }
    ]   

#### 坑one：新开窗口

文本是view属性来支持，新增窗口由window来支持。所以，新增窗口命令为`self.window.new_file()`

#### 坑two：如何将不同的command组合到同一个组合键中

由于新增窗口为window属性，添加文本为view属性，如何将这两个操作组合在一个组合快捷键中是个问题。各种尝试都不行，求助于google。

两种方法(稍后放出两种方法的原链接)，一种是本文中的：

NewCommand为main run，该方法是window属性。HeadCommand为添加文本功能，其属性为view属性。NewCommand的run方法参数与Head的有些许不同，多了一个args，这个也是`.sublime-keymap`文件与我们前面有不同的原因所在。NewCommand类新建一个`new_file()`,然后将args参数进行分割，新增的file再执行head命令---`window.run_command(command_name,*command_args)`. 该命令的属性是window 去run，而不是view去run。

另一种方法，跟这个有异曲同工之处。就贴出原链接以及代码给大家看一下吧。
[ChainOfCommand](https://github.com/jisaacks/ChainOfCommand/blob/master/chain.py)

{% highlight python %}
import sublime
import sublime_plugin

class ChainCommand(sublime_plugin.WindowCommand):
    def run(self, commands):
        window = self.window
        for command in commands:
            command_name = command[0]
            command_args = command[1:]
            window.run_command(command_name, *command_args)
{% endhighlight %}

    window.run_command("chain",{"commands":[["select_all"],["copy"]]})

    window.run_command("chain",{"commands":[["focus_group",{"group":0}]]})

key binding：

    {
      "keys": ["super+shift+option+d"], 
      "command": "chain", 
      "args": {
        "commands": [
          ["select_all"],
          ["copy"],
          ["new_file"],
          ["paste"],
          ["save"]
        ]
       }
    }


[Gist key-bindings.json](https://gist.github.com/nilium/3327730)

run_multiple.py：

{% highlight python %}
import sublime, sublime_plugin
 
# Takes an array of commands (same as those you'd provide to a key binding) with
# an optional context (defaults to view commands) & runs each command in order.
# Valid contexts are 'text', 'window', and 'app' for running a TextCommand,
# WindowCommands, or ApplicationCommand respectively.
class RunMultipleCommand(sublime_plugin.TextCommand):
  def exec_command(self, command):
    if not 'command' in command:
      raise Exception('No command name provided.')
 
    args = None
    if 'args' in command:
      args = command['args']
 
    # default context is the view since it's easiest to get the other contexts
    # from the view
    context = self.view
    if 'context' in command:
      context_name = command['context']
      if context_name == 'window':
        context = context.window()
      elif context_name == 'app':
        context = sublime
      elif context_name == 'text':
        pass
      else:
        raise Exception('Invalid command context "'+context_name+'".')
 
    # skip args if not needed
    if args is None:
      context.run_command(command['command'])
    else:
      context.run_command(command['command'], args)
 
  def run(self, edit, commands = None):
    if commands is None:
      return # not an error
    for command in commands:
      self.exec_command(command)
{% endhighlight %}

key-bindings.json：

    [
      {
        "keys": ["ctrl+w"],
        "command": "run_multiple",
        "args": {
          "commands": [
            {"command": "find_under_expand", "args": null, "context": "window"},
            {"command": "show_panel", "args": {"panel": "find"}, "context": "window"}
          ]
        }
      }
    ]

两种方法都是可以将不同类型的操作绑定到一个组合快捷键上。

### What is Next

动手开始写你自己想要的插件吧。

[sublimepluginApi](http://www.sublimetext.com/docs/api-reference#sublimeplugin.Plugin)

[API2](http://www.sublimetext.com/docs/2/api_reference.html#sublime_plugin.WindowCommand)

[Example](http://www.sublimetext.com/docs/plugin-examples)
