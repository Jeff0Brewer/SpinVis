var c = document.getElementById("c");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");

var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;

var actx = new AudioContext();
var audio = new Audio('songe.mp3');
var audioSrc = actx.createMediaElementSource(audio);
var analyser = actx.createAnalyser();
audioSrc.connect(analyser);
audioSrc.connect(actx.destination);
var fData = new Uint8Array(analyser.frequencyBinCount);
audio.play();

var size = .01;
var numpetals = 17;
var rotation = 1;
var levels = new Array(Math.floor((.3*fData.length)/numpetals));
for(var i = 0; i < levels.length; i++){
	var colorval = i*19;
	var color = "rgb(" + colorval.toString() + "," + colorval.toString() + "," + colorval.toString() + ")";
	levels[i] = new level(2*i*numpetals,size,numpetals,rotation,color);
	rotation *= -1;
}

var refreshRate = 1;
setInterval(function()
{
	analyser.getByteFrequencyData(fData);

	ctx.clearRect(0,0,c.width,c.height);
	
	ctx.translate(cx, cy);
	for(var i = 0; i < levels.length; i++){
		levels[i].next(fData);
	}
	ctx.translate(-cx, -cy);
}, 
refreshRate);

function level(fstart, size, numpetals, rotation, color) {
	this.fstart = fstart;
	this.size = size;
	this.numpetals = numpetals;
	this.rotation = rotation;
	this.color = color;

	this.detail = numpetals*3;
	this.angleInc = 2*Math.PI / this.detail;
	this.startangle = Math.random(0, 2*Math.PI);
	this.lastLevel = 0;

	this.next = function(fdata){
		var aveLevel = 0;
		for(var i = 0; i < numpetals; i++){
			aveLevel += fdata[2*i + fstart];
		}
		aveLevel /= numpetals;
		
		this.startangle = this.startangle*.9 + rotation*(aveLevel - this.lastLevel)*.001;

		var currAngle = this.startangle;
		var petal = this.fstart;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(0,0);
		for (var i = 0; i < this.detail; i++){
			if(i % 3 < 2){
				var length = size*Math.pow((aveLevel*.7 + fdata[petal]*.3),2);
				ctx.lineTo(Math.cos(currAngle)*length, Math.sin(currAngle)*length);
				if(i % 3 == 1)
					petal++;
			}
			else
				ctx.lineTo(0,0);
			currAngle += this.angleInc;
		}
		ctx.closePath();
		ctx.fill();
	}
}

function resize(){
	cx = window.innerWidth / 2;
	cy = window.innerHeight / 2;
}