---
layout: post
title:  "java之反射和注解"
date:   2014-11-07 13:24:00
categories: java,reflect,annotation
---

## 先上代码

{% highlight java %}

    public static void main(String[] args) throws Exception {
        if (args == null || args.length != 1) {
            System.out.println("usage java -jar xxx.jar testMethodNam/all");
            System.exit(1);
        }
        setUpBeforeClass();
        Class clazz = AllTest.class.forName(AllTest.class.getName());
        String argMethod = args[0];
        if ("all".equals(argMethod)) {
            Method[] methods = clazz.getDeclaredMethods();
            
            for (Method method : methods) {
                String methodName = method.getName();
                if (methodName.startsWith("test")) {
                    System.out.println(methodName);
                    method.invoke(clazz.newInstance(), null);
                }
            }
        } else {
            try {
                Method method = clazz.getDeclaredMethod(argMethod, null);
                System.out.println(method.getName());
                method.invoke(clazz.newInstance(), null);
            } catch (NoSuchMethodException e) {
                System.out.println("there is no method :" + argMethod);
                System.exit(1);
            }
        }    
    }
{% endhighlight %}

上面的代码有一部分非常冗余，就是**clazz**的声明，clazz可以用AllTest.class代替，取的就是AllTest的Class对象。

## 反射

java反射API的第一个主要作用是获取程序在运行时刻的内部结构。这对于程序的检查工具盒调试器来说是非常实用的。只需短短的十几行代码就可以遍历出一个java类的内部结构，包括构造方法、声明的域和定义的方法等。

只要有java.lang.Class类的对象，就可以获取该类的构造方法、域和方法，对应的方法分别是getConstructor、getField和getMethod。对应的还有getDeclaredXXX版本，getDeclaredXXX的方法只会获取该类自身所声明的元素，而不会考虑继承下来的元素。这些类中的方法可以获取到所对应的结构元数据。

java.lang.reflect中：

    Class类：代表一个类。
    Field 类：代表类的成员变量（成员变量也称为类的属性）。
    Method类：代表类的方法。
    Constructor 类：代表类的构造方法。
    Array类：提供了动态创建数组，以及访问数组的元素的静态方法。

 {% highlight java %}
    class MyClass {
        public int count;
        public MyClass(int start) {
            count = start;
        }
        public void increase(int step) {
            count = count + step;
        }
    }
 {% endhighlight %}

 使用反射API：
 {% highlight java %}
    MyClass myClass = new MyClass(0); //一般做法
    myClass.increase(2);
    System.out.println("Normal -> " + myClass.count);
    try {
        Constructor constructor = MyClass.class.getConstructor(int.class); //获取构造方法
        MyClass myClassReflect = constructor.newInstance(10); //创建对象
        Method method = MyClass.class.getMethod("increase", int.class);  //获取方法
        method.invoke(myClassReflect, 5); //调用方法
        Field field = MyClass.class.getField("count"); //获取域
        System.out.println("Reflect -> " + field.getInt(myClassReflect)); //获取域的值
    } catch (Exception e) { 
        e.printStackTrace();
    } 
 {% endhighlight %}

 使用java反射API的时候可以绕过java默认的访问控制检查，比如可以直接获取到对象的私有域的值或是调用私有方法。只需要获取到Constructor、Field和Method类的对象之后，调用setAccessible方法并设为true集合。有了这种机制，很方便的在运行时获取程序的内部状态。比如：两个程序员在合作开发，但A开发的很快，而且需要B没有开发ok的类，则此时只要定义要协定好方法名和属性等，A则可以继续开发。或者像本节刚开始的例子一样，如果命名有一定的规范，则只需要加实现的case，运行的main方法可以不用更改任何东西即可。

 ## java的注解（Annotation）

 ### 注解处理器

注解处理器类库(java.lang.reflect.AnnotatedElement)

Annotation接口代表程序元素前面的注解，是所有Annotation类型的父接口。接口主要有以下实现类：

    Class：类定义
    Constructor：构造器定义
    Field：成员变量定义
    Method：方法定义
    Package：包定义

java.lang.reflect包所有提供的反射API补充了读取运行时Annotation信息的能力。当一个Annotation类型被定义为运行时的Annotation后，该注解才能在运行时可见，当class文件被装载时被保存在class文件中的Annotation才会被虚拟机读取。

    Target:目标：类、接口、方法、构造函数等等
        ANNOTATION、CONSTRUCTOR、FIELD、LOCAL_VARIABLE、METHOD、PACKAGE、PARAMETER、TYPE
        如果只允许对方法和构造函数进行注释：@Target({ElementType.METHOD,ElementType.CONSTRUCTOR})
    Retention:为设置注释是否保存在class文件中。
        RetentionPolicy.SOURCE 不将注释保存在class文件，编译时被过滤掉
        RetentionPolicy.CLASS 只保存在class文件，而是用反射读取时忽略这些注释
        RetentionPolicy.RUNTIME 保存在class文件，也可以通过反射去读注释
    Documented：自动生成文档
    inherited：加上该注释，父类的注释可以被子类继承

是用反射读取注释：
    
    Method Method= TestAnnotation.class.getMethod("myMethod",null);
    Annotation annotation = method.getAnnotation(MyAnnotation.class);
    PS:使用反射得到注释信息，必须用@Retention(RetentionPolicy.RUNTIME)注释

![注解知识点](/img/annotation_tips.jpg)

借鉴别人的实例：

    interface：
        @Target(ElementType.FIELD)
        @Retention(RetentionPolicy.RUNTIME)
        @Documented
        public @interface FruitName{
            String value() default "";
        }
        =====
        @Target(ElementType.FIELD)
        @Retention(RetentionPolicy.RUNTIME)
        @Documented
        public @interface FruitColor{
            public enum Color {BULE,RED,GREEN};
            Color fruitColor() default Color.GREEN;
        }
        ======
        @Target(ElementType.FIELD)
        @Retention(RetentionPolicy.RUNTIME)
        @Documented
        public @interface FruitProvider{
            public int id() default -1;
            public String name() default "";
            public String address() default "";
        }
        ======
        Apple.java

        public class Apple {
    
            @FruitName("Apple")
            private String appleName;
            
            @FruitColor(fruitColor=Color.RED)
            private String appleColor;
            
            @FruitProvider(id=1,name="BigApple",address="YourHome")
            private String appleProvider;
            
            public void setAppleColor(String appleColor){
                this.appleColor = appleColor;
            }
            
            public String getAppleColor(){
                return appleColor;
            }
            public String getAppleName() {
                return appleName;
            }
            public void setAppleName(String appleName) {
                this.appleName = appleName;
            }
            public String getAppleProvider() {
                return appleProvider;
            }
            public void setAppleProvider(String appleProvider) {
                this.appleProvider = appleProvider;
            }
            
            public void displayName(){
                System.out.println("What fruit do you have? : Apple");
            }
        }
        ======
        FruitInfoUtil.java
        public class FruitInfoUtil {
            public static void getFruitInfo(Class<?> clazz){
                
                String strFruitName = "Name: ";
                String strFruitColor = "Color: ";
                String strFruitProvider = "Provider: ";
                
                Field[] fields = clazz.getDeclaredFields();
                
                for(Field field : fields){
                    if(field.isAnnotationPresent(FruitName.class)){
                        FruitName fn = (FruitName) field.getAnnotation(FruitName.class);
                        strFruitName = strFruitName + fn.value();
                        System.out.println(strFruitName);
                    }else if(field.isAnnotationPresent(FruitColor.class)){
                        FruitColor fc = (FruitColor) field.getAnnotation(FruitColor.class);
                        strFruitColor = strFruitColor + fc.fruitColor().toString();
                        System.out.println(strFruitColor);
                    }else if(field.isAnnotationPresent(FruitProvider.class)){
                        FruitProvider fp = (FruitProvider) field.getAnnotation(FruitProvider.class);
                        strFruitProvider = strFruitProvider + fp.id() + "==" + fp.name() + "===" +fp.address();
                        System.out.println(strFruitProvider);
                    }else{
                        System.out.println("Wrong work flow into this place!");
                    }
                }              
            }          
        }
        ======
        FruitRun.java
        public class FruitRun {
            public static void main(String[] args) {
                
                FruitInfoUtil.getFruitInfo(Apple.class);
                
                Apple a = new Apple();
                a.displayName();
            }
        }



 ## maven的main-class打包

 maven工程中export出来的jar在linux下用命令行执行时，出现MainClassNotFound的异常。而用maven install方式打包也出现同样的问题。

 这是因为在pom.xml文件中，需要在build之前加入main-class的属性：

    <properties>
    <main-class>com.java.MainMethod</main-class>
    <java-version>1.6</java-version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    </properties>

在build中的plugins加入：

    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-jar-plugin</artifactId>
        <configuration>
            <archive>
                <manifest>
                    <addClasspath>true</addClasspath>
                    <mainClass>${main-class}</mainClass>
                </manifest>
            </archive>
        </configuration>
    </plugin>

现在用maven install打出的jar，在命令行中运行时不会报错了。
PS：将maven项目中依赖的jar打包，存放在target目录下的dependency中

    mvn dependency:copy-dependencies