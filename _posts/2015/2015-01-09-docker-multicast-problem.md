---
layout: post 
title:  docker中的多播问题
date: 2015-01-09 14:21:49 
category: docker;multicast;
---

## bug出现

在使用ganglia的时，由于使用到多播技术收集信息。

## 本机实现

本机的java多播实现：

发送端
{% highlight java%}
public static void main(String[] args) throws IOException {
        int port = 6789;  
        String sendMessage="hello";  
       InetAddress inetAddress = InetAddress.getByName("228.5.6.7");  
       DatagramPacket datagramPacket = new DatagramPacket(sendMessage.getBytes(), sendMessage.length(), inetAddress, port);  
       MulticastSocket multicastSocket = new MulticastSocket();  
       multicastSocket.send(datagramPacket);  
	}
{% endhighlight %}

接收端
{% highlight java%}
public static void main(String[] args) throws IOException {
	    InetAddress group = InetAddress.getByName("228.5.6.7");  
        MulticastSocket s = new MulticastSocket(6789);   
        byte[] arb = new byte[1024];  
        s.joinGroup(group);//加入该组  
        while(true){  
             DatagramPacket datagramPacket =new DatagramPacket(arb,arb.length);  
             s.receive(datagramPacket);  
             System.out.println(arb.length);  
             System.out.println(new String(arb));   
        }  
	}
{% endhighlight %}

## docker的实验

将send放到docker容器中，`docker run -it --rm -p 6789:6789 java:6`.在docker的宿主机运行接收者,结果行不通。

将一个docker容器中运行接收者，另一个容器中运行发送者，同样行不通。

## 结论 & 问题

默认的网桥网络配置不支持这种的multicast方式。如何解决？（本节待续）