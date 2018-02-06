/*jshint browser: true, devel: true, esversion: 6 */
/* globals context, canvas, cWidth, cHeight, colors, player, computer, ball, keys, interface */

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
	context.fillStyle = colors.textMain;
	context.fillRect(this.x, this.y, this.width, this.height);
};

// Paddle move method, called upon by certain keypresses
Paddle.prototype.move = function (x, y) {
	this.dx = x * this.speed;
	this.dy = y * this.speed;

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
	
	//inter-frame collision direction adjustments
	this.dxAdjust = 0;
	this.dyAdjust = 0;
}

// Ball render method
Ball.prototype.render = function () {
	//first because the white, real, ball must be on top
	this.renderTrail();
	
	context.beginPath();
	context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
	context.fillStyle = colors.textMain;
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
	this.detectPaddle(pLeft, pRight);
    this.detectWall();
	this.move();
	this.outOfBounds();
	this.addToTrailArray();
};

// Ball move method, which calculates movement from angle (in rad) and speed
Ball.prototype.move = function() {
	let angleRad = this.angle * (Math.PI / 180);

	this.dx = this.speed * Math.cos(angleRad);
	this.dy = this.speed * Math.sin(angleRad);
	
	this.x += this.dx;
	this.y -= this.dy;
};

// Ball detect wall collision method
Ball.prototype.detectWall = function () {
	let dir = this.getDirection();
	console.log(dir);
	console.log(this.angle);
	
	let newAngle = this.angle;
	
	//check direction ball is travelling in, to know which walls to check
	if (dir.left === true) {
		if (this.x - this.radius < 0) {
			//left wall
			newAngle = this.reflectYAxis(newAngle);
		}
	} else if (dir.right === true) {
		if (this.x + this.radius > cWidth) {
			//right wall
			newAngle = this.reflectYAxis(newAngle);
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
                    newAngle = this.reflectYAxis();
                    this.angle = newAngle;
                }
            }
        } else if (dir.right === true) {
            //check right paddle
            if (this.x + this.radius >= pRight.x && this.x + this.radius < pRight.x + pRight.width) {
                if (this.y + this.radius >= pRight.y && this.y + this.radius <= pRight.y + pRight.height) {
                    newAngle = this.reflectYAxis();
                    this.angle = newAngle;
                }
            }
        }
    }
}

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
		//reset game
	}
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
			moveY += -1;
		}
	} else if (keys.ArrowDown === true) {
		moveY += 1;
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
        if (paddleMid > cHeight / 2) {
            //move up
            this.paddle.move(0, -1);
        } else if (paddleMid < cHeight / 2) {
            this.paddle.move(0, 1);
        } else {
            this.paddle.move(0, 0);
        }
    } else if (paddleMid - ball.y < -10 || dir.down) {
			//move down
			this.paddle.move(0, 1);
	} else if (paddleMid - ball.y > 10 || dir.up) {
			//move up
			this.paddle.move(0, -1);
	}
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
