// trainer.js

let coords = {};    // loaded from coords.json
let remaining = [];
let mode = "loading";
let currentNumber = null;
let tolerance = 20; // pixels for click tolerance

// Your list of 38 locations
const locations = [
  "Ida-Euroopa lauskmaa",
  "Suur Hiina tasandik",
  "Kesktasandik",
  "Suur Tasandik (USA)",
  "Kaspia alamik",
  "Surnumere nõgu",
  "Amazonase",
  "Lääne-Siberi",
  "Mississippi",
  "Induse-Gangese",
  "Iraani kiltmaa",
  "Tiibeti kiltmaa",
  "Mehhiko kiltmaa",
  "Dekkani kiltmaa",
  "Kesk-Siberi kiltmaa",
  "Kordiljeerid",
  "Andid",
  "Kaljumäestik",
  "Apalatšid",
  "Draakonimäed",
  "Atlase mäestik",
  "Austraalia alpid",
  "Suur Veelahkmeahelik",
  "Himaalaja",
  "Suur Kaukasus",
  "Uurali mäestik",
  "Karpaadid",
  "Apenniini mäestik",
  "Püreneed",
  "Skandinaavia",
  "Alpid",
  "Tian Shan",
  "Altai",
  "Verhojanski mäestik",
  "Guajaana mägismaa",
  "Etioopia mägismaa",
  "Brasiilia mägismaa",
  "Patagoonia"
];

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

const emptyMap = new Image();
emptyMap.src = "map_empty.png";
const answerMap = new Image();
answerMap.src = "map_answer.png";

function setPrompt(msg) {
  document.getElementById("prompt").textContent = msg;
}

function drawMap(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawMarker(x, y, color = "red", size = 6) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();
}

function resetTraining() {
  remaining = Object.keys(coords).map(n => parseInt(n));
  nextQuestion();
}

function nextQuestion() {
  if (remaining.length === 0) {
    setPrompt("✅ You’ve finished all 38 locations! Click 'Start Again' to retry.");
    return;
  }
  currentNumber = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
  drawMap(emptyMap);
  setPrompt(`Where is: ${locations[currentNumber - 1]}?`);
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (!currentNumber) return;

  if (mode === "training") {
    const [tx, ty] = coords[currentNumber];
    const dx = x - tx;
    const dy = y - ty;
    if (dx * dx + dy * dy <= tolerance * tolerance) {
      drawMarker(tx, ty, "green");
      setTimeout(nextQuestion, 700);
    } else {
      drawMarker(x, y, "red");
      drawMarker(tx, ty, "blue");
      setTimeout(nextQuestion, 1500);
    }
  } else if (mode === "setup") {
    coords[currentNumber] = [x, y];
    if (currentNumber < locations.length) {
      currentNumber++;
      setPrompt(`Register location of: ${locations[currentNumber - 1]}`);
    } else {
      alert("✅ Setup complete! Export coords.json and save it to your repo.");
      exportCoords();
      mode = "training";
      resetTraining();
    }
  } else if (mode === "fix") {
    coords[currentNumber] = [x, y];
    alert(`Fixed position of ${locations[currentNumber - 1]}`);
    exportCoords();
    mode = "training";
    resetTraining();
  }
});

// Export updated coords.json
function exportCoords() {
  const blob = new Blob([JSON.stringify(coords, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coords.json";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("showAnswerBtn").addEventListener("click", () => {
  drawMap(answerMap);
  ctx.strokeStyle = "rgba(255,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, tolerance, 0, 2 * Math.PI);
  ctx.stroke();
});

document.getElementById("fixBtn").addEventListener("click", () => {
  if (!currentNumber) return;
  mode = "fix";
  setPrompt(`Click the correct position for: ${locations[currentNumber - 1]}`);
});

document.getElementById("restartBtn").addEventListener("click", () => {
  resetTraining();
});

// Load coords.json
fetch("coords.json")
  .then(r => r.json())
  .then(data => {
    coords = data;
    if (Object.keys(coords).length > 0) {
      mode = "training";
      resetTraining();
    } else {
      mode = "setup";
      currentNumber = 1;
      drawMap(answerMap);
      setPrompt(`Register location of: ${locations[currentNumber - 1]}`);
    }
  })
  .catch(() => {
    coords = {};
    mode = "setup";
    currentNumber = 1;
    drawMap(answerMap);
    setPrompt(`Register location of: ${locations[currentNumber - 1]}`);
  });
