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