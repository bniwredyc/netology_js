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

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        this.height = grid.length;
        this.width = this.height > 0 ? Math.max(...grid.map(el => el.length)) : 0;
        this.status = null;
        this.finishDelay = 1;
        this.player = this.actors.find(actor => actor.type === 'player');
    }
    isFinished() {
        return (this.status !== null && this.finishDelay < 0);
    }


    actorAt(obj) {
        if (!(obj instanceof(Actor)) || obj === undefined) {
            throw new Error('Level.actorAt: аргумент должен быть объектом Actor')
        }
        if (this.actors === undefined) {
            return undefined;
        }
        for (const actor of this.actors) {
            if (actor.isIntersect(obj)) {
                return actor;
            }
        }
        return undefined;
    }
    obstacleAt(destination, size) {
        if (!(destination instanceof(Vector)) || !(size instanceof(Vector))) {
            throw new Error('Level.obstacleAt: аргументы должны быть объектами Vector')
        }
        let actor = new Actor(destination, size);
        if (actor.top < 0 || actor.left < 0 || actor.right > this.width) {
            return 'wall';
        }
        if (actor.bottom > this.height) {
            return 'lava';
        }
        for (let col = Math.floor(actor.top); col < Math.ceil(actor.bottom); col++) {
            for (let row = Math.floor(actor.left); row < Math.ceil(actor.right); row++) {
                if (this.grid[col][row] !== undefined) {
                    return this.grid[col][row];
                }
            }
        }
        return undefined;
    }
    removeActor(actor) {
        this.actors = this.actors.filter(item => item.pos !== actor.pos || item.size !== actor.size || item.speed !== actor.speed);
    }
    noMoreActors(type) {
        if (!(this.actors.find(actor => actor.type === type))) {
            return true;
        }
        return false;
    }
    playerTouched(type, actor) {
        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
        }
        if (type === 'coin' && actor.type === 'coin') {
            this.removeActor(actor);
            if(this.noMoreActors('coin')) {
                this.status = 'won';
            }
        }
    }
}

class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }
  actorFromSymbol(symbol) {
    if (symbol === undefined) {
      return undefined;
    }
    return this.dictionary[symbol] ? this.dictionary[symbol] : undefined;
  }
  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    } else if (symbol === '!') {
      return 'lava';
    } else {
      return undefined;
    }
  }
  createGrid(plan) {
    const result = [];
    for (const row of plan) {
      const newRow = [];
      for (const cell of row) {
        newRow.push(this.obstacleFromSymbol(cell));
      }
      result.push(newRow);
    }
    return result;
  }
  createActors(plan) {
    const result = [];
    if (this.dictionary) {
      plan.forEach((row, y) => {
        row.split('').forEach((cell, x) => {
          if (typeof this.dictionary[cell] === 'function') {
            const pos = new Vector(x, y);
            const actor = new this.dictionary[cell](pos);
            if (actor instanceof Actor) {
              result.push(actor);
            }
          }
        })
      })
    }
    return result;
  }
  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}