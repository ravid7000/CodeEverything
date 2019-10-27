class Flare {
    constructor(x, y, color) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(2, 10))
        this.acc = createVector(0, 0);
        this.color = color;
        this.lifespan = 200;
    }

    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        this.vel.mult(0.95);
        this.vel.add(this.acc);
        this.pos.add(this.vel)
        this.acc.mult(0);
        this.lifespan -= 5;
    }

    show() {
        const { x, y } = this.pos;
        stroke(this.color, 100, 100, this.lifespan / 200);
        strokeWeight(4);
        point(x, y);
    }
}


class Particle {
    constructor(x, y, color) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, random(-15, -8));
        this.acc = createVector(0, 0);
        this.color = color;
    }

    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel)
        this.acc.mult(0);
    }

    show() {
        const { x, y } = this.pos;
        stroke(360, 0, 100);
        strokeWeight(4);
        point(x, y);
    }
}

class Firework {
    constructor() {
        this.color = random(360);
        this.firework = new Particle(random(width), height, this.color);
        this.particles = []
        this.isExploded = false;
    }

    finished() {
        return this.particles.length === 0 && this.isExploded;
    }

    explode() {
        const { x, y } = this.firework.pos;
        const len = floor(random(10, 50))
        for (let i = 0; i < len; i++) {
            this.particles.push(
                new Flare(x, y, this.color)
            )
        }
        this.isExploded = true;
    }

    update() {
        if(!this.isExploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            if (this.firework.vel.y >= 0) {
                this.explode();
            }
        }
        for(let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].lifespan < 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    show() {
        if(!this.isExploded) {
            this.firework.show();
        }

        for(let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].show();
        }
    }
}