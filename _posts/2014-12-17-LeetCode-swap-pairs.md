---
layout: post 
title:  相邻两个node节点互换
date: 2014-12-17 17:07:43 
category: LeetCode;ListNode;
---

## 转换相邻两个节点的顺序

given： 4->3->2->1
output: 3->4->1->2

并且返回为结果链表的head node。

### 常规

两个相邻指针，依次向后移动两位进行遍历。

### 递归

{% highlight java %}
 public ListNode swapPairs(ListNode head) {
        if(head == null || head.next == null)
            return head;
        
        ListNode curr = head.next;
        head.next =  curr.next;
        curr.next = head;

        head.next = swapPairs(head.next);
        System.out.println(curr.val);
        return curr;
    }
{% endhighlight %}

head  :  4->3->2->1

{% highlight java %}
        ListNode curr = head.next;
        head.next =  curr.next;
        curr.next = head;
{% endhighlight %}

curr  3->head
head  4->2->1

head.next   2->1

    swapPairs(head.next);

head.next   1->2

Output : curr  3->4->1->2



