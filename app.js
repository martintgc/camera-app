// Set constraints for the video stream
var constraints = { video: { facingMode: { exact: "environment" } }, audio: false };
var track = null;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),
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
            
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
    
    
}





function checkFrame() {

    // your function code here
    if (blink.style.display === "none") {
        blink.style.display = "block";
    } else {
        blink.style.display = "none";
    }
    
    edge.width=cameraSensor.width;
    edge.height=cameraSensor.height;
    edge.style.opacity=0.3;
    let src = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
    let dst = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
    let tmp = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC3);
	
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    src.data.set(cameraSensor.getContext("2d").getImageData(0, 0, cameraView.videoWidth, cameraView.videoHeight).data);

    
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);	
    //cv.adaptiveThreshold(dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4)		
	cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);	
    cv.medianBlur(dst, dst, 11)		

    cv.copyMakeBorder(dst, dst, 5, 5, 5, 5, cv.BORDER_CONSTANT, value=[0, 0, 0, 0]);	
    cv.Canny(dst,dst, 200, 250, 3, false);
	
	//let tmp = cv.Mat.zeros(dst.cols, dst.rows, cv.CV_8UC1);
	tmp=cv.Mat.zeros(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
	let contours = new cv.MatVector();
	let hierarchy = new cv.Mat();
	let poly = new cv.MatVector();
	let cnt_tmp = new cv.Mat();
	cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
	/*
	for (let i = 0; i < contours.size(); ++i) {
    		let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
                              Math.round(Math.random() * 255));
    		cv.drawContours(tmp, contours, i, color, 1, cv.LINE_8, hierarchy, 0);
	}
	*/
	
	for (let i = 0; i < contours.size(); ++i) {
		
    		let cnt = contours.get(i);
		
		perimeter=cv.arcLength(cnt, true);
		cv.approxPolyDP(cnt, cnt_tmp, 0.03 * perimeter, true);
		//if (cnt_tmp.size==4) {
		if (cv.isContourConvex(cnt_tmp)) {
		    poly.push_back(cnt_tmp);
		 }
		cv.drawContours(tmp, contours, i, new cv.Scalar(255,255,255), 1, cv.LINE_8, new cv.Mat(), 0);
	
		
		
	}
	
	for (let j = 0; j < poly.size(); ++j) {
		cv.drawContours(tmp, poly, j, new cv.Scalar(255,0,0), 2, cv.LINE_8, new cv.Mat(), 0);
	}
	
	
	
	
	
    //cv.Canny(src, dst, 50, 100, 3, false);
   
    
    cv.imshow("ui--edge", tmp);
    edge.style.widht="100%";
    edge.style.height="100%";

    setTimeout(checkFrame, 1000);  
}



// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
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
//window.addEventListener("load", checkFrame, false);

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

