/*jslint browser: true*/
/*jslint regexp: true*/
/*global $, jQuery, alert, console, MutationObserver*/

$(document).ready(function () {
    console.log("Document Loaded");
    drawSourceOnCanvas("img/face_outline.jpg",'im1');
    drawSourceOnCanvas("img/face_outline.jpg",'im2');
    drawSourceOnCanvas("img/face_outline.jpg",'im3');
    populateInputImages();
});

function populateInputImages() {
    'use strict';
    
    console.log("Waiting for input images");
    
    //define file-input buttons
    var in1 = $('#fileinput1'), in2 = $('#fileinput2'), in3 = $('#fileinput3'), grayscaleButton = $('#greyButton'), defaultsButton = $('#defaults'), imagesChanged = [false, false, false];
    
    //track changes in input buttons
    in1[0].addEventListener('change', function (e) {
        var file = this.files[0], reader = new FileReader();

        reader.onload = function (e) {
            drawSourceOnCanvas(reader.result,'im1');
        };
        reader.readAsDataURL(file);
        
        imagesChanged[0] = true;
        if (allInputsPopulated(imagesChanged)) {
            document.getElementById('greyButton').style.display = "inline-block";
        }
    });
    
    in2[0].addEventListener('change', function (e) {
        var file = this.files[0], reader = new FileReader(), img = $('#im2');
        
        reader.onload = function (e) {
            drawSourceOnCanvas(reader.result,'im2');
        };
        reader.readAsDataURL(file);
        imagesChanged[1] = true;
        if (allInputsPopulated(imagesChanged)) {
            document.getElementById('greyButton').style.display = "inline-block";
        }
    });
    
    in3[0].addEventListener('change', function (e) {
        var file = this.files[0], reader = new FileReader(), img = $('#im3');
        
        reader.onload = function (e) {
            drawSourceOnCanvas(reader.result,'im3');
        };
        reader.readAsDataURL(file);
        imagesChanged[2] = true;
        if (allInputsPopulated(imagesChanged)) {
            document.getElementById('greyButton').style.display = "inline-block";
        }
    });
    
    //track defaults button
    defaultsButton[0].addEventListener('click', function () {
        console.log("Using default images");
        
        var defaultType = document.getElementById('defaultType').options[document.getElementById('defaultType').selectedIndex].value;
        console.log(defaultType);
        var url1, url2, url3;
        switch(defaultType){
            case 'Artificial Faces':
                url1 = "img/Face1.jpg";
                url2 = "img/Face2.jpg";
                url3 = "img/Face3.jpg";
                break;
            case 'Textured Blobs':
                url1 = "img/Blob1.jpg";
                url2 = "img/Blob2.jpg";
                url3 = "img/Blob3.jpg";
                break;
            case '3D Objects':
                url1 = "img/Glass1.jpg";
                url2 = "img/Glass2.jpg";
                url3 = "img/Glass3.jpg";
                break;
        }
        
        drawSourceOnCanvas(url1,'im1');
        drawSourceOnCanvas(url2,'im2');
        drawSourceOnCanvas(url3,'im3');  

        //display grayscale button
        document.getElementById('greyButton').style.display = "inline-block";
    });
    
    //track grayscale button
    grayscaleButton[0].addEventListener('click', function () {
        grayscaleImages();
        doFFT();
    });
}

function drawSourceOnCanvas(source,canID){
    var ctx = document.getElementById(canID).getContext('2d');
    var img = new Image();
    img.onload = function(){
        ctx.drawImage(img,0,0,256,256);
    };
    img.src = source;
}

function drawSourcePlusKernelsOnCanvas(source, canID){
    
    //get kernel source 1
    var rows = [];
    var cols = [];
    var orientations = [];
    var scales = [];
    var strs = [];
    
    for (var i=0;i<5;i++){
        var rowStr = 'kernel_' + i + '_row';
        var colStr = 'kernel_' + i + '_col';
        var orientationStr = 'kernel_' + i + '_orient';
        var scaleStr = 'kernel_' + i + '_scale';
        
        cols[i] = parseInt(document.getElementById(rowStr).options[document.getElementById(rowStr).selectedIndex].value);
        rows[i] = parseInt(document.getElementById(colStr).options[document.getElementById(colStr).selectedIndex].value);
        var orientation = parseInt(document.getElementById(orientationStr).options[document.getElementById(orientationStr).selectedIndex].value);
        scales[i] = parseInt(document.getElementById(scaleStr).options[document.getElementById(scaleStr).selectedIndex].value);
        
        orientations[i] = Math.abs(Math.ceil((orientation / 22.5)));
        scales[i] = ((scales[i] -16) / 8) + 1;
        
        strs[i] = 'img/wavelets/Scale_' + scales[i] + '_Orientation_' + orientations[i] + '.png';
    }
    
    
    //convert row col to grid coords
    
    for (i=0;i<5;i++){
        rows[i] = (rows[i] *20 + 20)-128;
        cols[i] = (cols[i] *20 + 20)-128;
    }
    
    
    var ctx = document.getElementById(canID).getContext('2d');
    
    //First draw the image
    var img = new Image();
    img.onload = function(){
        ctx.drawImage(this,0,0,256,256);
    };
    img.src = source;
    
    //then draw each kernel with a label of a specified color
    letters = ["A","B","C","D","E"];
    colors = ["#985984","#119D65","#E8CD15","#FB6107","#0BBFCF"];
    for (var j=0;j<5;j++){
        var temp = new Image();
        temp.coords = {x: rows[j], y: cols[j]};
        temp.j = j;
        temp.onload = function(){
            ctx.drawImage(this,this.coords.x,this.coords.y,256,256);            
            ctx.font="bold 30px Arial";
            ctx.fillStyle = colors[this.j];
            ctx.fillText(letters[this.j],this.coords.x + 120,this.coords.y + 140);
        };
        temp.src = strs[j];
    }
}

function grayscaleImages() {
    'use strict';
    
    console.log("Grayscaling images...");
    //get current src urls
    var colorURL1 = document.getElementById('im1').toDataURL();
    var colorURL2 = document.getElementById('im2').toDataURL();
    var colorURL3 = document.getElementById('im3').toDataURL();
    
    //grayscale the urls
    var url1 = grayscaleImage(colorURL1,'im1');
    var url2 = grayscaleImage(colorURL2,'im2');
    var url3 = grayscaleImage(colorURL3,'im3');
    
    //draw grayscaled sources on gray canvases
    drawSourceOnCanvas(url1,'im1');
    drawSourceOnCanvas(url2,'im2');
    drawSourceOnCanvas(url3,'im3');
    
    //show dot grids
    var dot1 = $('#dot1'), dot2 = $('#dot2'), dot3 = $('#dot3');
    dot1[0].style.display = 'inline-block';
    dot2[0].style.display = 'inline-block';
    dot3[0].style.display = 'inline-block';
}

//finish this
function grayscaleImage(source,canID) {
    var ctx = document.getElementById(canID).getContext('2d');
    var img = new Image();
    img.onload = function(){
        ctx.drawImage(img,0,0,256,256);
    };
    img.src = source;
    var mpImg = new MegaPixImage(img);
    mpImg.render(document.getElementById(canID), { maxWidth: 256, maxHeight: 256 });
    
    var imgPixels = ctx.getImageData(0, 0, 256, 256);
     
    for (var y = 0; y < imgPixels.height; y++){
        for (var x = 0; x < imgPixels.width; x++){
            var i = (y * 4) * imgPixels.width + x * 4;
            var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
            imgPixels.data[i] = avg; 
            imgPixels.data[i + 1] = avg; 
            imgPixels.data[i + 2] = avg;
        }
    }
    ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
    return document.getElementById(canID).toDataURL();
}

function reduceImage(image){
    var canvas = document.createElement('canvas');
    var canvasContext = canvas.getContext('2d');
     
    var imgWidth = image.width;
    var imgHeight = image.height;
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    
    
    canvasContext.drawImage(image, 0, 0);
    var imgPixels = canvasContext.getImageData(0, 0, imgWidth, imgHeight);
    
    var reducedPixels = [];
    var idx = 0;

     for(var y = 0; y < imgPixels.height; y++){
        for(var x = 0; x < imgPixels.width; x++){ 
            var i = (y * 4) * imgPixels.width + x * 4; //index
            reducedPixels[idx] = imgPixels.data[i];
            idx++;
        }
     }
    return reducedPixels;
}

function doFFT(){
    
    console.log('Doing FFT');
    var continueButton = $('#continueButton');
    continueButton[0].style.display = "inline-block";
    
    //update image variables
    var im1 = $('#im1'), im2 = $('#im2'), im3 = $('#im3');
    
    var spectrum1 = getSpectrum(im1);
    var spectrum2 = getSpectrum(im2);
    var spectrum3 = getSpectrum(im3);
    
    var FFT1 = makeComplexArray(spectrum1[0],spectrum1[1]);
    var FFT2 = makeComplexArray(spectrum2[0],spectrum2[1]);
    var FFT3 = makeComplexArray(spectrum3[0],spectrum3[1]);
    
    //unhide compute row
    var advanceButton = $('#continueButton');
    
    advanceButton.click(function(){
       //unhide button row
        var sRow = document.getElementById('settingsRow');
        sRow.style.display = "block"; 
        $('html, body').animate({
            scrollTop: $("#settingsRow").offset().top
        }, 1000);
    });
    
    var toGraphButton = $('#goToChartButton');
    
    //.one() only allows function to be called once
    toGraphButton.one('click',(function(){
        
        document.getElementById('graphRow').style.display = "block";
        
        $('html, body').animate({
        	scrollTop: $("#graphRow").offset().top
	    }, 1000);
        var userKernels = extractUserKernels();
        setKernelImages();
        $(document).one('click','#b_real1',function(){
            calculateSimilarity(FFT1, FFT2, FFT3, userKernels);
        });
    }));
}

function makeComplexArray(real,imaginary){
    var c = [];
    for (var i=0; i<real.length; i++){
        c[i] = math.complex(real[i],imaginary[i]);
    }
    return c;
}

function getSpectrum(image){  
    
    //REDUCE IMAGE DOWN TO 256x256
    image = reduceImage(image[0]);
    
    //2-D FFT ON IMAGE
    var imFreq = twoDimensionalFFT(image);
    
    //RETURN FINISHED PRODUCT
    return imFreq;
}

function setKernelImages(){
    'use strict';
    
    console.log("Setting kernel images...");
    
    //get current src urls
    var imURL1 = document.getElementById('im1').toDataURL();
    var imURL2 = document.getElementById('im2').toDataURL();
    var imURL3 = document.getElementById('im3').toDataURL();
    
    //draw grayscaled sources on gray canvases
    drawSourcePlusKernelsOnCanvas(imURL1,'k1');
    drawSourcePlusKernelsOnCanvas(imURL2,'k2');
    drawSourcePlusKernelsOnCanvas(imURL3,'k3');
    
}

function extractUserKernels(){
    
    var kernels = [];
    
    for (var i=0;i<5;i++){
        var rowStr = 'kernel_' + i + '_row';
        var colStr = 'kernel_' + i + '_col';
        var orientationStr = 'kernel_' + i + '_orient';
        var scaleStr = 'kernel_' + i + '_scale';
        
        var row = parseInt(document.getElementById(rowStr).options[document.getElementById(rowStr).selectedIndex].value);
        var col = parseInt(document.getElementById(colStr).options[document.getElementById(colStr).selectedIndex].value);
        var orientation = parseInt(document.getElementById(orientationStr).options[document.getElementById(orientationStr).selectedIndex].value);
        var scale = parseInt(document.getElementById(scaleStr).options[document.getElementById(scaleStr).selectedIndex].value);
        
        orientation = Math.abs(Math.ceil((orientation-1) / 22.5));
        scale = (scale -16) / 8;
        row = row -1;
        col = col -1;
        
        kernels[i] = ((scale*8 + orientation) * 100) + (row * 10) + col;
    }
    return kernels;
}

function allInputsPopulated(boolArr) {
    'use strict';
    console.log("Checking if images are populated...");
    if (boolArr[0] && boolArr[1] && boolArr[2]) {
        console.log("...all images populated");
        return true;
    }
    console.log("...not all images populated");
    return false;
}

function imageIsLoaded(e) {
    $('#myImg').attr('src', e.target.result);
}

//2-D fft
function twoDimensionalFFT(imageArray){
    
    var imageArrayReal = [];
    var imageArrayImag = [];
    
    var row, col, idx, imag;
    
    //by columns
    for(col = 0; col<256; col++){
        
        var column = [];
        imag = [];
        
        for (row = 0; row<256; row++){
            idx = col + (256 * row);
            column[row] = imageArray[idx];
            imag[row] = 0.0;
        }
    
        //1d fft here (in place)
        transform(column,imag);
        
        for (row = 0; row<256; row++){
            idx = col + (256 * row);
            imageArrayReal[idx] = column[row];
            imageArrayImag[idx] = imag[row];
        }
    }
    
    
    //by rows
    for (row = 0; row < 256 ; row++){
        
        var currRow = [];
        imag = [];
        
        for (col = 0; col<256; col++){
            idx = col + (256 * row);
            currRow[col] = imageArrayReal[idx];
            imag[col] = imageArrayImag[idx];
        }
        
        //1d fft here
        transform(currRow,imag);
        
        for (col = 0; col<256; col++){
            idx = col + (256 * row);
            imageArrayReal[idx] = currRow[col];
            imageArrayImag[idx] = imag[col];
        }
    }
    
    return [imageArrayReal, imageArrayImag];
}

//2-D fft
function twoDimensionalIFFT(re, im){
    
    var imageArrayReal = [];
    var imageArrayImag = [];
    
    var row, col, idx, imag;
    
    //by columns
    for(col = 0; col<256; col++){
        
        var column = [];
        imag = [];
        
        for (row = 0; row<256; row++){
            idx = col + (256 * row);
            column[row] = re[idx];
            imag[row] = im[idx];
        }
        
        //1d fft here (in place)
        inverseTransform(column,imag);
        
        for (row = 0; row<256; row++){
            idx = col + (256 * row);
            imageArrayReal[idx] = column[row];
            imageArrayImag[idx] = imag[row];
        }
    }
    
    
    //by rows
    for (row = 0; row < 256 ; row++){
        
        var currRow = [];
        imag = [];
        
        for (col = 0; col<256; col++){
            idx = col + (256 * row);
            currRow[col] = imageArrayReal[idx];
            imag[col] = imageArrayImag[idx];
        }
        
        //1d fft here
        inverseTransform(currRow,imag);
        
        for (col = 0; col<256; col++){
            idx = col + (256 * row);
            imageArrayReal[idx] = currRow[col];
            imageArrayImag[idx] = imag[col];
        }
    }
    
    return [imageArrayReal, imageArrayImag];
}

function calculateSimilarity(FFT1, FFT2, FFT3, kernels){
    console.log("Calculating Similarity");
    //CREATE GRID
    //set up x and y vectors
    var xyRange = [];
    for (var i = 0; i < 10; i ++){
        xyRange[i] = 20 + 20 * i;
    }
    
    //set up meshgrid
    var grid = meshgrid(xyRange, xyRange);
    var xPositions = grid[0];
    var yPositions = grid[1];
    
    //set up mag arrays
    var mags1 = [];
    var mags2 = [];
    var mags3 = [];
    
    //get magnitudes for first image
    mags1 = gaborCalc(FFT1,xPositions,yPositions);
    
    for (var j=0;j<8000;j++){
        mags1[j] = mags1[j] /100000;
    }
    
    var displayMags1 = [];
    for (var i=0; i<4000; i++){
        displayMags1[i] = math.sqrt(math.pow(mags1[i],2)+math.pow(mags1[i+4000],2));
    }
    
    //define modified Bar chart
    Chart.types.Bar.extend({
        name: "BarAlt",
        draw: function () {
            Chart.types.Bar.prototype.draw.apply(this, arguments);

            var ctx = this.chart.ctx;
            ctx.save();
            // text alignment and color
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = this.options.scaleFontColor;
            // position
            var x = this.scale.xScalePaddingLeft * 0.4;
            var y = this.chart.height / 2;
            // change origin
            ctx.translate(x, y);
            // rotate text
            ctx.rotate(-90 * Math.PI / 180);
            ctx.font = "20px Helvetica";
            ctx.fillText("Magnitude (Arbitrary Units)", 0, 0);
            ctx.restore();
        }
    });
    
    var options = {
        //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
        scaleBeginAtZero : false,

        //Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines : true,

        //String - Colour of the grid lines
        scaleGridLineColor : "rgba(0,0,0,.05)",

        //Number - Width of the grid lines
        scaleGridLineWidth : 1,

        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,

        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,

        //Boolean - If there is a stroke on each bar
        barShowStroke : true,

        //Number - Pixel width of the bar stroke
        barStrokeWidth : 2,

        //Number - Spacing between each of the X value sets
        barValueSpacing : 30,

        //Number - Spacing between data sets within X values
        barDatasetSpacing : 15,

        //String - A legend template
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    };
    
    var data = {
        labels: ["A", "B", "C", "D", "E"],
        datasets: [
            {
                label: "Image 1",
                fillColor: "rgba(213,198,122,0.2)",
                strokeColor: "rgba(213,198,122,1)",
                highlightFill: "rgba(213,198,122,0.75)",
                highlightStroke: "rgba(213,198,122,1)",
                data: [displayMags1[kernels[0]], displayMags1[kernels[1]], displayMags1[kernels[2]], displayMags1[kernels[3]], displayMags1[kernels[4]]]
            },{
                label: "Image 2",
                fillColor: "rgba(0,83,119,0)",
                strokeColor: "rgba(0,83,119,0)",
                highlightFill: "rgba(0,83,119,0)",
                highlightStroke: "rgba(0,83,119,0)",
                data: [0,0,0,0,0]
            },{
                label: "Image 3",
                fillColor: "rgba(6,167,125,0)",
                strokeColor: "rgba(6,167,125,0)",
                highlightFill: "rgba(6,167,125,0)",
                highlightStroke: "rgba(6,167,125,0)",
               data: [0,0,0,0,0]
            }
        ]
    };
    
    var chartCtx = document.getElementById("magChart").getContext("2d");
    var barChart = new Chart(chartCtx).BarAlt(data,options);
    
    var b = document.getElementById('b_real2');
    b.style.display = "inline-block";
    
    var b2 = document.getElementById('b_real3');
    
    $(document).one('click','#b_real2',function(){
        mags2 = gaborCalc(FFT2,xPositions,yPositions);
    
        for (var j=0;j<8000;j++){
            mags2[j] = mags2[j] /100000;
        }
        
        var displayMags2 = [];
        for (var i=0; i<4000; i++){
            displayMags2[i] = math.sqrt(math.pow(mags2[i],2)+math.pow(mags2[i+4000],2));
        }

        barChart.datasets[1].bars[0].value = displayMags2[kernels[0]];
        barChart.datasets[1].bars[1].value = displayMags2[kernels[1]];
        barChart.datasets[1].bars[2].value = displayMags2[kernels[2]];
        barChart.datasets[1].bars[3].value = displayMags2[kernels[3]];
        barChart.datasets[1].bars[4].value = displayMags2[kernels[4]];
        
        for (i=0;i<5;i++){
            barChart.datasets[1].bars[i].fillColor = "rgba(0,83,119,0.2)";
            barChart.datasets[1].bars[i].strokeColor = "rgba(0,83,119,1)";
            barChart.datasets[1].bars[i].highlightFill = "rgba(0,83,119,0.75)";
            barChart.datasets[1].bars[i].highlightStroke = "rgba(0,83,119,1)";
        }

        barChart.update();

        b2.style.display = "inline-block";    
    });
    
    $(document).one('click','#b_real3',function(){
        mags3 = gaborCalc(FFT3,xPositions,yPositions);
    
        for (var j=0;j<8000;j++){
            mags3[j] = mags3[j] /100000;
        }
        
        var displayMags3 = [];
        for (var i=0; i<4000; i++){
            displayMags3[i] = math.sqrt(math.pow(mags3[i],2)+math.pow(mags3[i+4000],2));
        }
        
            barChart.datasets[2].bars[0].value = displayMags3[kernels[0]];
            barChart.datasets[2].bars[1].value = displayMags3[kernels[1]];
            barChart.datasets[2].bars[2].value = displayMags3[kernels[2]];
            barChart.datasets[2].bars[3].value = displayMags3[kernels[3]];
            barChart.datasets[2].bars[4].value = displayMags3[kernels[4]];
        
            for (i=0;i<5;i++){
                barChart.datasets[2].bars[i].fillColor = "rgba(6,167,125,0.2)";
                barChart.datasets[2].bars[i].strokeColor = "rgba(6,167,125,1)";
                barChart.datasets[2].bars[i].highlightFill = "rgba(6,167,125,0.75)";
                barChart.datasets[2].bars[i].highlightStroke = "rgba(6,167,125,1)";
            }
          
        
        barChart.update();
        
        var computeButton = document.getElementById('compute');
        computeButton.style.display = "inline-block";
        
        var phaseRow = document.getElementById('phaseRow');
        phaseRow.style.display = "inline-block";
        
        $('html, body').animate({
                scrollTop: $("#magChart").offset().top
        }, 1000);    
    });
    
    $(document).one('click','#compute',function(){
        //euclidean distance, scale down by 10
        var dist1 = euclidean(mags1, mags2) /10;
        dist1 = parseInt(dist1,10);
        
        var dist2 = euclidean(mags2, mags3) /10;
        dist2 = parseInt(dist2,10);
        
        var dist3 = euclidean(mags1, mags3) /10;
        dist3 = parseInt(dist3,10);
        
        var pair1 = {dist: dist1, image1: 'im1', image2: 'im2'};
        var pair2 = {dist: dist2, image1: 'im2', image2: 'im3'};
        var pair3 = {dist: dist3, image1: 'im1', image2: 'im3'};
        
        //sort array of pair objects
        var arr = [pair1, pair2, pair3];
        arr.sort(function(a,b){return b.dist - a.dist;});
        
        //display the pairs along with truncated dissim values
        populateScoreRow(arr[0],1);
        populateScoreRow(arr[1],2);
        populateScoreRow(arr[2],3);
        
        //display the row
        document.getElementById('scoreRow').style.display = "block";
	$('html, body').animate({
        	scrollTop: $("#scoreRow").offset().top
	}, 1000);
    });
    
    $(document).one('click','#phaseButton',function(){
        fillPhaseTable(mags1,mags2,mags3,kernels);
        var phaseTable = document.getElementById('phaseVals');
        phaseTable.style.display = "inline-block";
        
    });
    
    var restartButton = $('#restartButton');
    
    restartButton.one('click',(function(){
        location.reload();
    }));
}

function fillPhaseTable(mags1,mags2,mags3,kernels){
    //given magnitudes (first 4000 real, next 4000 imaginary), compute phase and populate table

    magsArr = [mags1,mags2,mags3];
    
    for (var k=1; k<6; k++){
        for (var im=1; im<4; im++){
            var mags = magsArr[im-1];
            
            var idx = kernels[k-1];
            
            var val = Math.round((Math.atan2(mags[idx+4000],mags[idx])) * 100) / 100;
            
            idStr = k.toString() + "_" + im.toString();
            
            document.getElementById(idStr).innerHTML = val.toString();
        }
    }
    
    
    
    
}

function gaborCalc(arr, xPositions, yPositions){
    //set up parameters
    var magsReal = [];
    var magsImag = [];
    
    var numScales = 5;
    var numOrientations = 8;
    
    var xyResL = 256;
    var halfResL = 128;
    var kFactor = 2 * Math.PI/ 256;
    
    var txtyRange =[];
    
    var len = 256;
    
    var i;
    
    for (i = 0; i < len ; i++){
        txtyRange[i] = i - 128;
    }
    
    //meshgrid
    var txty = meshgrid(txtyRange, txtyRange);    
    var tx = txty[0];
    var ty = txty[1];
    
    len = tx.length;
    
    for (i=0; i<len;i++){
        tx[i] = kFactor * tx[i];
        ty[i] = kFactor * -ty[i];
    }
    
    //set up magnitude and phase vectors
    //var jetsMagnitude = new Array(numScales * numOrientations * 100); //100 because of grid size //now passed in as "mags"
    
    var Sigma = 2 * Math.PI;
    
    for (var scale = 0; scale < numScales; scale ++){
        var k0 = ((Math.PI)/2)*Math.pow((1/Math.sqrt(2)),scale);
        
        for (var orientation = 0; orientation < numOrientations; orientation++){
            var kA = Math.PI* orientation / numOrientations;
            
            var k0X = k0 * Math.cos(kA);
            var k0Y = k0 * Math.sin(kA);
            var kernel =[];
            
            //CREATE KERNEL
            len = tx.length;
            var scalingFactor = 30;
            
            for (i = 0;i<len; i++){
                kernel[i] = scalingFactor*Math.PI*(Math.exp(-Math.pow((Sigma/k0),2)/2*(Math.pow((k0X-tx[i]),2)+Math.pow((k0Y-ty[i]),2)))-Math.exp(-Math.pow((Sigma/k0),2)/2*(Math.pow(k0,2)+Math.pow(tx[i],2)+Math.pow(ty[i],2))));
            }
            
            //FFTSHIFT
            var shiftedKernel = fftshift(kernel);
            
            //CONVOLUTION
            var filteredImage = elementWiseMult(arr, shiftedKernel);
            
            //IFFT
            var image = twoDimensionalIFFT(math.re(filteredImage),math.im(filteredImage));
            var real = image[0];
            var imag = image[1];
            
            //populate magnitudes arrays
            getMagsAtScaleOrientation(magsReal, real, xPositions,yPositions,scale,orientation);
            getMagsAtScaleOrientation(magsImag, imag, xPositions,yPositions,scale,orientation);
        }
    }
    //final set made by concatenating real and imaginary
    var mags = magsReal.concat(magsImag);
    return mags;
    
}

function getMagsAtScaleOrientation(arr,image, xx, yy, scale, orientation){
    
    var base = (scale*8 + orientation) * 100;
    
    for (var i = 0; i< 100; i++){
        var xPos = xx[i];
        var yPos = yy[i];
        var imageIdx = (xPos * 256) + yPos;

        arr[base+i] = image[imageIdx];
    }
}

function meshgrid(xVec, yVec){
    
    var width = xVec.length;
    var height = yVec.length;
    
    var xx = [];
    var yy = [];
    
    for (var col = 0; col < width; col++){
        var value = xVec[col];
        
        for (var row = 0; row < height; row++){
            var idx = (row * width) + col;
            xx[idx] = value;
        }
    }
    
    for (var row2 = 0;row2 < height; row2++){
        var value2 = yVec[row2];
        
        for (var col2 = 0; col2 < width; col2++){
            var idx2 = (row2 * width) + col2;
            
            yy[idx2] = value2;
        }
    }
    
    var arr = [];
    arr[0] = xx;
    arr[1] = yy;
    
    return arr;
}

function getMagnitude(realArr, imagArr){
    
    var mags = [];
    
    for (var i = 0; i < realArr.length; i++){
        mags[i] = Math.sqrt((Math.pow(realArr[i],2))+(Math.pow(imagArr[i],2)));
    }
    
    return mags;
}

function fftshift(arr){

    var shiftedKernel = [];
    var targetRow, targetCol, targetIdx;
    
    for (var row = 0; row < 256; row++){
        for (var col = 0; col < 256; col++){
            var idx = (row *256) + col;
            
            if (row < 128) { //top half of image
                
                if (col < 128){ //top left of image
                
                    targetRow = row + 128;
                    targetCol = col + 128;
                    targetIdx = (targetRow * 256) + targetCol;
                    
                    shiftedKernel[targetIdx] = arr[idx];
                    
                }else{ //top right of image
                
                    targetRow = row + 128;
                    targetCol = col - 128;
                    targetIdx = (targetRow * 256) + targetCol;
                    
                    shiftedKernel[targetIdx] = arr[idx];
                    
                }
                
            }
            else{ //bottom half of image
                
                if (col < 128){ //bottom left
                    
                    targetRow = row - 128;
                    targetCol = col + 128;
                    targetIdx = (targetRow * 256) + targetCol;
                    
                    shiftedKernel[targetIdx] = arr[idx];
                    
                }else{ //bottom right
                
                    targetRow = row - 128;
                    targetCol = col - 128;
                    targetIdx = (targetRow * 256) + targetCol;
                    
                    shiftedKernel[targetIdx] = arr[idx];
                }
            }
        }
    }

    
    return shiftedKernel;
}

function euclidean(v1, v2){
    var len = v1.length;
    var sum = 0;
    
    for (var i = 0; i<len;i++){
        sum = sum + Math.pow((v1[i] - v2[i]),2);
    }
    
    return Math.sqrt(sum);
}

function elementWiseMult(a, b){
    
    if (a.length != b.length){
        console.log('Arrays unequal in length');
        return;
    }
    
    var numEl = a.length;
    
    var product = [];
    
    for (var i=0; i<a.length; i++){
        product[i] = math.multiply(a[i], b[i]);
    }
    
    return product;

}

function populateScoreRow(obj, rowIdx){
    var im1, src1, im2, src2, valStr;
    switch (rowIdx){
        case 1:
            src1 = document.getElementById(obj.image1).toDataURL();
            drawSourceOnCanvas(src1,'pair1im1');
            
            src2 = document.getElementById(obj.image2).toDataURL();
            drawSourceOnCanvas(src2,'pair1im2');
            
            valStr = "Dissimilarity Value: ";
            document.getElementById('score1').innerHTML = valStr.concat(obj.dist.toString());
            break;
        case 2:
            src1 = document.getElementById(obj.image1).toDataURL();
            drawSourceOnCanvas(src1,'pair2im1');
            
            src2 = document.getElementById(obj.image2).toDataURL();
            drawSourceOnCanvas(src2,'pair2im2');
            
            valStr = "Dissimilarity Value: ";
            document.getElementById('score2').innerHTML = valStr.concat(obj.dist.toString());
            break;
        case 3:
            src1 = document.getElementById(obj.image1).toDataURL();
            drawSourceOnCanvas(src1,'pair3im1');
            
            src2 = document.getElementById(obj.image2).toDataURL();
            drawSourceOnCanvas(src2,'pair3im2');
            
            valStr = "Dissimilarity Value: ";
            document.getElementById('score3').innerHTML = valStr.concat(obj.dist.toString());
            break;
    }
}