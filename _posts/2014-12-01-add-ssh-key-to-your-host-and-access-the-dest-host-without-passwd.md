---
layout: post 
title:  ssh需要密码？用密钥id_rsa   &&   递归与迭代（recursive and iterative）
date: 2014-12-01 17:11:53 
category: 
---

##  id_rsa

很多时候，比如jenkins的用git拉代码，如果slave或者jenkins主机不安装git的私钥的话，单纯的配置ssh与git路径，ms是行不通的。

##  git服务器生成id_rsa

`ssh-keygen -t rsa -C "ur_email@example.com" `
`ssh-agent -s`
`ssh-add ~/.ssh/id_rsa`

## 将git服务器的id_rsa放到slave或者jenkins主机上

#### chmod 600 id_rsa

#### mv id_rsa XXXName

#### touch ~/.ssh/config

add:

    Host git.XXX.com
    IdentityFile /home/XXX/.ssh/keys/git_XXX_com
    Port 22
    User git

然后将命名为XXXName的私钥放到`~/.ssh/keys`文件中，此`config`则起到管理不同机器之间的私钥。

####  jenkins 的slave配置

##### tools location 添加slave的java git mvn等bin目录

##### slave机器的$HOME 目录 创建.m 目录，然后将setting文件放到里面

## 递归与迭代 recursive and iterative

#### 递归

{% highlight java %}
int recursive(int n){
    if(n <= 1) return 1;
    return n*recursive(n-1);
}

int iterative(int n){
    int sum = 1;
    if(n <= 1) return sum;
    while(n > 1){
        sum *= n;
        n--;
    }
    return sum;
}



//--------------- iterative version ---------------------    
static int FibonacciIterative(int n)
{
    if (n == 0) return 0;
    if (n == 1) return 1;
        
    int prevPrev = 0;
    int prev = 1;
    int result = 0;
        
    for (int i = 2; i <= n; i++)
    {
        result = prev + prevPrev;
        prevPrev = prev;
        prev = result;
    }
    return result;
}
    
//--------------- naive recursive version --------------------- 
static int FibonacciRecursive(int n)
{
    if (n == 0) return 0;
    if (n == 1) return 1;
        
    return FibonacciRecursive(n - 1) + FibonacciRecursive(n - 2);
}
    
//--------------- optimized recursive version ---------------------
static Dictionary<int> resultHistory = new Dictionary<int>();

static int FibonacciRecursiveOpt(int n)
{
    if (n == 0) return 0;
    if (n == 1) return 1;
    if (resultHistory.ContainsKey(n)) 
        return resultHistory[n];

    int result = FibonacciRecursiveOpt(n - 1) + FibonacciRecursiveOpt(n - 2);
    resultHistory[n] = result;
        
    return result;
}
{% endhighlight %}


## 广度优先与深度优先

![2014-12-02-BFS.jpg](/img/2014-12-02-BFS.jpg)
![2014-12-02-BFS-2.jpg](/img/2014-12-02-BFS-2.jpg)


### Tips

删除Existed的container

`docker rm -f $(docker ps -a |grep Exited|awk '{print $1}')`

删除<none>的images

`docker rmi -f $(docker images |grep '<none>' |awk '{print $3}')`