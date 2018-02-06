/*jshint browser: true, devel: true, esversion: 6 */
/* globals Player, Computer, Ball */

let canvas = document.getElementById("main-canvas");
let context = canvas.getContext("2d");
let cWidth = canvas.width;
let cHeight = canvas.height;

let colors = {
	bg: "#1f1f1f",
	textMain: "#eeeeee"
};

// Functions to check for currently pressed keys
let keys = {};

function addKeyListeners() {
	document.addEventListener("keydown", listenerKeyDown, false);
	document.addEventListener("keyup", listenerKeyUp, false);
}

function listenerKeyUp(e) {
	delete keys[e.key];
	console.log(keys);
}

function listenerKeyDown(e) {
	if (!keys[e.key]) {
		keys[e.key] = true;
		console.log(keys);
	}	
}


// Base functions for the game
// 		initGame initializes all constructors and starts functions when window is loaded
//		update loads the update method of all objects
//		render loads the render method of all objects
//		frame runs every frame, running update and render, and loads itself again
let player, computer, ball;

function initGame () {
	player = new Player(15, 70, 4);				//width, height, speed
	computer = new Computer(15, 70, 4); 		//width, height, speed
	ball = new Ball(15+20+7, cHeight/2, 7, 5); 	//x, y, radius, speed
	addKeyListeners();
	frame();
}

function update() {
	player.update();
	computer.update(ball);
	ball.update();
}

function render() {
	context.clearRect(0, 0, cWidth, cHeight);
	player.render();
	computer.render();
	ball.render();
}

function frame() {
	update();
	render();
	requestAnimationFrame(frame);
}

initGame();