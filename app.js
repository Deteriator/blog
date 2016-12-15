var ctx = document.getElementById("ctx").getContext("2d"); 
ctx.font = '30px Arial';

var WIDTH = 500;
var HEIGHT = 500;
var timeWhenGameStarted = Date.now();	

var frameCount = 0;
var paused = false;
var menu= false;
var score = 0;
var player;
var enemyList = {};
var upgradeList = {};
var bulletList = {};

var Img = {};
Img.start= new Image();
Img.start= "Img/start.png";
Img.player = new Image();
Img.player.src = "Img/player.png";
Img.enemy = new Image();
Img.enemy.src = 'Img/enemy.png';
Img.enemy2= new Image();
Img.enemy2.src= 'http://piskel-imgstore-b.appspot.com/img/81745766-38c5-11e6-929d-cb8c59393ac2.gif';
Img.bullet = new Image();
Img.bullet.src = 'Img/bullet.png';
Img.upgrade1 = new Image();
Img.upgrade1.src = 'Img/upgrade1.png';
Img.upgrade2 = new Image();
Img.upgrade2.src = 'Img/upgrade2.png';



function testCollisionRectRect(rect1,rect2){
	return rect1.x <= rect2.x+rect2.width 
		&& rect2.x <= rect1.x+rect1.width
		&& rect1.y <= rect2.y + rect2.height
		&& rect2.y <= rect1.y + rect1.height;
}

document.onmousedown = function(mouse){
  if(mouse.which=== 1)
	  player.pressingMouseLeft = true;
  else
      player.pressingMouseRight = true;
}
document.onmouseup = function(mouse){
  if(mouse.which=== 1)
	  player.pressingMouseLeft = false;
  else
      player.pressingMouseRight = false;
}

document.oncontextmenu = function(mouse){
	mouse.preventDefault();
}

document.onmousemove = function(mouse){
	var mouseX = mouse.clientX - document.getElementById('ctx').getBoundingClientRect().left;
	var mouseY = mouse.clientY - document.getElementById('ctx').getBoundingClientRect().top;
	
	mouseX -= WIDTH/2;
	mouseY -= HEIGHT/2;
	
	player.aimAngle = Math.atan2(mouseY,mouseX) / Math.PI * 180;
}

document.onkeydown = function(event){
	if(event.keyCode === 68)	//d
		player.pressingRight = true;
	else if(event.keyCode === 83)	//s
		player.pressingDown = true;
	else if(event.keyCode === 65) //a
		player.pressingLeft = true;
	else if(event.keyCode === 87) // w
		player.pressingUp = true;
    else if(event.keyCode===80) //p
        paused=!paused;
    else if(event.keyCode===72) //h
         player.performSpecialAttack();
}
     

document.onkeyup = function(event){
	if(event.keyCode === 68)	//d
		player.pressingRight = false;
	else if(event.keyCode === 83)	//s
		player.pressingDown = false;
	else if(event.keyCode === 65) //a
		player.pressingLeft = false;
	else if(event.keyCode === 87) // w
		player.pressingUp = false;
}

 function update(){
   if(paused){
   	ctx.fillText('Paused',WIDTH/2,HEIGHT/2);
   	return;
   }

	ctx.clearRect(0,0,WIDTH,HEIGHT);
	currentMap.draw();
	frameCount++;
	score++;
	updateBullet();
	updateUpgrade();
	updateEnemy();
	
	player.update();
	
	ctx.fillStyle = 'green';
		var hp = 100*player.hp/player.hpMax;
		if(hp < 0)
			hp = 0;
		ctx.fillRect(65,15,hp,10);
		
		ctx.fillStyle = 'blue';
		var sp = 100*player.sp/player.spMax;
		if(sp < 0)
			sp = 0;
		ctx.fillRect(65,25,sp,10);
		
		ctx.strokeStyle = 'black';
		ctx.strokeRect(65,15,100,20);
		
		ctx.restore();
	ctx.fillStyle= 'black';
	ctx.fillText('Score: ' + score,200,30);
}

 
 function Entity(type,id,x,y,spdX,spdY,width,height,img){
	var self = {
		type:type,
		id:id,
		x:x,
		y:y,
		spdX:spdX,
		spdY:spdY,
		width:width,
		height:height,
		img:img,
	};
	self.update = function(){
		self.updatePosition();
		self.draw();
	}
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		
		ctx.drawImage(self.img,
			0,0,self.img.width,self.img.height,
			x,y,self.width,self.height
		);
		
		ctx.restore();
	}
	self.getDistance = function(entity2){	//return distance (number)
		var vx = self.x - entity2.x;
		var vy = self.y - entity2.y;
		return Math.sqrt(vx*vx+vy*vy);
	}

	self.testCollision = function(entity2){	//return if colliding (true/false)
		var rect1 = {
			x:self.x-self.width/2,
			y:self.y-self.height/2,
			width:self.width,
			height:self.height,
		}
		var rect2 = {
			x:entity2.x-entity2.width/2,
			y:entity2.y-entity2.height/2,
			width:entity2.width,
			height:entity2.height,
		}
		return testCollisionRectRect(rect1,rect2);
		
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
				
		if(self.x < 0 || self.x > currentMap.width){
			self.spdX = -self.spdX;
		}
		if(self.y < 0 || self.y > currentMap.height){
			self.spdY = -self.spdY;
		}
	}
	
	return self;
}

 function Player(){
	var self = Actor('player','myId',50,40,30,5,50,70,Img.player,10,1,20);
	var super_update = self.update;
	self.update = function(){
		super_update();
		if(self.pressingRight || self.pressingLeft 
		|| self.pressingDown || self.pressingUp )
		   self.spriteAnimCounter += 0.2;
		if(self.pressingMouseLeft)
		self.performAttack();
		if(self.pressingMouseRight)
		self.preformSpecialAttack();
	}
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		var aimAngle = self.aimAngle;
		  if(aimAngle < 0)
		      aimAngle = 360 + aimAngle;
		var directionMod = 2 // draw right
		if(aimAngle >=45 && aimAngle <135) //down
		    directionMod = 0
		else if(aimAngle >= 135 && aimAngle < 225) //left
		    directionMod = 1
		else if(aimAngle >= 225 && aimAngle <315) //up
		    directionMod = 3
		var frameWidth = self.img.width/4
		var frameHeight = self.img.height/4
		var walkingMod =  Math.floor(self.spriteAnimCounter) % 4;
		ctx.drawImage(self.img,
		    walkingMod*frameWidth,directionMod*frameHeight,frameWidth,frameHeight,
			x,y,self.width,self.height
		);
		
		ctx.restore();
	}
	
	
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += 10;
		if(self.pressingLeft)
			self.x -= 10;	
		if(self.pressingDown)
			self.y += 10;	
		if(self.pressingUp)
			self.y -= 10;	
		
		//ispositionvalid
		if(self.x < self.width/2)
			self.x = self.width/2;
		if(self.x > currentMap.width-self.width/2)
			self.x = currentMap.width - self.width/2;
		if(self.y < self.height/2)
			self.y = self.height/2;
		if(self.y > currentMap.height - self.height/2)
			self.y = currentMap.height - self.height/2;
	}
	self.onDeath= function(){
		if(player.hp <= 0){
		var timeSurvived = Date.now() - timeWhenGameStarted;		
		console.log("You lost! You survived for " + timeSurvived + " ms.");		
		startNewGame();
	   }
	}
	self.pressingDown = false;
	self.pressingUp = false;
	self.pressingLeft = false;
	self.pressingRight = false;
	
	self.pressingMouseLeft = false;
	self.pressingMouseRight= false;
	return self;
	
}

 function Actor(type,id,x,y,spdX,spdY,width,height,img,hpMax,atkSpd,spMax){
	var self = Entity(type,id,x,y,spdX,spdY,width,height,img);
	
	self.sp= spMax
	self.spMax=spMax
	self.hp = hpMax;
	self.hpMax= hpMax;
	self.atkSpd = atkSpd;
	self.attackCounter = 0;
	self.aimAngle = 0;
	self.spriteAnimCounter = 0;
	
	var super_update = self.update;
	self.update = function(){
		super_update();
		self.attackCounter += self.atkSpd;
		if(self.hp<= 0)
		   self.onDeath();
	}
	self.onDeath= function(){};
	self.performAttack = function(){
		if(self.attackCounter > 25){	//every 1 sec
			self.attackCounter = 0;
			generateBullet(self);
		}
	}
	
	self.performSpecialAttack = function(){
    var activate= false;
    var energy = false;
       if (self.attackCounter >75){
       	 self.attackCounter = 0;
       	 activate = true;
       }
       if(player.sp >= 10){
       	 energy= true;
       }
		if(activate && energy){ 
			for(var i = 0 ; i < 360; i++){
				generateBullet(self,i);
			}
			generateBullet(self,self.aimAngle - 5);
			generateBullet(self,self.aimAngle);
			generateBullet(self,self.aimAngle + 5);
			player.sp -= 10;
			activate = false;
		}
	  }

	
	return self;
}

function Enemy(id,x,y,spdX,spdY,width,height,img,hpMax,atkSpd,spMax){
	var self = Actor('enemy',id,x,y,spdX,spdY,width,height,img,hpMax,atkSpd,spMax);
	enemyList[id] = self;
	self.toRemove= false;
	var super_update = self.update; 
	self.update = function(){
		super_update();
		self.spriteAnimCounter += 0.2;
		self.updateAim();
	}	
	
	self.updateAim = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		self.aimAngle = Math.atan2(diffY,diffX) / Math.PI * 180
	};
	self.onDeath=function(){
		self.toRemove=true;
	}
	var super_draw = self.draw; 
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		var aimAngle = self.aimAngle;
		  if(aimAngle < 0)
		      aimAngle = 360 + aimAngle;
		var directionMod = 2 // draw right
		if(aimAngle >=45 && aimAngle <135) //down
		    directionMod = 0
		else if(aimAngle >= 135 && aimAngle < 225) //left
		    directionMod = 1
		else if(aimAngle >= 225 && aimAngle <315) //up
		    directionMod = 3
		var frameWidth = self.img.width/4
		var frameHeight = self.img.height/4
		var walkingMod =  Math.floor(self.spriteAnimCounter) % 4;
		ctx.drawImage(self.img,
		    walkingMod*frameWidth,directionMod*frameHeight,frameWidth,frameHeight,
			x,y,self.width,self.height
		);
		var x = self.x - player.x + WIDTH/2 - self.width/2;
		var y = self.y - player.y + HEIGHT/2 - self.height/2 - 20;
        ctx.save();
        ctx.fillStyle = 'red'
        var hp = 100*self.hp/self.hpMax
        if(hp < 0)
           hp = 0
          
        ctx.fillRect(x-20,y,hp,10);
        ctx.strokeStyle='black';
        ctx.strokeRect(x-20,y,100,10);
        ctx.stroke();
        ctx.restore();
	}
	self.updatePosition = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		if(diffX > 0)
			self.x += 3;
		else
			self.x -= 3;
			
		if(diffY > 0)
			self.y += 3;
		else
			self.y -= 3;
	
	};
}
function updateEnemy(){
 	if(frameCount % 100 === 0)	//every 4 sec
		randomlyGenerateEnemy();
 	for(var key in enemyList){
		enemyList[key].update();
		enemyList[key].performAttack();
	}
	for(var key in enemyList){
	   if(enemyList[key].toRemove)	
		   delete enemyList[key]
		   player.sp +=0.03;
	}
	   if(player.sp > player.spMax)
		        player.sp = player.spMax
 }

 function randomlyGenerateEnemy(){
	//Math.random() returns a number between 0 and 1
	var x = Math.random()*currentMap.width;
	var y = Math.random()*currentMap.height;
	var height = 64;	
	var width = 64;
	var id = Math.random();
	var spdX = 5 + Math.random() * 5;
	var spdY = 5 + Math.random() * 5;
	if(Math.random() < 0.5)
	    Enemy(id,x,y,spdX,spdY,width,height,Img.enemy,2,1,0);
	else 
        Enemy(id,x,y,spdX,spdY,width,height,Img.enemy2,3,3,5);
}

function Upgrade (id,x,y,spdX,spdY,width,height,category,img){
	var self = Entity('upgrade',id,x,y,spdX,spdY,width,height,img);
	
	self.category = category;
	upgradeList[id] = self;
}
function updateUpgrade(){
 if(frameCount % 300 === 0)	//every 3 sec
		randomlyGenerateUpgrade();
 	for(var key in upgradeList){
		upgradeList[key].update();
		var isColliding = player.testCollision(upgradeList[key]);
		if(isColliding){
			if(upgradeList[key].category === 'health')
				player.hp += 3;
		    if (player.hp > player.hpMax)
		        player.hp = player.hpMax
			if(upgradeList[key].category === 'atkSpd')
				player.atkSpd += 0.3;
			if(player.atkSpd > 5)
			    player.atkSpd = 5
			delete upgradeList[key];
		}
	}
 }

 function randomlyGenerateUpgrade(){
	//Math.random() returns a number between 0 and 1
	var x = Math.random()*currentMap.width;
	var y = Math.random()*currentMap.height;
	var height = 32;
	var width = 32;
	var id = Math.random();
	var spdX = 0;
	var spdY = 0;
	
	if(Math.random()<0.2){
		var category = 'health';
		var img = Img.upgrade1;
	} else {
		var category = 'atkSpd';
		var img = Img.upgrade2;
	}
	
	Upgrade(id,x,y,spdX,spdY,width,height,category,img);
}

 function  Bullet(id,x,y,spdX,spdY,width,height,combatType){
	var self = Entity('bullet',id,x,y,spdX,spdY,width,height,Img.bullet);
	
	self.timer = 0;
	self.combatType = combatType;
	
	bulletList[id] = self;
}
function updateBullet(){
	for(var key in bulletList){
		var b = bulletList[key];
		b.update();
		
		var toRemove = false;
		b.timer++;
		if(b.timer > 75){
			toRemove = true;
		}
		
		if(b.combatType === 'player'){	//bullet was shot by player
			for(var key2 in enemyList){
				if(b.testCollision(enemyList[key2])){
					toRemove = true;
				 enemyList[key2].hp-=1;
				}				
			}
		} else if(b.combatType === 'enemy'){
			if(b.testCollision(player)){
				toRemove = true;
				player.hp -= 1;
			}
		}	
		
		
		if(toRemove){
			delete bulletList[key];
		}
	}
}
 function generateBullet(actor,aimOverwrite){
	//Math.random() returns a number between 0 and 1
	var x = actor.x;
	var y = actor.y;
	var height = 24;
	var width = 24;
	var id = Math.random();
	
	var angle;
	if(aimOverwrite !== undefined)
		angle = aimOverwrite;
	else angle = actor.aimAngle;
	
	var spdX = Math.cos(angle/180*Math.PI)*5;
	var spdY = Math.sin(angle/180*Math.PI)*5;
	Bullet(id,x,y,spdX,spdY,width,height,actor.type);
}
function startNewGame(){
	player.hp = 1000;
	player.sp= player.spMax
	player.x=0;
	player.y=0;
	player.atkSpd = 1;
	timeWhenGameStarted = Date.now();
	frameCount = 0;
	score = 0;
	enemyList = {};
	upgradeList = {};
	bulletList = {};
	randomlyGenerateEnemy();
	randomlyGenerateEnemy();
	randomlyGenerateEnemy();
	
}
function Maps(id,imgSrc,width,height){
	var self = {
		id:id,
		image:new Image(),
		width:width,
		height:height	
	};
	self.image.src = imgSrc;
	
	
	self.draw = function(){
		var x = WIDTH/2 - player.x;
		var y = HEIGHT/2 - player.y;
		ctx.drawImage(self.image,0,0,self.image.width,self.image.height,x,y,self.image.width*2,self.image.height*2);
	};
	return self;
}


currentMap = Maps('Vein','Img/map.png',1000,1000);



player = Player();
startNewGame();

setInterval(update,40);


