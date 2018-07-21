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
        if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
            throw new Error('Actor.constructor: все аргументы должны быть объектами Vector');
            // (поправил) лучше чтобы сначала была проверка аргументов,
            // а потом основной код
        } else {
			this.pos = pos;
            this.size = size;
            this.speed = speed;
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
        if (!(actor instanceof Actor) || (!actor)) {
            throw new Error(`Не является экземпляром Actor или не передано аргументов`);
        }
        if (actor === this) {
            return false;
		// (поправил) if заканчивается на return, поэтому else можно не писать
        }
	    // (поправил) здесь можно внести отрицание в скобки
        // для этого нужно заменить || на &&
        // и операторы на противоположные
        // >= на <, <= на >
        return (
            this.right > actor.left &&
            this.left < actor.right &&
            this.top < actor.bottom &&
            this.bottom > actor.top
        );
    }
}

class Level {
    constructor(grid = [], actors = []) {
        // (поправил) можно создать копии массивов,
        // чтобы было сложнее исзменить поля объекта извне
        this.grid = grid.slice();
        this.actors = actors.slice();
        this.height = grid.length;
        // (поправил) проверку можно убрать, если добавить 0 в список аргументов Math.max
        this.width = this.grid.reduce((a, b) => {
            return b.length > a ? b.length : a;
        }, 0);
        this.status = null;
        this.finishDelay = 1;
        this.player = this.actors.find(act => act.type === 'player');
    }
    isFinished() {
        // (поправил) скобки можно опустить
        return this.status !== null && this.finishDelay < 0;
    }


    actorAt(actor) {
        // вторая часть проверки лишняя, т.к.
        // undefined instanceof Actor это false
        // instanceof лучше писать без скобок
        if (!(actor instanceof(Actor)) || (!actor)) {
            throw new Error('Level.actorAt: аргумент должен быть объектом Actor')
        }
        // (поправил) лучше проверить целостность объекта в конструкторе
        // и не проверядть дальше по коду заполненность тех или иных полей
        // (поправил) для поиска объектов в массиве есть специальный метод
        return this.actors.find(act => act.isIntersect(actor));
    }
    obstacleAt(pos, size) {
        if (!(pos instanceof(Vector)) && !(size instanceof(Vector))) {
            throw new Error('Level.obstacleAt: аргументы должны быть объектами Vector')
        }
        // поправил
		const left = Math.floor(pos.x);
        const right = Math.ceil(pos.x + size.x);
        const top = Math.floor(pos.y);
        const bottom = Math.ceil(pos.y + size.y);
        if (left < 0 || right > this.width || top < 0) {
            return 'wall';
        }
        if (bottom > this.height) {
            return 'lava';
        }
        // поправил
        for (let i = top; i < bottom; i++) {
            for (let k = left; k < right; k++) {
                // поправил
                const cross = this.grid[i][k];
                if (cross) {
                    return cross;
                }
            }
        }
        // (поправил) лишняя строчка, функция и так возвращает undefined, если не указано иное
    }
    removeActor(actor) {
        // (поправил) метод реализован некорректно
        // нужно удалять именно переданный объект,
        // не а объект с такими же характеристиками
        this.actors = this.actors.filter(el => el !== actor);
    }
    noMoreActors(type) {
        // (поправил) для проверки наличия объекта в массиве лучше использовать методе some
        return !this.actors.some(el => el.type === type);
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
    // поправил
    constructor(map = {}) {
        this.map = map;
    }
    // поправил 
    actorFromSymbol(symbol) {
        return this.map[symbol];
    }
    // поправил
    obstacleFromSymbol(symbol) {
        switch (symbol) {
            case 'x':
                return 'wall';
            case '!':
                return 'lava';
        }
    }
  createGrid(plan) {
	// поправил
    return plan.map(el => el.split('')).map(el => el.map(el => this.obstacleFromSymbol(el)));
  }
  createActors(plan) {
	// поправил
    return plan.reduce((prev, elem, y) => {
            elem.split('').forEach((count, x) => {
                const func = this.actorFromSymbol(count);
                if (typeof func === 'function') {
                    const actor = new func(new Vector(x, y));
                    if (actor instanceof Actor) {
                        prev.push(actor);
                    }
                }
            });
            return prev;
        }, []);
  }
  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1,1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(t = 1) {
    return this.pos.plus(this.speed.times(t));
  }
  handleObstacle() {
    // поправил
    this.speed = this.speed.times(-1);
  }
  act(t, lvl) {
    // поправил
    const newPosition = this.getNextPosition(t);
        lvl.obstacleAt(newPosition, this.size) ? this.handleObstacle() : this.pos = newPosition;
  }
}

class HorizontalFireball extends Fireball{
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball{
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball{
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.init = pos;
  }
  handleObstacle() {
    this.pos = this.init;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    // (поправил) 2 раза прибавляете к pos одно и то же
	this.initPos = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI * 2;
  }
  get type() {
    return 'coin';
  }
  updateSpring(t = 1) {
    this.spring += this.springSpeed * t;
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  getNextPosition(t = 1) {
    this.updateSpring(t);
    return this.initPos.plus(this.getSpringVector());
  }
  act(t) {
    this.pos = this.getNextPosition(t);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(1,1)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector());
  }
  get type() {
    return 'player';
  }
}

const actors = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
};
const parser = new LevelParser(actors);

loadLevels()
  .then(result => runGame(JSON.parse(result), parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'));