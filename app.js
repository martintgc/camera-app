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


/*
let canvasFrame = cameraSensor; // canvasFrame is the id of <canvas>
let context = canvasFrame.getContext("2d");
let src = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
let dst = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
const FPS = 30;


function processVideo() {
    let begin = Date.now();
    //context.drawImage(video, 0, 0, width, height);
    src.data.set(context.getImageData(0, 0, cameraView.videoWidth, cameraView.videoHeight).data);
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.imshow("#camera--output", dst); // canvasOutput is the id of another <canvas>;
    // schedule next one.
    let delay = 1000/FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
}
// schedule first one.
setTimeout(processVideo, 0);
  
*/




function checkFrame() {

    // your function code here
    if (blink.style.display === "none") {
        blink.style.display = "block";
    } else {
        blink.style.display = "none";
    }
    
    edge.width=cameraSensor.width;
    edge.height=cameraSensor.height;
    edge.style.opacity=0.5;
    let src = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC4);
    let dst = new cv.Mat(cameraView.videoHeight, cameraView.videoWidth, cv.CV_8UC1);
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0)
    src.data.set(cameraSensor.getContext("2d").getImageData(0, 0, cameraView.videoWidth, cameraView.videoHeight).data);

    
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    cv.bilateralFilter(src, src, 9, 75, 75, cv.BORDER_DEFAULT)		
    cv.adaptiveThreshold(src, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4)		
		
    cv.medianBlur(src, 11)		

    cv.copyMakeBorder(src, 5, 5, 5, 5, cv.BORDER_CONSTANT, value=[0, 0, 0])		
    edges = cv.Canny(src, 200, 250)

    cv.Canny(src, dst, 50, 100, 3, false);
   
    
    cv.imshow("ui--edge", dst);
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

