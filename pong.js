/*jshint browser: true, devel: true, esversion: 6 */
/* globals Player, Computer, Ball, Interface */

let canvas = document.getElementById("main-canvas");
let context = canvas.getContext("2d");
let cWidth = canvas.width;
let cHeight = canvas.height;

let settings = {
	colors: {
		bg: "rgba(31, 31, 31, 1)", //#1f1f1f
		textMain: "rgba(238, 238, 238, 1)" //#eeeeee
	},
	baseBallRadius: 7,
	baseBallSpeed: 15,
	basePaddleWidth: 10,
	basePaddleHeight: 70,
	playerSpeed: 5,
	computerSpeed: 4
};

let state = {
	menu: false,
	game: true,
	playing: false,
	score: [0,0],
	startGameState: function() {
		if (state.game === false) {
			state.menu = false;
			state.game = true;
			state.playing = false;
		}
	},
	startMenuState: function() {
		if (state.menu === false) {
			state.menu = true;
			state.game = false;
			state.playing = false;
		}
	},
	startPlayingState: function() {
		//unique in that, when playing, gameState is also true
		if (state.playing === false) {
			state.menu = false;
			state.game = true;
			state.playing = true;
		}
	}
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

function spaceToStartGame() {
	if (keys[" "] === true && state.playing !== true) {
		state.playing = true;
	}
}


// Base functions for the game
// 		initGame initializes all constructors and starts functions when window is loaded
//		update loads the update method of all objects
//		render loads the render method of all objects
//		frame runs every frame, running update and render, and loads itself again
let player, computer, ball, interface;

function initGame() {
	interface = new Interface(state.score);
	player = new Player(settings.basePaddleWidth, settings.basePaddleHeight, settings.playerSpeed); //width, height, speed
	computer = new Computer(settings.basePaddleWidth, settings.basePaddleHeight, settings.computerSpeed); //width, height, speed
	ball = new Ball(settings.basePaddleWidth + 20 + settings.baseBallRadius, cHeight / 2, settings.baseBallRadius, settings.baseBallSpeed); //x, y, radius, speed
	addKeyListeners();
	frame();
}

function update() {
	interface.update(state.score);
	if (state.playing === true) {
		player.update();
		computer.update(ball);
		ball.update(player.paddle, computer.paddle);
	} else if (state.playing === false) {
		spaceToStartGame();
	}

}

function render() {
	context.clearRect(0, 0, cWidth, cHeight);
	interface.render();
	player.render();
	computer.render();
	ball.render();
}

function endOfRound(winner) {
	reset();
	state.score[winner] += 1;
}

function reset() {

	ball.reset();
	delete keys[" "];
	state.playing = false;
}

function frame() {
	update();
	render();
	requestAnimationFrame(frame);
}

initGame();
