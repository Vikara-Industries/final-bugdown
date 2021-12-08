import kaboom from "kaboom";
const k = kaboom({width:384,height:512})

// load assets
loadSprite("player", "./assets/sprites/player.png")
loadSprite("grass","./assets/sprites/dirt.png")
loadSprite("bean","./assets/sprites/bean.png")

// custom component controlling enemy patrol movement
function patrol(speed = 60, dir = 1) {
	return {
		id: "patrol",
		require: [ "pos", "area", ],
		add() {
			this.on("collide", (obj, col) => {
				if (col.isLeft() || col.isRight()) {
					dir = -dir
				}
			})
		},
		update() {
			this.move(speed * dir, 0)
		},
	}
}


// define some constants

const JUMP_FORCE = 1000
const MOVE_SPEED = 480
const FALL_DEATH = 2400

let LEVELS = [
	[
		"      ",
		"==  ==",
		"      ",
		"  ==  ",
		"      ",
		"==  ==",
		"      ",
		"======",
	]
]

// define what each symbol means in the level graph
const levelConf = {
	// grid size
	width: 64,
	height: 64,
	// define each object as a list of components
	"=": () => [
		sprite("grass"),
		area(),
		solid(),
		origin("bot"),
		"platform"
	],
	">": () => [
		sprite("bean"),
		area(),
		origin("bot"),
		body(),
		patrol(),
		"enemy",
	]
}

scene("game", ({ levelId, coins } = { levelId: 0, coins: 0 }) => {
	
	
	gravity(3200)
	camPos(160, 192)
	let score = 0
	// add level to scene
	let level = addLevel(LEVELS[levelId ?? 0], levelConf)

	 let upScore = k.add([
		z(2),
        text(score),
        pos(10,10),
        scale(1),
        origin("center"),
    ]);
	// define player object
	const player = add([
		sprite("player"),
		pos(0, 0),
		area(),
		scale(0.7),
		// makes it fall to gravity and jumpable
		body(),
		// the custom component we defined above
		origin("bot"),
	])

	// action() runs every frame
	player.onUpdate(() => {
		
		// check fall death
		if (player.pos.y >= FALL_DEATH) {
			go("lose")
		}
	})

	// if player onCollide with any obj with "danger" tag, lose
	player.onCollide("danger", () => {
		go("lose")

	})

	player.onGround((l) => {
		if (l.is("enemy")) {
			player.jump(JUMP_FORCE * 1.5)
			destroy(l)
			addKaboom(player.pos)
		}
	})

	player.onCollide("enemy", (e, col) => {
		// if it's not from the top, die
		if (!col.isBottom()) {
			go("lose")
		
		}
	})

	function randomPlat(len = 6){
		plat=""
		for(let i=0; i< len;i++){
			if(Math.random()<0.5){plat+= " "}
			else{plat+= "="}
		}
		return plat
	}
	
	loop(2, () => {
		score +=1
		let prevLvl = LEVELS[0].slice()
		destroyAll("platform")
		for(let i = 0; i<prevLvl.length-2;i++){
			LEVELS[0][i] = prevLvl[i+2]
		}
		LEVELS[0][6] = "      "
		LEVELS[0][7] = randomPlat()
		level = addLevel(LEVELS[levelId ?? 0], levelConf)
		upScore.text = score
	})

	// jump with space
	onKeyPress("space", () => {
		// these 2 functions are provided by body() component
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
		}
	})

	onKeyDown("left", () => {
		player.move(-MOVE_SPEED, 0)
	})

	onKeyDown("right", () => {
		player.move(MOVE_SPEED, 0)
	})

	onKeyPress("down", () => {
		player.weight = 3
	})

	onKeyRelease("down", () => {
		player.weight = 1
	})

	onKeyPress("f", () => {
		fullscreen(!fullscreen())
	})

})

scene("lose", () => {
	add([
		text("You Lose"),
	])
	onKeyPress(() => go("game"))
})

scene("win", () => {
	add([
		text("You Win"),
	])
	onKeyPress(() => go("game"))
})

go("game")  