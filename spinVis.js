var c = document.getElementById("c");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");

var songname = document.getElementById("songname");
var songtime = document.getElementById("songtime");

var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;

var currsong = 0;
var songs = ['Slow Magic - Waited 4 U (ODESZA Remix).mp3'];
var songdir = "";

songname.innerHTML = songs[currsong].substring(0,songs[currsong].lastIndexOf('.'));

var actx = new AudioContext();
var audio = new Audio(songdir + songs[currsong]);
var audioSrc = actx.createMediaElementSource(audio);
var analyser = actx.createAnalyser();
audioSrc.connect(analyser);
audioSrc.connect(actx.destination);
var fData = new Uint8Array(analyser.frequencyBinCount);
audio.play();

var clockmax = 400;
var clockmin = 325;
var bodywidth = 11;
var timerwidth = 9;
var clockbodycolor = "rgb(0,0,0)";
var clocktimercolor = "rgb(170,170,170)";
var clocksmoothness = .99;
var clockfreq = 10;
var clock = new Clock(clockmax, clockmin, bodywidth, clockbodycolor, timerwidth, clocktimercolor, clocksmoothness, clockfreq);

var stR = 0, stG = 0, stB = 0;
var endR = 255, endG = 255, endB = 255;
var numtop = 3;
var size = .01;
var numpetals = 17;
var rotation = 1;
var levels = new Array(Math.floor((.3*fData.length)/numpetals));
for(var i = 0; i < levels.length; i++){
	var R = Math.ceil((endR - stR)*(i/(levels.length - 1 - numtop)) + stR);
	var G = Math.ceil((endG - stG)*(i/(levels.length - 1 - numtop)) + stG);
	var B = Math.ceil((endB - stB)*(i/(levels.length - 1 - numtop)) + stB);
	var color = "rgb(" + R.toString() + "," + G.toString() + "," + B.toString() + ")";
	levels[i] = new Level(2*i*numpetals,size,numpetals,rotation,color);
	rotation *= -1;
}

var inc = 2*Math.PI / (numpetals*3);
var sin = [];
var cos = [];
var angle = 0;
for(var i = 0; i < numpetals*3; i++){
	sin.push(Math.sin(angle));
	cos.push(Math.cos(angle));
	angle += inc;
}

ctx.translate(cx,cy);
var clearsize = clock.radius + clock.bodywidth;

requestAnimationFrame(function() { animateframe(); });

function animateframe(){
	if(audio.currentTime >= audio.duration){
		if(currsong < songs.length - 1){
			currsong++;

			songname.innerHTML = songs[currsong].substring(0,songs[currsong].lastIndexOf('.'));

			audio = new Audio(songdir + songs[currsong]);
			audioSrc = actx.createMediaElementSource(audio);
			audioSrc.connect(analyser);
			audioSrc.connect(actx.destination);
			audio.play();
		}
	}
	songtime.innerHTML = Math.floor(audio.currentTime / 60).toString() + ":" + 
				  ("0" + Math.floor(audio.currentTime % 60).toString()).slice(-2);

	analyser.getByteFrequencyData(fData);

	ctx.clearRect(-clearsize, -clearsize, 2*clearsize, 2*clearsize);
	drawclock(clock, audio, fData);
	var starsize = drawstar(levels, fData);
	var clocksize = clock.radius + 2*clock.bodywidth;
	clearsize = clocksize > starsize ? clocksize : starsize;

	requestAnimationFrame(function() { animateframe(); });
}

function drawclock(clock, song, data){
	clock.next(song, data);
}

function drawstar(star, data){
	var maxlen = 0;
	var l = star.length;
	for(var i = 0; i < l; i++){ 
		var temp = star[i].next(data);
		maxlen = temp > maxlen ? temp : maxlen;
	}
	return maxlen;
}

function Clock(maxrad, minrad, bodywidth, bodycolor, timerwidth, timercolor, smoothness, freq){
	this.maxradius = maxrad;
	this.minradius = minrad;
	this.radius = maxrad;
	this.bodywidth = bodywidth/2;
	this.bodycolor = bodycolor;
	this.timerwidth = timerwidth;
	this.timercolor = timercolor;
	this.smoothness = smoothness;
	this.freq = freq;

	this.bodystroke = 1;
	this.startangle = 3*Math.PI/2;
	this.endangle = 0;

	this.next = function(song, data){
		var avelevel = 0;
		for(var i = 0; i < this.freq; i++)
			avelevel += data[i];
		avelevel /= this.freq;

		this.radius = this.radius*this.smoothness + ((this.maxradius-this.minradius)*(1 - avelevel/255) + this.minradius)*(1 - this.smoothness);
		if(song.duration > 0)
			this.endangle = this.endangle*.95 + 2*Math.PI*song.currentTime/song.duration*.05;
		else if(this.endangle > 0)
			this.endangle = this.endangle*.95 + 2*Math.PI*.05;

		ctx.lineWidth = this.timerwidth;
		ctx.strokeStyle = this.timercolor;
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, this.startangle, this.endangle + this.startangle);
		ctx.stroke();

		ctx.lineWidth = this.bodystroke;
		ctx.strokeStyle = this.bodycolor;

		ctx.beginPath();
		ctx.arc(0, 0, this.radius - (this.timerwidth - this.bodystroke)/2, this.startangle, this.endangle + this.startangle);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0,-this.radius - this.bodywidth);
		ctx.lineTo(0,-this.radius + this.bodywidth);
		ctx.stroke();
	}
}


function Level(fstart, size, numpetals, rotation, color) {
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
		var l = this.numpetals*2;
		for(var i = 0; i < l; i += 2){
			aveLevel += fdata[i + fstart];
		}
		aveLevel /= this.numpetals;
		
		this.startangle = this.startangle*.9 + this.rotation*aveLevel*.001;

		var petal = this.fstart;
		var aveLevelScaled = aveLevel*.7;
		var sq = aveLevelScaled + fData[petal]*.3;
		var length = size*sq*sq;

		var maxlen = length;

		ctx.fillStyle = this.color;
		ctx.rotate(this.startangle);
		ctx.beginPath();
		ctx.moveTo(0,0);

		for (var i = 0; i < this.detail; i++){
			if(i % 3 < 2){
				ctx.lineTo(cos[i]*length, sin[i]*length);
			}
			else{
				ctx.lineTo(0,0);
				petal++;
				var sq = aveLevelScaled + fData[petal]*.3;
				length = size*sq*sq;
				maxlen = length > maxlen ? length : maxlen;
			}
		}

		ctx.closePath();
		ctx.fill();
		ctx.rotate(-1*this.startangle);

		return maxlen;
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
