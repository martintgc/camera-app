// Set constraints for the video stream
var constraints = { video: { facingMode: { exact: "environment" } }, audio: false };
var track = null;
var pagecontour=null;
var src=null;
var tmp=null;
var good_frame=null;
var cnt_tmp=null;
var poly=null;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),
      dismissTrigger = document.querySelector("#ui--capdiv--hide"),
    edge = document.querySelector("#ui--edge"),
      feed = document.querySelector("#ui--feed"),
    blink = document.querySelector("#ui--blink");
    

// Access the device camera and stream to cameraView
function cameraStart() { 
   navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;
            setTimeout(checkFrame, 2000);
            initGlobals();
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
    
    
}



function initGlobals() {
	good_frame=new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
	pagecontour=new cv.Mat();
	console.log("Globals initialized");
}


function checkFrame() {

    // your function code here
    if (blink.style.display === "none") {
        blink.style.display = "block";
    } else {
        blink.style.display = "none";
    }
    	let MAX_CONTOUR_AREA = (cameraSensor.width - 10) * (cameraSensor.height - 10);
	let maxAreaFound = MAX_CONTOUR_AREA * 0.2;
	let requiredArea= MAX_CONTOUR_AREA * 0.45;
	let currentArea=0;

	
    edge.width=cameraSensor.width;
    edge.height=cameraSensor.height;
	edge.getContext("2d").clearRect(0,0,edge.width,edge.height);
	  edge.style.widht="100%";
    edge.style.height="100%";
   // edge.style.opacity=0.2;
    //let
    src = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
    let dst = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
    //let tmp = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
	let edges = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC3);
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    src.data.set(cameraSensor.getContext("2d").getImageData(0, 0, cameraView.videoWidth, cameraView.videoHeight).data);
	//rat = 800 / edge.height;
	
    //let dsize = new cv.Size(rat*edge.width, 800);
	//cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);
	
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);	
    //cv.adaptiveThreshold(dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4)		
	cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);	
    cv.medianBlur(dst, dst, 11)		

    cv.copyMakeBorder(dst, dst, 5, 5, 5, 5, cv.BORDER_CONSTANT, value=[0, 0, 0, 0]);	
    cv.Canny(dst,dst, 200, 250, 3, false);
	
	edges=cv.Mat.zeros(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC3);
	
	let contours = new cv.MatVector();
	let hierarchy = new cv.Mat();
	let poly = new cv.MatVector();
	let color=null;
	cnt_tmp = new cv.Mat();
	cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

	
	for (let i = 0; i < contours.size(); ++i) {
		
    		let cnt = contours.get(i);
		
		perimeter=cv.arcLength(cnt, true);
		cv.approxPolyDP(cnt, cnt_tmp, 0.03 * perimeter, true);
		console.log(cnt_tmp.rows);
		if (cv.isContourConvex(cnt_tmp) && (cnt_tmp.rows==4) && (maxAreaFound < cv.contourArea(cnt_tmp)) 
		   && (cv.contourArea(cnt_tmp)< MAX_CONTOUR_AREA) 
		   && (cv.contourArea(cnt_tmp)<requiredArea) ) {
			// we found a shape and we seem close enough to push the contour and make it red
			poly.push_back(cnt_tmp);
			color=new cv.Scalar(255,0,0);
			ctx=edge.getContext("2d");
    			ctx.beginPath();
			ctx.strokeStyle = "red";
    			ctx.arc(50, 50, 50, 0, (Math.PI / 180) * 360, 1);
    			ctx.stroke();
	

  
		}
		
		if (cv.isContourConvex(cnt_tmp) && (cnt_tmp.rows==4) && (maxAreaFound < cv.contourArea(cnt_tmp))
		   && (cv.contourArea(cnt_tmp)< MAX_CONTOUR_AREA)
		   && (cv.contourArea(cnt_tmp)>requiredArea) ) {
			pagecontour=cnt_tmp.clone();
			console.log(pagecontour);
			poly.push_back(cnt_tmp);
			color=new cv.Scalar(0,255,0);
			good_frame=src.clone();
			ctx=edge.getContext("2d");
			for (let j = 0; j < pagecontour.size(); ++j) {
    				ctx.beginPath();
				ctx.strokeStyle = "green";
    				ctx.arc(pagecontour[j].x, pagecontour[j].y, 50, 0, (Math.PI / 180) * 360, 1);
    				
			}
			ctx.stroke();
			//orderPoints(pagecontour);
			//makeTheCut();
		}
		  /*
		   ) {
			good_frame=src.clone();
			currentArea=cv.contourArea(cnt_tmp);
		    	poly.push_back(cnt_tmp);
			pagecontour=cnt_tmp.clone();
			
			makeTheCut();
		 } else {
			
		 }*/
		for (let j = 0; j < poly.size(); ++j) {
			cv.drawContours(edges, poly, j, color, 2, cv.LINE_8, new cv.Mat(), 0);
		}
		
	}

    //cv.imshow("ui--edge", edges);
	
    dst.delete();
    edges.delete();

    setTimeout(checkFrame, 500);  
}

function makeTheCut() {
	document.querySelector("#ui--capdiv").style.display="block";
	
		
	//let rect = cv.boundingRect(pagecontour);
	//console.log(rect.height +' '+ rect.width);
	let dsize = new cv.Size(good_frame.rows, good_frame.cols);
	tmp=cv.Mat.zeros(good_frame.rows, good_frame.cols, cv.CV_8UC4);
	
	var targetPlane=[0,0,0,rect.height,rect.width,rect.height,rect.width,0];
	
	let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, targetPlane);
	let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, targetPlane);
	let M = cv.getPerspectiveTransform(srcTri, dstTri);
	cv.warpPerspective(good_frame, tmp, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

	cv.imshow("ui--capture", tmp);
	tmp.delete();
	
}

dismissTrigger.onclick = function() {
	document.querySelector("#ui--capdiv").style.display="none";
}

function orderPoints(points) {
	ret_rect=[[0,0],[0,0],[0,0],[0,0]];
	points.sort(function compareNumbers(a, b) {return (a[0]+a[1]) - (b[0]+b[1]);});
	ret_rect[0]=points[0];
	ret_rect[2]=points[2];
	points.sort(function compareNumbers(a, b) {return (a[0]-a[1]) - (b[0]-b[1]);});
	ret_rect[1]=points[1];
	ret_rect[3]=points[3];
	console.log(ret_rect);
	return ret_rect;
}


// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
/*
	if (pagecontour !== null && pagecontour !== undefined && pagecontour.size()>0 &&
	   good_frame !== null && good_frame !== undefined
	   
	   ) {
	*/	
		
	document.querySelector("#ui--capdiv").style.display="block";
	
		
	let rect = cv.boundingRect(pagecontour);
		console.log(rect.height +' '+ rect.width);
	let dsize = new cv.Size(good_frame.rows, good_frame.cols);
	tmp=cv.Mat.zeros(good_frame.rows, good_frame.cols, cv.CV_8UC4);
	
	var targetPlane=[0,0,0,rect.height,rect.width,rect.height,rect.width,0];
	
	let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, targetPlane);
	let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, targetPlane);
	let M = cv.getPerspectiveTransform(srcTri, dstTri);
	cv.warpPerspective(good_frame, tmp, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

	cv.imshow("ui--capture", tmp);
	tmp.delete();
	
	
	/*
    edge.width=cameraSensor.width;
    edge.height=cameraSensor.height;
    edge.style.opacity=0.2;
    let src = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
    let dst = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0)
    src.data.set(cameraSensor.getContext("2d").getImageData(0, 0, cameraSensor.width, cameraSensor.height).data);
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.imshow("ui--edge", dst);
    edge.style.widht="100%";
    edge.style.height="100%";
	*/
    /*
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    cameraOutput.src = cameraSensor.toDataURL("image/webp");
    
    cameraOutput.classList.add("taken");
    */
    // track.stop();
};

// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);


// Install ServiceWorker
if ('serviceWorker' in navigator) {
  console.log('CLIENT: service worker registration in progress.');
  navigator.serviceWorker.register( '/camera-app/sw.js' , { scope : ' ' } ).then(function() {
    console.log('CLIENT: service worker registration complete.');
  }, function() {
    console.log('CLIENT: service worker registration failure.');
  });
} else {
  console.log('CLIENT: service worker is not supported.');
}

