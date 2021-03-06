var AudioContext = window.AudioContext
	|| window.webkitAudioContext;

var c = document.getElementById("c");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");

var cx = window.innerWidth / 2;
var cy = window.innerHeight / 2;

var songname = document.getElementById("songname");
var songtime = document.getElementById("songtime");

var currsong = 0;
var songs = [new Song('songe.mp3',
					  'ODESZA - Divide (feat. Kelsey Bulkin)')];
songname.innerHTML = songs[currsong].name;

var actx = new AudioContext();
var audio = new Audio(songs[currsong].file);
var audioSrc = actx.createMediaElementSource(audio);
var analyser = actx.createAnalyser();
audioSrc.connect(analyser);
audioSrc.connect(actx.destination);
var fData = new Uint8Array(analyser.frequencyBinCount);

var clockmax = 360;
var clockmin = 290;
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
var size = .009;
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

function animateframe(){
	if(audio.currentTime >= audio.duration)
		nextsong(false);
	songtime.innerHTML = Math.floor(audio.currentTime / 60).toString() + ":" + 
				  ("0" + Math.floor(audio.currentTime % 60).toString()).slice(-2);

	analyser.getByteFrequencyData(fData);

	ctx.clearRect(-clearsize, -clearsize, 2*clearsize, 2*clearsize);
	drawclock(clock, audio, fData);
	var starsize = drawstar(levels, fData);
	var clocksize = clock.radius + 2*clock.bodywidth;
	clearsize = clocksize > starsize ? clocksize : starsize;

	if(!audio.paused)
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

function Song(file, name){
	this.file = file;
	this.name = name;
}

function shuffle(array){
	var len = array.length;
	for(var i = 0; i < len; i++){
		var ind = Math.floor(Math.random()*(len - i)) + i;
		var temp = array[i]
		array[i] = array[ind];
		array[ind] = temp;
	}
}

function nextsong(paused){
	if(currsong < songs.length - 1){
		audio.pause();
		currsong++;
		songname.innerHTML = songs[currsong].name;

		audio = new Audio(songs[currsong].file);
		audioSrc = actx.createMediaElementSource(audio);
		audioSrc.connect(analyser);
		audioSrc.connect(actx.destination);
		if(!paused)
			audio.play();
	}
	checkbuttons();
}

function prevsong(paused){
	if(currsong > 0){
		audio.pause();
		currsong--;
		songname.innerHTML = songs[currsong].name;

		audio = new Audio(songs[currsong].file);
		audioSrc = actx.createMediaElementSource(audio);
		audioSrc.connect(analyser);
		audioSrc.connect(actx.destination);
		if(!paused)
			audio.play();
	}
	checkbuttons();
}

function resize(){
	ctx.translate(-cx,-cy);

	cx = window.innerWidth / 2;
	cy = window.innerHeight / 2;

	c.width = window.innerWidth;
	c.height = window.innerHeight;

	ctx.translate(cx,cy);
}

var clickopacity = .7;
var hoveropacity = .85;
var menu = document.getElementById("menu");

menu.onmouseenter = function(){
	menu.className = menu.className.replace("hiding", "showing");
}

menu.onmouseleave = function(){
	if(menu.className.indexOf("showing") == -1)
		menu.className += " hiding";
	else
		menu.className = menu.className.replace("showing", "hiding");
}

var file_in = document.getElementById("file_in");
var filebutton = document.getElementById("filebutton");

file_in.onchange = function(){
	var files = this.files;
	if(files.length != 0){
		songs = [];
		for(var i = 0; i < files.length; i++){
			songs.push(new Song(URL.createObjectURL(files[i]), 
								files[i].name.substring(0,files[i].name.lastIndexOf("."))));
		}
		shuffle(songs);

		currsong = -1;
		nextsong(audio.paused);
	}
}

filebutton.onmouseenter = function(){ filebutton.style.opacity = hoveropacity; }
filebutton.onmousedown = function(){ filebutton.style.opacity = clickopacity; }
filebutton.onmouseleave = function(){ filebutton.style.opacity = 1; }
filebutton.onmouseup = function(){ filebutton.style.opacity = hoveropacity; }

var playpause = document.getElementById("playpause");
var play_symbol = document.getElementById("play_symbol");
var pause_symbol = document.getElementById("pause_symbol");

playpause.onmouseenter = function(){ play_symbol.style.opacity = hoveropacity;
									 pause_symbol.style.opacity = hoveropacity; }
playpause.onmousedown = function(){ play_symbol.style.opacity = clickopacity;
									pause_symbol.style.opacity = clickopacity; }	
playpause.onmouseleave = function(){ play_symbol.style.opacity = 1;
									 pause_symbol.style.opacity = 1; }							 								 
playpause.onmouseup = function(){
	play_symbol.style.opacity = hoveropacity;
	pause_symbol.style.opacity = hoveropacity;
	if(audio.paused){
		audio.play();
		play_symbol.style.visibility = "hidden";
		pause_symbol.style.visibility = "visible";
		requestAnimationFrame(function() { animateframe(); });
	}
	else{
		audio.pause();
		pause_symbol.style.visibility = "hidden";
		play_symbol.style.visibility = "visible";
	}
}

var backsong = document.getElementById("backsong");

backsong.onmouseenter = function(){ backsong.style.opacity = hoveropacity; }
backsong.onmousedown = function(){ backsong.style.opacity = clickopacity; }
backsong.onmouseleave = function(){ 
	if(backsong.style.pointerEvents !== "none") 
		backsong.style.opacity = 1; 
}
backsong.onmouseup = function(){
	backsong.style.opacity = hoveropacity; 
	prevsong(audio.paused);
}

var skipsong = document.getElementById("skipsong");

skipsong.onmouseenter = function(){ skipsong.style.opacity = hoveropacity; }
skipsong.onmousedown = function(){ skipsong.style.opacity = clickopacity; }
skipsong.onmouseleave = function(){ 
	if(skipsong.style.pointerEvents !== "none")
		skipsong.style.opacity = 1; 
}
skipsong.onmouseup = function(){
	skipsong.style.opacity = hoveropacity;
	nextsong(audio.paused);
}

var gitbutton = document.getElementById("gitbutton");

gitbutton.onmouseenter = function(){ gitbutton.style.opacity = hoveropacity; }
gitbutton.onmousedown = function(){ gitbutton.style.opacity = clickopacity; }
gitbutton.onmouseleave = function(){ gitbutton.style.opacity = 1; }
gitbutton.onmouseup = function(){ gitbutton.style.opacity = 1; }

checkbuttons();

function checkbuttons(){
	if(currsong == 0){
		backsong.style.pointerEvents = "none";
		backsong.style.opacity = clickopacity;
	}
	else{
		backsong.style.pointerEvents = "auto";
		backsong.style.opacity = 1;
	}
	if(currsong == songs.length - 1){
		skipsong.style.pointerEvents = "none";
		skipsong.style.opacity = clickopacity;
	}
	else{
		skipsong.style.pointerEvents = "auto";
		skipsong.style.opacity = 1;
	}
	if(audio.paused){
		pause_symbol.style.visibility = "hidden";
		play_symbol.style.visibility = "visible";
	}
	else{
		play_symbol.style.visibility = "hidden";
		pause_symbol.style.visibility = "visible";
	}

}