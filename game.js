'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Vector.plus: Прибавляемый вектор должен быть объектом Vector');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    times(n) {
        return new Vector(this.x * n, this.y * n);
    }
}

class Actor {
    constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
        if (pos instanceof Vector && size instanceof Vector && speed instanceof Vector) {
            this.pos = pos;
            this.size = size;
            this.speed = speed;
        } else {
            throw new Error('Actor.constructor: все аргументы должны быть объектами Vector');
        }

    }

    get left() {
        return this.pos.x;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get top() {
        return this.pos.y;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return 'actor';
    }

    act() {
    }

    isIntersect(actor) {
        if (!(actor instanceof (Actor)) || actor === undefined) {
            throw new Error('Actor.isIntersect: аргумент должен быть объектом Actor')
        } else if (actor === this) {
            return false;
        } else {
			return !(this.right <= actor.left ||
            this.left >= actor.right ||
            this.bottom <= actor.top ||
            this.top >= actor.bottom);
		}
    }
}