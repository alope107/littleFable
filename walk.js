let W;
let H;
const DELAY = 60;
const DENOM = .9;

let gen;
let lines;
let target = 0;
let maxHits = 2;
let bestLen = 0;

let activeTextSpan;
let inactiveTextSpan;

let fableText = `"Alas", said the mouse, "the whole world is growing smaller every day. At the beginning it was so big that I was afraid, I kept running and running, and I was glad when I saw walls far away to the right and left, but these long walls have narrowed so quickly that I am in the last chamber already, and there in the corner stands the trap that I am running into." "You only need to change your direction," said the cat, and ate it up.`;


function validLine(l, lines) {
  const endpoint = l[1];
  if( !(endpoint[0] >= 0 && endpoint[0] < W &&
         endpoint[1] >= 0 && endpoint[1] < H)) {
    return false;
  }
  for(let i = 0; i < lines.length - 1; i++) {
    if(overlaps(l, lines[i].line)) return false;
  }
  return true;
}

// ccw&overlaps adapted from 
// https://stackoverflow.com/questions/3838329/how-can-i-check-if-two-segments-intersect
function ccw(a, b, c) {
  return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]); 
}
function overlaps([a, b], [c, d]) {
  return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);
}

const startP5 = (p) => {
  p.setup = function() {
    let parent = document.getElementById("canvasHolder");
    W = parent.offsetWidth;
    H = parent.offsetHeight;
    let canv = p.createCanvas(W, H);
    canv.parent("canvasHolder");

    resizeCanvas = p.resizeCanvas;

    activeTextSpan = document.getElementById("activeText");
    inactiveTextSpan = document.getElementById("inactiveText");
    p.background(0);
    lines =[];

    LINE_COUNT = 1000;
    BASE_LINE_LENGTH = 6;
    SCALE_DOWN = 1;
    TRIES = 1;
    RANGE = p.PI/6;
    
    angles = [];
    let fails = 1;

    // model = {
    //   line: [[x, y], [x, y]],
    //   hits: h
    // }

    function* genlines() {
      while(true) {
        let lastPoint = null;
        while(lastPoint == null) {
          if(lines.length > 0) {
            lastLine = lines[lines.length -1];
            lastLine.hits++;
            if(lastLine.hits > maxHits) {
              lines.pop();
              continue;
            }
            lastPoint = lastLine.line[1];
            
          } else {
            lastPoint = [W/2, H/2];
            angles = [p.random(2*p.PI)];
          }
        }

        let found = false;
        let lineLength = BASE_LINE_LENGTH;
        for(let t = 0; t < TRIES; t++) {
          let angle = angles[angles.length - 1] + p.random(-RANGE*(fails+1), RANGE*(fails+1));
          let trialPoint = [lastPoint[0] + p.cos(angle)*lineLength, lastPoint[1] + p.sin(angle)*lineLength];
          let trialLine = [lastPoint, trialPoint];
          if(!validLine(trialLine, lines)) {
            lineLength *= SCALE_DOWN;
            continue;
          }
          lines.push({
            line: trialLine,
            hits: 0
          });
          angles.push(angle);
          found=true;
          fails--;
          if(fails < 0) fails = 0;
          break;
        }
        if(!found) {
          fails++;
          for(let f = 0; f < fails; f++) {
            lines.pop(); angles.pop();
          }
        }
        yield;
      }
    }

    gen = genlines();

}

p.draw = function() {
  if(p.millis() < target) return;
  target = p.millis() + DELAY;
  p.background(p.color(0,0,0));
  p.stroke(p.color(255, 255, 255));
  gen.next();

  for(const obj of lines) {
    l = obj.line;
    p.line(l[0][0], l[0][1], l[1][0], l[1][1]);
  }

  let currentLen = Math.floor(lines.length/DENOM);
  bestLen = Math.max(bestLen, currentLen);
  activeTextSpan.innerText = fableText.substring(0, currentLen);
  inactiveTextSpan.innerText = fableText.substring(currentLen, bestLen);
}

p.restart = function() {
  let parent = document.getElementById("canvasHolder");
  W = parent.offsetWidth;
  H = parent.offsetHeight;
  console.log(W, H);
  p.resizeCanvas(W, H);
  lines = [];
  bestLen = 0;
  angles=[];
}
}




const p = new p5(startP5, document.getElementById("canvasHolder"));

const restart = () => p.restart();