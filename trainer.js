// CONFIG
let clickTolerance = 16;

// STATE
let mode = "setup"; // "setup" | "training" | "fix"
let locations = {}; // { num: "Name" }
let coords = {};    // { num: [x, y] }
let remaining = [];
let currentNumber = null;
let score = 0, total = 0;
let fixTarget = null;

// CANVAS
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// UI
const promptEl = document.getElementById("prompt");
const scoreEl = document.getElementById("score");
document.getElementById("tolerance").oninput = e => {
  clickTolerance = +e.target.value;
  if (mode === "showingKey") showAnswerKey();
};

// LOAD IMAGES
const emptyMap = new Image();
emptyMap.src = "empty.png"; // <-- supply in repo
const answerMap = new Image();
answerMap.src = "answer.png"; // <-- supply in repo

// Example locations (replace with parsed file if you want)
locations = {
  1: "Estonia",
  2: "Latvia",
  3: "Lithuania"
};

// INIT once maps load
emptyMap.onload = () => {
  canvas.width = emptyMap.width;
  canvas.height = emptyMap.height;
  init();
};

// INIT FUNCTION
function init() {
  fetch("coords.json")
    .then(r => r.json())
    .then(data => {
      coords = data;
      if (Object.keys(coords).length > 0) {
        mode = "training";
        resetTraining();
      } else {
        setupStart();
      }
    })
    .catch(err => {
      console.warn("coords.json not found, starting setup.", err);
      setupStart();
    });
}

function setupStart() {
  coords = {};
  mode = "setup";
  currentNumber = 1;
  drawMap(answerMap);
  setPrompt(`Register location of: ${locations[currentNumber]}`);
}

// DRAW MAP
function drawMap(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
}

// CLICK HANDLER
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (mode === "fix") {
    coords[fixTarget] = [x, y];
    alert(`Updated position for ${locations[fixTarget]}`);
    mode = "training";
    nextQuestion();
    return;
  }

  if (mode === "setup") {
    coords[currentNumber] = [x, y];
    drawDot(x, y, "green");
    if (currentNumber < Object.keys(locations).length) {
      currentNumber++;
      setPrompt(`Register location of: ${locations[currentNumber]}`);
    } else {
      alert("Setup complete! Export coords.json to save permanently.");
      mode = "training";
      resetTraining();
    }
    return;
  }

  if (mode === "training") {
    if (!remaining.length) {
      alert("Done!");
      return;
    }
    let [cx, cy] = coords[currentNumber];
    total++;
    let dist = Math.hypot(x - cx, y - cy);
    if (dist <= clickTolerance) {
      score++;
      drawDot(x, y, "green");
    } else {
      drawCross(x, y, "red");
      drawDot(cx, cy, "green");
    }
    scoreEl.textContent = `Score: ${score}/${total}`;
    remaining = remaining.filter(n => n !== currentNumber);
    setTimeout(nextQuestion, 300);
  }
});

// DRAW HELPERS
function drawDot(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
function drawCross(x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8);
  ctx.moveTo(x - 8, y + 8); ctx.lineTo(x + 8, y - 8);
  ctx.stroke();
}
function drawToleranceCircle(x, y, r) {
  ctx.strokeStyle = "orange";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

// PROMPTS
function setPrompt(text) {
  promptEl.textContent = text;
}

// TRAINING CONTROL
function resetTraining() {
  drawMap(emptyMap);
  remaining = Object.keys(coords).map(n => +n);
  score = 0; total = 0;
  scoreEl.textContent = `Score: ${score}/${total}`;
  nextQuestion();
}
function nextQuestion() {
  if (!remaining.length) {
    alert("All done!");
    return;
  }
  currentNumber = remaining[Math.floor(Math.random() * remaining.length)];
  drawMap(emptyMap);
  setPrompt(`Click location of: ${locations[currentNumber]}`);
}

// UI BUTTONS
function clearMarkers() { drawMap(mode === "setup" ? answerMap : emptyMap); }
function showAnswerKey() {
  drawMap(emptyMap);
  for (let n in coords) {
    let [x, y] = coords[n];
    drawDot(x, y, "blue");
    drawToleranceCircle(x, y, clickTolerance);
  }
}
function startFixMode() {
  let num = prompt("Enter number of location to fix:");
  if (!num || !locations[num]) return;
  fixTarget = +num;
  mode = "fix";
  alert(`Click new position for ${locations[fixTarget]}`);
}
function startAgain() {
  if (mode !== "training") return;
  resetTraining();
}

// EXPORT
function exportCoords() {
  const blob = new Blob([JSON.stringify(coords, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coords.json";
  a.click();
  URL.revokeObjectURL(url);
}
