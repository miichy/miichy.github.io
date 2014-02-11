// function drawCanvas(){ //onload="drawCanvas()"
// 		var canvas = document.getElementById("myCanvas");
// 		if (canvas.getContext) {
// 			var ctx = canvas.getContext("2d");

// 			//ctx.font =  "30px Courier New";
// 			ctx.font = "20pt Times New Roman";

// 			ctx.fillStyle = "red";

// 			ctx.fillText("Hello Front-End.",20,20);
// 		};
// 	}

window.onload = function(){
	var canvas = document.getElementById('myCanvas');
	//get paint
	var ctx = canvas.getContext('2d');
	//set font
	//ctx.font = '20px Courier New';
	//set style
	//ctx.fillStyle = "red";

	
	// image = new Image();
	// image.src = "./img/fish0.png";
	// 	//draw image
	// 	ctx.drawImage(image,0,0240,240);

	var img = document.getElementById('myImg');
	ctx.drawImage(img,0,0,50,50,0,0,50,50);
	
}
