import { useState, useEffect, useRef } from 'react';
import {
  Bodies, Body, Composite, Engine, Events, Render, Runner, World,
} from 'matter-js';
import catImage from './static/cat.png';
import cloudImage from './static/cloud.png';
import _ from 'lodash';
import './App.css';

function App() {
  const scene = useRef(null);
  const engine = useRef(Engine.create());
  const player = useRef(Body.create({}));
  const [isStart, setIsStart] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [score, setScore] = useState(0)

  useEffect(() => {
    // mount
    const cw = document.body.clientWidth;
    const ch = document.body.clientHeight / 2;

    const e = engine.current;

    let elem: HTMLElement = document.body;
    if (scene.current) {
      elem = scene.current;
    } else {
      return () => { };
    }
    const render = Render.create({
      element: elem,
      engine: e,
      options: {
        width: cw,
        height: ch,
        background: cloudImage,
        wireframes: false,
      }
    });

    // boundaries
    Composite.add(e.world, [
      // top
      Bodies.rectangle(cw / 2, 10, cw, 20, {
        isStatic: true,
        render: {
          fillStyle: 'black'
        }
      }),
      // left
      Bodies.rectangle(-50, ch / 2, 5, ch, {
        isStatic: true,
        render: {
          fillStyle: 'black'
        }
      }),
      // buttom
      Bodies.rectangle(cw / 2, ch - 10, cw * 2, 20, {
        isStatic: true,
        render: {
          fillStyle: 'black'
        }
      })
    ]);
    player.current = Bodies.rectangle(
      cw / 2,
      ch / 2,
      10,
      20,
      {
        render: {
          fillStyle: 'white',
          sprite: {
            texture: catImage,
            xScale: 0.05,
            yScale: 0.05,
          }
        },
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
      }
    );


    Render.run(render);

    Composite.add(e.world, [player.current as Body]);

    const obstacles: Array<Body> = [];
    const map: Array<number> = [ch - 25, ch - 25, ch / 3, ch / 2, ch / 1.5];

    const gameloop = setInterval(() => {
      const index: number = Math.floor(Math.random() * map.length);
      const box = Bodies.rectangle(
        cw + 100,
        map[index]
        , 100, 20, {
        isStatic: true,
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
      });
      obstacles.push(box);
      Body.setVelocity(box, { x: -100, y: 0 });
      Composite.add(e.world, [box])

      Body.setVelocity(player.current, { x: player.current.velocity.x / 10, y: player.current.velocity.y })
      if (player.current.position.x < 0) {
        setIsStart(false);
        setIsDead(true);
      }
      if (player.current.position.x < ch / 2) {
        Body.setVelocity(player.current, { x: 1, y: 0 });
      }
    }, 700);

    if (!isStart) {
      clearInterval(gameloop);
    }

    Events.on(e, 'beforeUpdate', () => {
      for (let i of obstacles) {
        if (i.position.x < -50) {
          Composite.remove(e.world, i);
        } else {
          Body.setVelocity(i, { x: -1, y: 0 })
          Body.setPosition(i, { x: i.position.x - 1, y: i.position.y });
        }
      }
      while (obstacles.length > 0 && obstacles[0].position.x < -50) {
        obstacles.splice(0, 1);
      }
      Body.setAngularVelocity(player.current, 0);
    });

    // unmount
    return () => {
      // destroy Matter
      Render.stop(render);
      Engine.clear(e);
      World.clear(e.world, false);
      Composite.clear(e.world, false);
      render.canvas.remove();
      render.textures = {};
      clearInterval(gameloop);
    }
  }, [isStart]);

  useEffect(() => {
    let id: any;
    if (isStart) {
      id = setInterval(() => {
        setScore(score => { return score + 1 });
      }, 1000);
    }

    return () => { clearInterval(id) }
  }, [isStart])

  const wait = 500;
  const handleTinyDown = _.throttle((e: { clientX: number; clientY: number; }) => {
    const p = player.current;
    Body.applyForce(p, { x: p.position.x, y: p.position.y }, { x: 0, y: -0.006 });
  }, wait)

  const handleStrongDown = _.throttle((e: { clientX: number; clientY: number; }) => {
    const p = player.current;
    Body.applyForce(p, { x: p.position.x, y: p.position.y }, { x: 0, y: -0.008 });
  }, wait)

  return (
    <div className="App">
      <div className="score">{score}</div>
      <div
        className="playground"
        ref={scene}
      />
      <div
        className="control"
      >
        {isStart ?
          <>
            <div
              className="btn"
              onMouseDown={handleTinyDown}
            >Jump</div>
            <div
              className="btn"
              onMouseDown={handleStrongDown}
            >Jump Jump</div>
          </>
          :
          <>
            {isDead ?
              <div className="deadLogo">You Dead</div>
              :
              <div className="btn"
                onClick={() => {
                  // run the engine
                  Runner.run(engine.current);

                  setIsStart(true);
                }}
              >Start</div>}
          </>}
      </div>
    </div >
  );
}

export default App;
