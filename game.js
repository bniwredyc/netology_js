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
            // лучше чтобы сначала была проверка аргументов,
            // а потом основной код
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
        // if заканчивается на return, поэтому else можно не писать
        } else {
            // здесь можно внести отрицание в скобки
            // для этого нужно заменить || на &&
            // и операторы на противоположные
            // >= на <, <= на >
            return !(this.right <= actor.left ||
                this.left >= actor.right ||
                this.bottom <= actor.top ||
                this.top >= actor.bottom);
        }
    }
}

class Level {
    constructor(grid = [], actors = []) {
        // можно создать копии массивов,
        // чтобы было сложнее исзменить поля объекта извне
        this.grid = grid;
        this.actors = actors;
        this.height = grid.length;
        // проверку можно убрать, если добавить 0 в список аргументов Math.max
        this.width = this.height > 0 ? Math.max(...grid.map(el => el.length)) : 0;
        this.status = null;
        this.finishDelay = 1;
        this.player = this.actors.find(actor => actor.type === 'player');
    }
    isFinished() {
        // скобки можно опустить
        return (this.status !== null && this.finishDelay < 0);
    }


    actorAt(obj) {
        // вторая часть проверки лишняя, т.к.
        // undefined instanceof Actor это false
        // instanceof лучше писать без скобок
        if (!(obj instanceof(Actor)) || obj === undefined) {
            throw new Error('Level.actorAt: аргумент должен быть объектом Actor')
        }
        // лучше проверить целостность объекта в конструкторе
        // и не проверядть дальше по коду заполненность тех или иных полей
        if (this.actors === undefined) {
            return undefined;
        }

        // для поиска объектов в массиве есть специальный метод
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
        // тут можно не создавать объект,
        // т.к. он используется только для того,
        // чтобы сложить координату с размером
        let actor = new Actor(destination, size);
        if (actor.top < 0 || actor.left < 0 || actor.right > this.width) {
            return 'wall';
        }
        if (actor.bottom > this.height) {
            return 'lava';
        }
        // округлённые значения лучше записать в переменные, чтобы каждый раз не округлять
        for (let col = Math.floor(actor.top); col < Math.ceil(actor.bottom); col++) {
            for (let row = Math.floor(actor.left); row < Math.ceil(actor.right); row++) {
                // this.grid[col][row] лучше записать в переменную, чтобы 2 раза не писать
                // можно убарать сравние с undefined,
                // а написать просто if (obstacle)
                if (this.grid[col][row] !== undefined) {
                    return this.grid[col][row];
                }
            }
        }
        // лишняя строчка, функция и так возвращает undefined, если не указано иное
        return undefined;
    }
    removeActor(actor) {
        // метод реализован некорректно
        // нужно удалять именно переданный объект,
        // не а объект с такими же характеристиками
        this.actors = this.actors.filter(item => item.pos !== actor.pos || item.size !== actor.size || item.speed !== actor.speed);
    }
    noMoreActors(type) {
        // для проверки наличия объекта в массиве лучше использовать методе some
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
  // здесь лучше добваить значение по умолчанию
  constructor(dictionary) {
    // здесь можно создать копию объекта
    this.dictionary = dictionary;
  }
  actorFromSymbol(symbol) {
    // если убрать все проверки в этом методе, то ничего не изменится :)
    if (symbol === undefined) {
      return undefined;
    }
    return this.dictionary[symbol] ? this.dictionary[symbol] : undefined;
  }
  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
      // if заканчивается на return, поэтому else не нужен
    } else if (symbol === '!') {
      return 'lava';
    } else {
      // лишняя строчка
      return undefined;
    }
  }
  createGrid(plan) {
    const result = [];
    // лучше вместо for of использовать методы массивов, или простые циклы
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
    // если добавить значение по-умолчанию в конструкторе,
    // то эту проверку можно будет убрать
    if (this.dictionary) {
      plan.forEach((row, y) => {
        row.split('').forEach((cell, x) => {
          if (typeof this.dictionary[cell] === 'function') {
            const pos = new Vector(x, y);
            // тут нужно использовать метод класса
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

class Fireball extends Actor {
  constructor(pos = new Vector(), speed = new Vector()) {
    super(pos, new Vector(1,1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(t = 1) {
    return this.pos.plus(this.speed.times(t));
  }
  handleObstacle() {
    // метация объекта вектор может привести к трудно находимым ошибкам
    // тут нужно использовать мтеод класса Vector
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }
  act(t, lvl) {
    // значение присваивется переменной один раз,
    // поэтому лучше использовать const
    let nextPosition = this.getNextPosition(t);
    // лучше стараться не начинать вырежение в if с отрицания
    if (!lvl.obstacleAt(nextPosition, this.size)) {
      this.pos = nextPosition;
    } else {
      this.handleObstacle();
    }
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
  constructor(pos = new Vector()) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    // 2 раза прибавляете к pos одно и то же
    this.initPos = pos.plus(new Vector(0.2, 0.1));
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