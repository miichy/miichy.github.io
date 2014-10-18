＃ Markdown语法学习

------
Markdown始于2004年，现在都已有十年之久。于我，还只是因为工作wiki使用都该格式才有所接触，也没有系统正规都接触过markdown语法。而现在都**jekyll**中，post page所支持都奏是该格式。于是抽点时间看了一下，惊呆了。果然是利器，个人觉得非常好看以及欢型。废话不多说，我看都教程网址是[作业部落的网站][1]，

## 多样的格式

**粗体**
*斜体*
> * 整理笔记之类的笔记背景
[链接][2]
<i class="icon-file">图标</i>
`阴影背景`

使用图片：![name](directory)

 ### Latex公式[^LaTeX]
 $$E=mc^2$$

 ### 高亮代码[^code]
 ```java
/**
	author:miichy
	date:2014-10-18
*/
import system;

class Test(){
	public static main(args ...){
		//system out hello
		system.out.println("hello.Markdown.");
	}
}

 ```

 ### 流程图（flow） 和 序列图（seq） 和表格
 
 ------

作者 [@chateldon][3]
2014-10-18

[^LaTex]: 支持 **LaTeX**编辑显示支持，例如：$\sum_{i=1}^n a_i=0$， 访问 [MathJax][4] 参考更多使用方法。
[^code]:代码高亮功能支持包括 Java, Python, JavaScript 在内的，**四十一**种主流编程语言。

[1] www.zybuluo.com/mdeditor
[2] miichy.github.io
[3] weibo.com/chateldon
[4]: http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference