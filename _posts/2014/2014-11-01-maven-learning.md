---
layout: post
title:  "Maven 初识"
date:   2014-11-01 20:24:00
categories: Maven
---

## maven

### pom文件节点：

	project pom文件的顶级元素
	modelVersion 所使用的object model版本，为了确保稳定的使用，这个元素是强制性的。除非maven开发者升级模板，否则不需要修改
	groupId 是项目创建团体或组织的唯一标志符，通常是域名倒写，如groupId  org.apache.maven.plugins就是为所有maven插件预留的
	artifactId 是项目artifact唯一的基地址名
	packaging artifact打包的方式，如jar、war、ear等等。默认为jar。这个不仅表示项目最终产生何种后缀的文件，也表示build过程使用什么样的lifecycle。
	version artifact的版本，通常能看见为类似0.0.1-SNAPSHOT，其中SNAPSHOT表示项目开发中，为开发版本
	name 表示项目的展现名，在maven生成的文档中使用
	url表示项目的地址，在maven生成的文档中使用
	description 表示项目的描述，在maven生成的文档中使用
	dependencies 表示依赖，在子节点dependencies中添加具体依赖的groupId artifactId和version
	build 表示build配置
	parent 表示父pom

### Artifact

项目要产生的文件，jar、源文件、二进制文件、war等等。每个artifact都由groupId:artifactId:version组成的标识符唯一识别

### Repositories

存储Artifact的仓库。pom中用dependency，编译时根据此下载第三方Artifact。mvn install将自己的项目打包成artifact放到Repositories仓库中。

### Build lifecycle

default：项目的部署
clean：项目的清理
site：项目文档的生成

default的Lifecycle：

	validate 验证项目是否正确以及必须的信息是否可用
	compile 编译源代码
	test 测试编译后的代码，即执行单元测试代码
	package 打包编译后的代码，在target目录下生成package文件
	integration-test 处理package以便需要时可以部署到集成测试环境
	verify 检验package是否有效并且达到质量标准
	install 安装package到本地仓库，方便本地其它项目使用
	deploy 部署，拷贝最终的package到远程仓库和替他开发这或项目共享，在集成或发布环境完成

步骤有序且同步！上一步ok才进行下一步。

### Goal

代表一个特定任务：

	mvn package表示打包的任务，通过上面的介绍我们知道，这个任务的执行会先执行package 之前的步骤
	mvn deploy表示部署的任务
	mven clean install则表示先执行clean的步骤（包含其他子步骤），再执行install的步骤。

## 用法

### archetype

### quick start工程

	mvn archetype:generate -DgroupId=com.trinea.maven.test -DartifactId=maven-quickstart -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false

### web工程

	mvn archetype:generate -DgroupId=com.trinea.maven.web.test -DartifactId=maven-web -DarchetypeArtifactId=maven-archetype-webapp -DinteractiveMode=false

其他：

	src\main\resources文件夹是用来存放资源文件的，maven工程默认没有resources文件夹，如果我们需要用到类似log4j.properties这样的配置文件，就需要在src\main文件夹下新建resources文件夹，并将log4j.properties放入其中。

	test需要用到资源文件，类似放到src\test下
对于apache的log4j没有log4j.properties文件或是目录错误，会报如下异常

	log4j:WARN No appenders could be found for logger (org.apache.commons.httpclient.HttpClient).
	log4j:WARN Please initialize the log4j system properly.


### maven的插件：[maven-surefire-plugin](http://maven.apache.org/surefire/maven-surefire-plugin/usage.html)的使用.

	<plugins>
	[...]
	  <plugin>
	    <groupId>org.apache.maven.plugins</groupId>
	    <artifactId>maven-surefire-plugin</artifactId>
	    <version>2.17</version>
	    <dependencies>
	      <dependency>
	        <groupId>org.apache.maven.surefire</groupId>
	        <artifactId>surefire-junit47</artifactId>
	        <version>2.17</version>
	      </dependency>
	    </dependencies>
	  </plugin>
	[...]
	</plugins>

运行 mvn site，则会生成文档文件，且在运行test的时候（mvn test），会将test的结果放到target目录中dproject-report文件中。

### jenkins+maven+git+report

其实进行上一步骤的操作后，在jenkins上创建普通job，pull git的代码，而在build中跑的test的结果则会出现在jenkins的report中。

参考资料：

[Maven官方文档](http://maven.apache.org/guides/index.html)

[maven安装](http://maven.apache.org/download.html)

### 2014.10.29

	https://cnodejs.org/topic/5218daf9bee8d3cb12546df6  angularJs学习资源
	http://angularjs.cn/  中文网站

TO-DO list

	Docker 的registry学习
	Angular 学习
	Python 数据迁移的通用框架？

	GoLang 

学习开发语言的网站http://introlearn.com/
