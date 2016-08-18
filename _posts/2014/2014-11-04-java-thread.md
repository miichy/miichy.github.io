---
layout: post
title:  "thread在junit和class中的使用区别"
date:   2014-11-04 20:24:00
categories: Junit Thread
---

# java thread

## extends Thread

new MyThread()
调用start()方法则为调用了run方法。如果start方法在MyThread构造方法中，则只用new出来不调用就会start

{% highlight java %}
public class MThread extends Thread{
    public MThread(){
        System.out.println("Constructor!");
    }

     @Override
    public void run() {
        try {
            tSocket.open();
            TFramedTransport transport = new TFramedTransport(tSocket);
            TProtocol prot = new TBinaryProtocol(transport);
            namiClient = new Client(prot);
            Result re = namiClient.method(accountName);
            System.out.println(re);
            latch.countDown();
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.run();
        
    }
}

public class MainClass(){
    public static void main(String[] args){
        Thread m = new MThread();
        m.start(); 
    }   
}
{% endhighlight %}


## implement Runnable

{% highlight java %}
public class DoSomething implements Runnable { 
    private String name; 

    public DoSomething(String name) { 
        this.name = name; 
    } 

    public void run() { 
        for (int i = 0; i < 5; i++) { 
            for (long k = 0; k < 100000000; k++) ; 
            System.out.println(name + ": " + i); 
        } 
    } 
}

public class TestRunnable { 
    public static void main(String[] args) { 
        DoSomething ds1 = new DoSomething("阿三"); 
        DoSomething ds2 = new DoSomething("李四"); 

        Thread t1 = new Thread(ds1); 
        Thread t2 = new Thread(ds2); 

        t1.start(); 
        t2.start(); 
    } 
}
{% endhighlight %}


## CountDownLatch

解决junit多线程调用run方法不执行的情况。

为什么junit的test中用多线程调用run方法不生效？
thread在new了5个过后，junit的test认为该test已经跑完，而thread的机制是5个thread启了过后，再同时并发去调用run方法，而就在5个thread的启了过后，还没有调用run方法之前，test就已经exit了。所以我们需要等到所有线程完成操作后才能将junit的test方法exit。执行test的方法为主线程，而5个thread为子线程，只有在主线程没有完成且中断的时候，子线程才会被执行。

这里可以在test的方法中，让主线程sleep一下。主线程sleep，则线程被中断，cpu会调用启动ok的5个thread，让其执行。还有另一种方法就是CountDownLatch方法。具体方法查看[教程](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/CountDownLatch.html)

为什么main方法调用却没有这种情况？
因为main函数是在return的结果后才会结束，并且main函数在结束后，也会有守护线程daemon在执行。

### 一个rpc的client不能又多个子线程调用

#### static tSocket
将socket置为static后 ，再用多线程去调用tSocket.open()，出现socket is already used！


代码：

{% highlight java %}

public class ZKTest1 {
    static CountDownLatch latch = new CountDownLatch(5);
    
    @Before
    public void setUp() throws Exception {
    }

    @After
    public void tearDown() throws Exception {
    }
    

    @Test
    public void test() throws TException, InterruptedException {
         
        for (int i = 1; i <= 5   ; i++) {
            new MyThread1(i,"userName"+i,latch).start();
            System.out.println("thread : " + i );
            
        }
            latch.await();
//        Thread.sleep(2000);
    }

}

class MyThread1 extends Thread{
    
    private static final int DEFAULT_TIMEOUT = 4000;
    private static String host = "0.0.0.0";
    private static int port = 9527;
    private TSocket tSocket = new TSocket(host, port, DEFAULT_TIMEOUT);
    Client namiClient ;
    private String token = "abc";
    
    long accountId;
    String accountName;
    
    CountDownLatch latch;
    
    MyThread1(long accountId,String accountName,CountDownLatch latch){
        super("MyThread");
        this.accountId = accountId;
        this.accountName = accountName;
        this.latch = latch;
        System.out.println("child thread : " + this);
    }
    
    @Override
    public void run() {
        try {
            tSocket.open();
            TFramedTransport transport = new TFramedTransport(tSocket);
            TProtocol prot = new TBinaryProtocol(transport);
            namiClient = new Client(prot);

            Result re = namiClient.method( accountName);
            System.out.println(re);
            latch.countDown();
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.run();
        
    }

}
{% endhighlight %}

#### main函数中调用Thread中的方法

{% highlight java %}
public class ZKTest {
    
    public static void main(String[] args) throws Exception {
        new ZKTest();
        for (int i = 1; i <= 5  ; i++) {
            new MyThread(i,"userName"+i).start();
            System.out.println("thread : " + i );
        }
    }

}

class MyThread extends Thread{
    private static final int DEFAULT_TIMEOUT = 4000;
    private static String host = "0.0.0.0";
    private static int port = 9527;
    private TSocket tSocket = new TSocket(host, port, DEFAULT_TIMEOUT);
    Client namiClient ;
    private String token = "abc";
    
    long accountId;
    String accountName;
    
    MyThread(long accountId,String accountName){
        super("MyThread");
        this.accountId = accountId;
        this.accountName = accountName;
        System.out.println("child thread : " + this);
    }
    
    @Override
    public void run() {
        try {
            tSocket.open();
            TFramedTransport transport = new TFramedTransport(tSocket);
            TProtocol prot = new TBinaryProtocol(transport);
            namiClient = new Client(prot);
            Result re = namiClient.method(accountName);
            System.out.println(re);
            tSocket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.run();
        
    }
}
{% endhighlight %}

CountDownLatch 去掉，换成Thread.sleep（）也是ok的。但是不加这两种，rpc方法将得不到调用。


## TODO
zk锁是什么？
[学习](http://zookeeper.apache.org/)

线程
[学习](http://lavasoft.blog.51cto.com/62575/27069)



