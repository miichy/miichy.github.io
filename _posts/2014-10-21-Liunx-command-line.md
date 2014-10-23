---
layout: post
title:  "Linux Command Line（一）"
date:   2014-10-21 23:09:00
categories: Linux
---
`everything in linux is file.`

今天学习的是个人觉得最常用的两个命令行：`sed` 。这也是流的行操作命令，sed是line的操作。

## 实例**sed**

> - d 	删除所有行
> - 6d 	删除第6行
> - /^$/d 	删除所有空行
> - 1,10d 	删除1～10行
> - 1,/^$/d 	删除第一行到第一个空行
> - /^$/,$d 	从第一个空行一直删除到文件到最后一行
> - /^$/,10d 	从第一个空行删除到第10行
> - /^ya*y/,/[0-9]$/d 	从包含yay，yaay yaaay等的第一行删除到以数字为结尾的第一行
> - sed '2a drink tea' 	第二行添加drink tea，添加后即为第三行为drink tea.添加内容中\为newline
> - sed '2i something' 	第二行前添加something
> - sed '2,5c No number' 	第二行到第五行变成了No number这一行了
> - sed -n '2,5p' 	仅仅打印出第二到第五行
> - sed 'root/d' 	删除包含root的行
> - sed -n '/root/p' 	只打印包含root的行
> - sed 's/旧串/新串/g'	替换


## 多重操作

`[/patten/[,/pattern/]]{
command1
command2
command3
}`

## 操作参数

- s  substitute取代
- a  append新增
- i  insert插入
- c  change取代
- d  delete删除
- p  print打印
- y  transform
- q  quit

## Sed 语法

sed [-n] [-e] ['command'] [file...]
sed [-n] [-f scriptfile] [file...]

**-n**只有经过sed特殊处理的那行才被列出来

**-f**scriptfile 下一个参数是文件名，该文件包含编辑操作

**-e**下一个参数编辑操作而不是文件名。

**-r**sed的动作支持是延伸性正规表示法的语法

**-i**直接修改读取的文件，不输出到终端

---

## 实例**awk**

- `ls | awk 'BEGIN {print "List of html files:"} /\.html$/ {print} END {print "There you are!"}'`
- $0 整行  
- $1 第一部分
- { print "total pay for", $1,"is", $2 * $3 }
- { printf(“total pay for %s is $%.2f\n”,$1, $2 * $3) }
- $2 > 5 {print}     $2 * $3 > 50 {print}    $1 == "NYU"    $2 ~ /NYU/   NR > 10 && NR <= 20
- $3>15{emp=emp+1} END {print emp}
- {pay = pay + $2 + $3} END {print NR,pay/NR}
- {if (n>0) {print n} else {print 0}}
- while   do{}while()
- for
- array -- {line[NR] = $0}END{print line[3]} `for循环print`
- NR:Number of records processed  NF:Number of fields in current record
- FILENAME ; FS ; OFS ; ARGC/ARGV;
- 操作：=;==;!=;&&;||;!;<,>,<=,>=;+,-,/,*,%,^;string


------

后记：sed和awk的功能太强大了，特别是awk，可以作为一个小的语言处理很多事情了。Linux系的东西真的有好多还要继续学习。最好的学习方法就是学以致用了。
