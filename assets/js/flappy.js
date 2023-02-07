function createElementWithClass(tag, className) {
  const element = document.createElement(tag);
  element.classList.add(className);
  return element;
}

function createElementWithId(tag, id) {
  const element = document.createElement(tag);
  element.setAttribute("id", id);
  return element;
}

class Barrier {
  constructor(reverse = false) {
    (this.element = createElementWithClass("div", "barrier")),
      (this.border = createElementWithClass("div", "border")),
      (this.body = createElementWithClass("div", "body"));
    this.element.appendChild(reverse ? this.border : this.body);
    this.element.appendChild(reverse ? this.body : this.border);
  }
}

Barrier.prototype.setHeight = function (height) {
  this.body.style.height = `${height}px`;
};

class BarrierPair {
  constructor(gap, x) {
    (this.element = createElementWithId("div", "barriers-pair")),
      (this.top = new Barrier());
    this.bottom = new Barrier(true);
    Object.defineProperty(this, "x", {
      get() {
        return +this.element.style.left.split("px")[0];
      },
      set(pos) {
        this.element.style.left = `${pos}px`;
      },
    });
    this.x = x;
    this.height = gameArea().height;
    this.gap = gap;
    this.element.appendChild(this.top.element);
    this.element.appendChild(this.bottom.element);
    this.sortGap();
  }
}

BarrierPair.prototype.sortGap = function () {
  const topHeight = Math.random() * (this.height - this.gap);
  const bottomHeight = this.height - this.gap - topHeight;
  this.top.setHeight(topHeight);
  this.bottom.setHeight(bottomHeight);
};

class BarriersSet {
  constructor(gap, space, upScore) {
    const gameWidth = gameArea().width;
    this.pairs = [
      new BarrierPair(gap, gameWidth),
      new BarrierPair(gap, gameWidth + space),
      new BarrierPair(gap, gameWidth + space * 2),
      new BarrierPair(gap, gameWidth + space * 3),
    ];
    this.space = space;
    this.upScore = upScore;
  }
}

BarriersSet.prototype.animate = function () {
  const offsetPxRenderingPerSecond = 2.5;
  this.pairs.forEach((pair) => {
    pair.x = pair.x - offsetPxRenderingPerSecond;
    pair.width = +window.getComputedStyle(pair.element).width.replace("px", "");
    console.log(pair.width);
    if (pair.x + pair.width < 0) {
      pair.sortGap();
      pair.x = this.space * this.pairs.length - pair.width;
      console.log(this.x);
    }
    const middle = gameArea().width / 2;
    if (pair.x + offsetPxRenderingPerSecond >= middle && pair.x < middle) {
      this.upScore(1);
    }
  });
};

class Bird {
  constructor() {
    this.element = createElementWithId("img", "bird");
    this.element.setAttribute("src", "./assets/img/bird.gif");
    Object.defineProperty(this, "y", {
      get() {
        return +this.element.style.bottom.split("px")[0];
      },
      set(y) {
        this.element.style.bottom = `${y}px`;
      },
    });
    this.flying = false;
    this.maxHeight = gameArea().height - 50;
    this.y = this.maxHeight / 2;
    window.onkeydown = (e) => (this.flying = true);
    window.onkeyup = (e) => (this.flying = false);
  }
}

Bird.prototype.animate = function () {
  const newY = this.y + (this.flying ? 8 : -5);
  if (newY < 0) {
    this.y = 0;
  } else if (newY >= this.maxHeight) {
    this.y = this.maxHeight - this.element.style.height;
  } else {
    this.y = newY;
  }
};

class Progress {
  constructor() {
    this.points = 0;
    this.element = createElementWithId("div", "progress");
    this.element.style.zIndex = 1;
    this.updateProgress(0);
  }
  updateProgress(point) {
    this.points += point;
    this.element.textContent = this.points;
  }
}

class FlappyBird {
  constructor() {
    this.highScore = new Progress();
    this.gameArea = gameArea();
    this.loop = null;
    this.menu();
  }

  menu() {
    const hero = createElementWithId("img", "hero");
    hero.setAttribute("src", "./assets/img/hero.svg");
    gameArea().game.appendChild(hero);
    const play = createElementWithId("button", "play");
    play.textContent = "Play";
    play.addEventListener("click", (e) => {
      gameArea().game.removeChild(play);
      gameArea().game.removeChild(hero);
      this.play();
    });
    gameArea().game.appendChild(play);
  }
  play() {
    this.score = new Progress();
    this.bird = new Bird();
    this.barriers = new BarriersSet(
      200,
      400,
      this.score.updateProgress.bind(this.score)
    );
    this.insertElements();
    this.loop = setInterval(() => {
      this.bird.animate();
      this.barriers.animate();
      if (this.checkColision()) {
        this.stop();
      }
    }, 20);
  }

  stop() {
    clearInterval(this.loop);
  }

  restart() {
    if (this.score.points > this.highScore.points) {
      this.highScore.points = 0;
      this.highScore.updateProgress(this.score.points);
    }
    this.stop();
    this.removeElements();
    this.play();
  }

  colisionChecker(first, second) {
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    const horizontal =
      a.left + a.width - 10 >= b.left && b.left + b.width >= a.left;
    const vertical = a.top + a.height - 1 >= b.top && b.top + b.height >= a.top;
    return horizontal && vertical;
  }

  checkColision() {
    let colision = false;
    this.barriers.pairs.forEach((pair) => {
      if (!colision) {
        const superior = pair.top.element;
        const inferior = pair.bottom.element;
        colision =
          this.colisionChecker(this.bird.element, inferior) ||
          this.colisionChecker(this.bird.element, superior);
      }
    });
    return colision;
  }

  removeElements() {
    this.gameArea.game.removeChild(this.bird.element);
    this.gameArea.game.removeChild(this.score.element);
    this.gameArea.game.removeChild(this.restartBtn);
    this.gameArea.game.removeChild(this.highScoreElement);
    this.barriers.pairs.forEach((pair) =>
      this.gameArea.game.removeChild(pair.element)
    );
  }

  insertElements() {
    this.highScoreElement = createElementWithId("div", "highscore");
    this.highScoreElement.textContent = `H:${this.highScore.points}`;
    gameArea().game.appendChild(this.highScoreElement);
    this.gameArea.game.appendChild(this.bird.element);
    this.barriers.pairs.forEach((pair) =>
      this.gameArea.game.appendChild(pair.element)
    );
    this.gameArea.game.appendChild(this.score.element);
    this.restartBtn = createElementWithClass("button", "restart");
    this.restartBtn.textContent = "↺";
    this.restartBtn.addEventListener("click", this.restart.bind(this));
    this.gameArea.game.appendChild(this.restartBtn);
  }
}

const game = new FlappyBird();

function gameArea() {
  const game = document.querySelector("[game]");
  return {
    game: game,
    height: +window.getComputedStyle(game).height.replace("px", ""),
    width: +window.getComputedStyle(game).width.replace("px", ""),
  };
}
