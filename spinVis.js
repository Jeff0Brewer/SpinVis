var c = document.getElementById("c");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");

var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;

var songs = ['songe.mp3'];
			 
var currsong = 0;

var actx = new AudioContext();
var audio = new Audio(songs[currsong]);
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

ctx.translate(cx,cy);

requestAnimationFrame(function() { animateframe(); });

function animateframe(){
	if(audio.currentTime >= audio.duration){
		currsong++;
		audio = new Audio(songs[currsong]);
		audioSrc = actx.createMediaElementSource(audio);
		audioSrc.connect(analyser);
		audioSrc.connect(actx.destination);
		audio.play();
	}
	analyser.getByteFrequencyData(fData);

	ctx.clearRect(-cx,-cy,c.width,c.height);

	var l = levels.length;
	for(var i = 0; i < l; i++){ levels[i].next(fData); }

	requestAnimationFrame(function() { animateframe(); });
}


function level(fstart, size, numpetals, rotation, color) {
	this.fstart = fstart;
	this.size = size;
	this.numpetals = numpetals;
	this.rotation = rotation;
	this.color = color;

	this.detail = numpetals*3;
	this.angleInc = 2*Math.PI / this.detail;
	this.startangle = Math.random(0, 2*Math.PI);

	this.next = function(fdata){
		var aveLevel = 0;
		for(var i = 0; i < this.numpetals; i++){
			aveLevel += fdata[2*i + fstart];
		}
		aveLevel /= this.numpetals;
		
		this.startangle = this.startangle*.9 + this.rotation*aveLevel*.001;

		var currAngle = this.startangle;
		var petal = this.fstart;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(0,0);
		for (var i = 0; i < this.detail; i++){
			if(i % 3 < 2){
				var sq = aveLevel*.7 + fdata[petal]*.3;
				var length = size*sq*sq;
				ctx.lineTo(Math.cos(currAngle)*length, Math.sin(currAngle)*length);
			}
			else{
				ctx.lineTo(0,0);
				petal++;
			}
			currAngle += this.angleInc;
		}
		ctx.closePath();
		ctx.fill();
	}
}

function resize(){
	ctx.translate(-cx,-cy);

	cx = window.innerWidth / 2;
	cy = window.innerHeight / 2;

	c.width = window.innerWidth;
	c.height = window.innerHeight;

	ctx.translate(cx,cy);
}
