var LGlobal = function (){}  
LGlobal.type = "LGlobal";  
LGlobal.canvas = null;  
LGlobal.width = 0;  
LGlobal.height = 0;  
LGlobal.childList = new Array();  
LGlobal.setCanvas = function (id,width,height){  
    var canvasObj = document.getElementById(id);  
    if(width)canvasObj.width = width;  
    if(height)canvasObj.height = height;  
    LGlobal.width = canvasObj.width;  
    LGlobal.height = canvasObj.height;  
    LGlobal.canvas = canvasObj.getContext("2d");  
}   
LGlobal.onShow = function (){  
    if(LGlobal.canvas == null)return;  
    LGlobal.canvas.clearRect(0,0,LGlobal.width,LGlobal.height);  
    LGlobal.show(LGlobal.childList);  
}  
LGlobal.show = function(showlist){  
    var key;  
    for(key in showlist){  
        if(showlist[key].show){  
            showlist[key].show();  
        }  
    }  
}  


var loader;

function main() {
	loader =  new LLoader();
	loader.addEventListener(LEvent.COMPLETE,loadBitmapdata);
	loader.load("./img/fish0.png","bitmapData");
}

function loadBitmapdata(event){
	var bitmapdata = new LBitmapData(loader.content);
	var bitmap = new LBitmap(bitmapdata);
	addChild(bitmap);
}

// LGlobal.onShow = function(){
// 	if (LGlobal.canvas == null) {
// 		return;
// 	};
// 	LGlobal.canvas.clearRect(0,0,LGlobal.width,LGlobal.height);
// }