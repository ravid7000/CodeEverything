let r = 100
let p;
let gravity;
let fireworks = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    gravity = createVector(0, 0.2);
    colorMode(HSB);
    background(0)
}

function draw() {
    background(0, 0.25)
    if (random(1) < 0.1) {
        fireworks.push(new Firework());
    }
    for(let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        if (fireworks[i].finished()) {
            fireworks.splice(i, 1);
        }
    }
    // textMode(CENTER);
    textAlign(CENTER, CENTER)
    fill(360, 0, 100)
    stroke(0)
    textSize(20)
    text('WISHING YOU', width/2, height/2 - 30)
    textSize(width/10)
    text('HAPPY DIWALI', width/2, height/2)
    fill(360, 0, 40)
    textSize(15)
    text('RD', width/2, height - 20)
}