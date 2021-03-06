/*jshint browser: true, devel: true, esversion: 6 */
/* globals context, canvas, cWidth, cHeight, player, computer, ball, keys, interface, endOfRound */

// Paddle constructor, called upon by both players (Player and AI) constructors
function Paddle(x, y, width, height, speed) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.speed = speed;

	this.dx = 0;
	this.dy = 0;
}

// Paddle render method
Paddle.prototype.render = function () {
	context.fillStyle = settings.colors.textMain;
	context.fillRect(this.x, this.y, this.width, this.height);
};

// Paddle move method, called upon by certain keypresses
Paddle.prototype.move = function (x, y) {
	let xSign = x < 0 ? -1 : 1;
	let ySign = y < 0 ? -1 : 1;
	
	if (Math.abs(x) > this.speed) {
		x = this.speed * xSign;
	}
		
	if (Math.abs(y) > this.speed) {
		y = this.speed * ySign;
	}
	
	this.dx = x;
	this.dy = y;

	if (this.y + this.dy <= 0) {
		this.y = 0;
	} else if (this.y + this.dy >= cHeight - this.height) {
		this.y = cHeight - this.height;
	} else {
		this.y += this.dy;
		this.x += this.dx;
	}
};

// Ball constructor for the single ball, created in initialization
function Ball(x, y, radius, speed) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.angle = 20;
	this.speed = speed;
	
	this.dx = 0;
	this.dy = 0;
	
	this.trailArray = [];
	
	this.initialParams = [x, y, radius, speed];
	
	//inter-frame collision direction adjustments
	this.dxAdjust = 0;
	this.dyAdjust = 0;
}

// For when the ball resets, and eventually to randomize the way the ball moves each round
Ball.prototype.setInitialAngle = function() {
	this.angle = 20;
};

// Ball render method
Ball.prototype.render = function () {
	//first because the white, real, ball must be on top
	this.renderTrail();
	
	context.beginPath();
	context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
	context.fillStyle = settings.colors.textMain;
	context.fill();	
};

// Ball movement trail animation
// from https://www.kirupa.com/canvas/creating_motion_trails.htm
Ball.prototype.addToTrailArray = function () {
	let maxLength = 100;
	
	if (!this.trailArray) {
		this.trailArray = [];
	}
	this.trailArray.unshift({x: this.x, y: this.y});
	
	while (this.trailArray.length > maxLength) {
		this.trailArray.pop();
	}
};

Ball.prototype.renderTrail = function () {
	//i starts at 1, to prevent the first (current) ball from getting rendered
	let radiusMin = 2;
	let radiusMax = 5;
	let opacityMin = 0.01;
	let opacityMax = 0.3;
	
	for (let i = 1; i < this.trailArray.length; i++) {
		let ratio = 1 - (i / this.trailArray.length);
		let r = radiusMin + ratio * (radiusMax - radiusMin);
		let o = opacityMin + ratio * (opacityMax - opacityMin);
		let c = "rgba(255, 255, 255, " + o + ")";
		
		context.beginPath();
    	context.arc(this.trailArray[i].x, this.trailArray[i].y, r, 2 * Math.PI, false);
    	context.fillStyle = c;
    	context.fill();
	}
};

// Ball update method, runs every frame and checks for collisions, angle, and moves
Ball.prototype.update = function (pLeft, pRight) {
	if (state.playing === true) {
		if (this.isAccurateCollisionNeeded(pLeft, pRight)) {
			console.warn("ACCURATE COLLISION CHECK ENABLED");
			for (let i = 0; i < this.speed; i++) {
				this.detectPaddle(pLeft, pRight);
    			this.detectWall();
				this.move(1);
			}
		} else {
			this.detectPaddle(pLeft, pRight);
    		this.detectWall();
			this.move(this.speed);
		}
		
		this.outOfBounds();
		this.addToTrailArray();
	}
	
};

Ball.prototype.isAccurateCollisionNeeded = function(pLeft, pRight) {
	let angleRad = this.angle * (Math.PI / 180);
	let projectedX = this.speed * Math.cos(angleRad) + this.x;
	let projectedY = this.speed * Math.sin(angleRad) + this.y;
	let dir = this.getDirection();
	
	if (dir.left === true) {
		//check left paddle
		if (this.x - this.radius > pLeft.x + pLeft.width && projectedX + this.radius < pLeft.x + pLeft.width) {
			//if before movement right of paddle and after movement left of paddle
			return true;
		} else {
			return false;
		}
	} else if (dir.right === true) {
		//check right paddle
		if (this.x - this.radius < pRight.x && projectedX - this.radius > pRight.x + pRight.width) {
			return true;
		} else {
			return false;
		}
	}
};

// Ball move method, which calculates movement from angle (in rad) and distance
Ball.prototype.move = function(distance) {
	let angleRad = this.angle * (Math.PI / 180);

	this.dx = distance * Math.cos(angleRad);
	this.dy = distance * Math.sin(angleRad);
	
	this.x += this.dx;
	this.y -= this.dy;
};

// Ball detect wall collision method
Ball.prototype.detectWall = function () {
	let dir = this.getDirection();
	
	let newAngle = this.angle;
	
	//check direction ball is travelling in, to know which walls to check
	if (dir.left === true) {
		if (this.x - this.radius < -(this.radius)) {
			//left wall
			//newAngle = this.reflectYAxis(newAngle);
			endOfRound(1);
			return;
		}
	} else if (dir.right === true) {
		if (this.x + this.radius > cWidth + this.radius) {
			//right wall
			//newAngle = this.reflectYAxis(newAngle);
			endOfRound(0);
			return;
		}
	}
	
	if (dir.up === true) {
		if (this.y - this.radius < 0) {
			//top wall
			newAngle = this.reflectXAxis(newAngle);
		}
	} else if (dir.down === true) {
		if (this.y + this.radius > cHeight) {
			//bottom wall
			newAngle = this.reflectXAxis(newAngle);
		}
	}
	
	this.angle = newAngle;
};

Ball.prototype.detectPaddle = function (pLeft, pRight) {
    let dir = this.getDirection();
    
    //only check when near left or right side
    if (this.x > cWidth * 0.9 || this.x < cWidth * 0.1) {
        if (dir.left === true) {
            //check left paddle
            if (this.x - this.radius <= pLeft.x + pLeft.width && this.x > pLeft.x) {
                //second part checks whether the center of the ball has not passed the left side of the paddle, just additional check
                //at correct x coords, now check y coords
                if (this.y + this.radius >= pLeft.y && this.y + this.radius <= pLeft.y + pLeft.height) {
                    //collision
                    this.angle = this.reflectYAxis();
                }
            }
        } else if (dir.right === true) {
            //check right paddle
            if (this.x + this.radius >= pRight.x && this.x + this.radius < pRight.x + pRight.width) {
                if (this.y + this.radius >= pRight.y && this.y + this.radius <= pRight.y + pRight.height) {
                    this.angle = this.reflectYAxis();
                }
            }
        }
    }
};

// Ball method to reflect over the y-axis (so right > left, left > right)
Ball.prototype.reflectYAxis = function (deg) {
	let angle = deg || this.angle;
	
	angle = this.boundAngle(180 - angle);
	
	return angle;
};

// Ball method to reflect over the x-axis (so up > down, down > up)
Ball.prototype.reflectXAxis = function (deg) {
	let angle = deg || this.angle;
	
	angle = this.boundAngle(360 - angle);
	
	return angle;
};

// Ball helper method to keep the angle between 0 and 360, with 360 = 0
Ball.prototype.boundAngle = function (deg) {	
	while (deg < 0) {
		deg += 360;
	}
	while (deg >= 360) {
		deg -= 360;
	}
	
	return deg;
};

// Ball method which allows for checking which direction the ball is travelling in
Ball.prototype.getDirection = function (angle) {
	let dir = {
		up: false,
		down: false,
		left: false,
		right: false
	};
	
	let deg = angle || this.angle;
	
	if (deg > 0 && deg < 180) {
		dir.up = true;
	} else if (deg > 180 && deg < 360) {
		dir.down = true;
	}
	
	if (deg > 270 || deg < 90) {
		dir.right = true;
	} else if (deg > 90 && deg < 270) {
		dir.left = true;
	}
	
	return dir;
};

// Ball prototype that gets activated when the ball is where it is not supposed to be (outside game bounds)
Ball.prototype.outOfBounds = function() {
    if (this.y < -5 || this.y > cHeight + 5) {
		this.reset();
	}
};

Ball.prototype.reset = function() {
	this.x = this.initialParams[0];
	this.y = this.initialParams[1];
	this.speed = this.initialParams[3];
	this.trailArray = [];
	this.dx = 0;
	this.dy = 0;
	this.setInitialAngle();
};

// Player constructor, called by initialization, creates paddle
function Player(width, height, speed) {
	let x = 20;
	let y = (cHeight / 2) - (height / 2); //calculates middle

	this.paddle = new Paddle(x, y, width, height, speed);
}

// Player render method renders the paddle
Player.prototype.render = function () {
	this.paddle.render();
};

// Player update method, runs every frame and checks for keypresses
Player.prototype.update = function () {
	let moveX = 0,
		moveY = 0;

	if (keys.ArrowUp === true) {
		if (keys.ArrowDown === true) {
			moveY = 0;
		} else {
			moveY -= this.paddle.speed;
		}
	} else if (keys.ArrowDown === true) {
		moveY += this.paddle.speed;
	}

	this.paddle.move(moveX, moveY);
};

// AI/Computer constructor, called by init, similar to Player constructor
function Computer(width, height, speed) {
	let x = cWidth - (20 + width);
	let y = (cHeight / 2) - (height / 2);

	this.paddle = new Paddle(x, y, width, height, speed);
}

// Computer render method renders the paddle
Computer.prototype.render = function () {
	this.paddle.render();
};

// Computer update method so that it moves with the ball
Computer.prototype.update = function (b) {
	//TODO: implement reaction time (typical human + 10 ms), activate AI when player hits the ball, maybe spawn invisible ball that the AI can track to use as misdirection with bounce-angle
	//also, if ball moves away, move slower
	//or, if ball moves away, slowly go back to the center
	
	let dir = b.getDirection();
	let paddleMid = this.paddle.y + (this.paddle.height / 2);
    
    //if ball moving away, return to center
    if (dir.left) {
        this.moveTo(Math.round(cHeight / 2));
    } else {
		//move to ball
		this.moveTo(ball.y);
	}
};

// Computer separate move method so that it moves TO a point instead of a direction
Computer.prototype.moveTo = function(y) {
	let paddleMid = Math.round(this.paddle.y + (this.paddle.height / 2));
	
	this.paddle.move(0, y - paddleMid);
};

function Interface() {
	this.score = [];
}

Interface.prototype.update = function(score) {
	this.score = score;
};

Interface.prototype.render = function() {
	this.renderMiddleLine();
	this.renderScore();
	if (state.playing !== true && state.game === true) {
		//if not playing but in game (instead of menu)
		this.renderSpaceToStart();
	}
};

Interface.prototype.renderSpaceToStart = function() {
	context.font = "30px Verdana";
	let text = "Press [SPACE] to play";
	let tWidth = context.measureText(text).width;
	let xPos = 0.5 * (cWidth - tWidth);
	context.fillStyle = "red";
	context.fillText(text, xPos, cHeight - 60);
};

Interface.prototype.renderMiddleLine = function() {
	context.beginPath();	
	context.strokeStyle = "rgba(255,255,255,0.7)";
	context.setLineDash([8, 12]);
	context.lineWidth = 2;
	context.moveTo(cWidth/2, 0);
	context.lineTo(cWidth/2, cHeight);
	context.stroke();
};

Interface.prototype.renderScore = function() {
	context.font = "90px Verdana";
	let widthLeft = context.measureText(this.score[0]).width;
	let widthRight = context.measureText(this.score[1]).width;
	
	let halfWidth = cWidth / 2;
	
	context.fillStyle = "rgba(255,255,255,0.1)";
	
	context.fillText(this.score[0], halfWidth / 2 - widthLeft / 2, 100);
	context.fillText(this.score[1], halfWidth / 2 + halfWidth - widthRight / 2, 100);
};
