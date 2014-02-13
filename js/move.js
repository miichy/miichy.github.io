var picSub = 0;   
   
 var time = 50; //时间间隔(毫秒)   
   
 var pic1 = "./img/1.png";   
 var pic2 = "./img/2.png";   
 var pic3 = "./img/3.png";   
 var pic4 = "./img/1.png";   
 var picArr = [pic1, pic2, pic3, pic4]; //定义数组，并将图片的位置所对应的变量放入其中  
   
 setInterval(changeImg, time); //使图片按一定时间切换  
   
 function changeImg()   
 {   
     var xElem = document.getElementById("move_img");   
   
     if(picSub == picArr.length-1){   
         picSub = 0;   
     }else{   
         picSub += 1;   
     } //判断是否超出数组长度，若超出，便使数组下标归0,使其不超出  
       
     xElem.src = picArr[picSub]; //切换图片  
 }   
   
 function changeFight()  
 {  
     pic1 = "./img/f1.png";  
     pic2 = "./img/f2.png";  
     pic3 = "./img/f3.png";  
     pic4 = "./img/f4.png";  
   
     picArr = [pic1, pic2, pic3, pic4];  
       
     setTimeout(reduction, 600);  
 }  
   
 function reduction()  
 {  
     pic1 = "./img/1.png";   
     pic2 = "./img/2.png";   
     pic3 = "./img/3.png";   
     pic4 = "./img/1.png";  
     picArr = [pic1, pic2, pic3, pic4];  
 }

function followMouse(event){
	if (followMouse.timeset) clearInterval(followMouse.timeset);
	var img = document.getElementById('move_img');
	var imgW = img.width;
	var imgH = img.height;
	var mLeft = event.clientX;
	var mTop = event.clientY;
	var left = parseInt(img.style.left),
	top = parseInt(img.style.top),
	xpos,ypos;

	var im = img;
	var offsetTop = im.offsetTop;
	var offsetLeft = im.offsetLeft;
	var offsetW = im.offsetWidth;
	var offsetH = im.offsetHeight;
	while(im = im.offsetParent){
		offsetTop += im.offsetTop;
		offsetLeft += im.offsetLeft;
	}
	left = offsetLeft;
	top = offsetTop;

	console.log(mLeft+":"+mTop+":"+left+":"+top);

	move = function(){
		if(top == mTop && left == mLeft) return false;//	如果图片的LEFT与TOP与鼠标坐标相等，则返回					
		if(mTop>top){
			ypos = Math.ceil((mTop-top)/10);//一次移动距离的10分之一
			top = top+ypos;//图片的坐标在原来的基础上加上移动距离
		}else{
			ypos = Math.ceil((top - mTop)/10);
			top = top-ypos;
		}
		if(mLeft>left){
			xpos = Math.ceil((mLeft - left)/10);
			left = left+xpos;
		}else{
			xpos = Math.ceil((left - mLeft)/10);
			left = left-xpos;
		}
		console.log(xpos+":"+ypos);
		img.style.left = left+"px";//设置图片的LEFT坐标
		img.style.top = top+"px";
			
	}
	followMouse.timeset = setInterval(move,10);
}
