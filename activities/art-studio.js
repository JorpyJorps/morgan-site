const canvas = document.querySelector("#art-canvas");
const context = canvas.getContext("2d");
const toolButtons = document.querySelectorAll("[data-tool]");
const brushStyleButtons = document.querySelectorAll("[data-brush-style]");
const colorButtons = document.querySelectorAll("[data-color]");
const sizeButtons = document.querySelectorAll("[data-size]");
const backdropButtons = document.querySelectorAll("[data-backdrop]");
const clearButton = document.querySelector("#art-clear-button");
const saveButton = document.querySelector("#art-save-button");
const undoButton = document.querySelector("#art-undo-button");
const colorsGroup = document.querySelector("#art-colors-group");
const stampsGroup = document.querySelector("#art-stamps-group");
const stampRow = document.querySelector("#art-stamp-row");
const backdropImages = [];
const sillyStamps = ["👀", "👄", "👃", "🦊", "👓", "👑", "🎀", "🪽", "🦷", "💫"];

const rainbowColors = ["#ff67b2", "#ffad4d", "#ffd861", "#74d97e", "#56c8ff", "#a76cff"];
const backdrops = [
  {
    name: "Fairy Forest",
    skyTop: "#8ed6ff",
    skyBottom: "#f4f8ff",
    groundTop: "#d6f2a7",
    groundBottom: "#83d86c",
    pond: true,
    imagePath: "/assets/art-backgrounds/fairy-forest.png",
    stamps: ["🧚", "🍄", "🌸", "🌿", "✨", ...sillyStamps],
  },
  {
    name: "Unicorn Meadow",
    skyTop: "#b7d9ff",
    skyBottom: "#faf4ff",
    groundTop: "#e7f0b6",
    groundBottom: "#97d57d",
    pond: false,
    imagePath: "/assets/art-backgrounds/unicorn-meadow.png",
    stamps: ["🦄", "🌈", "⭐", "☁️", "💖", ...sillyStamps],
  },
  {
    name: "Bunny Garden",
    skyTop: "#97dcff",
    skyBottom: "#f8fcff",
    groundTop: "#dff0b3",
    groundBottom: "#7ccf74",
    pond: false,
    imagePath: "/assets/art-backgrounds/bunny-garden.png",
    stamps: ["🐰", "🥕", "🌷", "🌼", "🦋", ...sillyStamps],
  },
  {
    name: "Butterfly Studio",
    skyTop: "#ffd8ef",
    skyBottom: "#fff9fc",
    groundTop: "#f7e1a8",
    groundBottom: "#f5b5d8",
    pond: false,
    imagePath: "/assets/art-backgrounds/butterfly-studio.png",
    stamps: ["🦋", "🎀", "🌸", "💖", "✨", ...sillyStamps],
  },
  {
    name: "Sweet Shop",
    skyTop: "#ffd49f",
    skyBottom: "#fff5e7",
    groundTop: "#ffe2f0",
    groundBottom: "#ffc1d7",
    pond: false,
    imagePath: "/assets/art-backgrounds/sweets-shoppe.png",
    stamps: ["🍩", "🧁", "🍭", "🍓", "🍦", ...sillyStamps],
  },
  {
    name: "Soccer Field",
    skyTop: "#8fd5ff",
    skyBottom: "#f3fbff",
    groundTop: "#93d976",
    groundBottom: "#4db660",
    pond: false,
    imagePath: "/assets/art-backgrounds/soccer.png",
    stamps: ["⚽", "🏆", "⭐", "💃", "☁️", ...sillyStamps],
  },
];

let currentTool = "paint";
let currentBrushStyle = "pencil";
let currentColor = "#ff67b2";
let currentSize = 22;
let currentStamp = "🦄";
let drawing = false;
let lastPoint = null;
let rainbowIndex = 0;
let currentBackdropIndex = 0;
let shapeStartPoint = null;
let shapeSnapshot = null;
let historyStack = [];
const maxHistorySteps = 30;

function isRainbowStroke() {
  return currentTool === "rainbow" || currentColor === "rainbow";
}

function setActive(nodes, value, key) {
  nodes.forEach((node) => {
    node.classList.toggle("is-active", node.dataset[key] === value);
  });
}

function syncToolVisualState() {
  toolButtons.forEach((button) => {
    const isBrushButton = Boolean(button.dataset.brushStyle);
    const isRainbowButton = button.dataset.tool === "rainbow";
    const isShapeButton = ["line", "circle", "square", "triangle"].includes(button.dataset.tool);

    let isActive = false;

    if (isBrushButton) {
      isActive = currentTool === "paint" && button.dataset.brushStyle === currentBrushStyle;
    } else if (isRainbowButton) {
      isActive = currentTool === "rainbow";
    } else if (isShapeButton) {
      isActive = currentTool === button.dataset.tool;
    }

    button.classList.toggle("is-active", isActive);
  });
}

function drawBackdrop() {
  const backdrop = backdrops[currentBackdropIndex];
  const image = backdropImages[currentBackdropIndex];

  if (image?.complete && image.naturalWidth > 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return;
  }

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, backdrop.skyTop);
  gradient.addColorStop(0.55, backdrop.skyBottom);
  gradient.addColorStop(0.56, backdrop.groundTop);
  gradient.addColorStop(1, backdrop.groundBottom);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.92)";
  drawCloud(130, 110, 92);
  drawCloud(760, 120, 74);

  context.fillStyle = "rgba(255,238,155,0.95)";
  context.beginPath();
  context.arc(800, 90, 38, 0, Math.PI * 2);
  context.fill();

  if (backdrop.pond) {
    context.fillStyle = "rgba(110,208,255,0.72)";
    context.beginPath();
    context.ellipse(670, 460, 170, 58, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgba(120,196,96,0.95)";
  for (let index = 0; index < 7; index += 1) {
    context.beginPath();
    context.arc(70 + index * 150, 370 + (index % 2) * 18, 85, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = "rgba(255,255,255,0.5)";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(100, 460);
  context.quadraticCurveTo(330, 390, 560, 430);
  context.quadraticCurveTo(740, 470, 910, 420);
  context.stroke();

  drawSceneDetails(backdrop);
}

function saveHistorySnapshot() {
  try {
    historyStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (historyStack.length > maxHistorySteps) {
      historyStack.shift();
    }
  } catch (error) {
    // Ignore history capture failures so drawing still works.
  }
}

function clearHistory() {
  historyStack = [];
}

function undoLastAction() {
  const previous = historyStack.pop();
  if (!previous) {
    return;
  }

  context.putImageData(previous, 0, 0);
}

function drawCloud(x, y, size) {
  context.beginPath();
  context.arc(x, y, size * 0.3, 0, Math.PI * 2);
  context.arc(x + size * 0.28, y - size * 0.12, size * 0.36, 0, Math.PI * 2);
  context.arc(x + size * 0.58, y, size * 0.28, 0, Math.PI * 2);
  context.fill();
}

function drawSceneDetails(backdrop) {
  if (backdrop.name === "Fairy Forest") {
    drawMushroom(118, 480, "#ff7bb4");
    drawMushroom(208, 430, "#c387ff");
    drawFlower(352, 482, "#ff8fc3");
    drawFlower(430, 452, "#fff0a8");
    drawSparkles(530, 414);
    drawLeafCluster(820, 432);
    return;
  }

  if (backdrop.name === "Unicorn Meadow") {
    drawMiniRainbow(180, 162);
    drawStarBurst(320, 120, "#fff2a8");
    drawStarBurst(760, 146, "#fff6cf");
    drawFlower(260, 480, "#ff8fc3");
    drawFlower(720, 470, "#d39bff");
    return;
  }

  if (backdrop.name === "Bunny Garden") {
    drawFence(130, 430, 180);
    drawCarrotPatch(760, 450);
    drawFlower(320, 488, "#ff95c8");
    drawFlower(420, 470, "#ffe28a");
    drawFlower(520, 488, "#ff95c8");
    return;
  }

  if (backdrop.name === "Butterfly Studio") {
    drawPaintBlob(170, 440, "#ff9fcb");
    drawPaintBlob(270, 470, "#8fd5ff");
    drawPaintBlob(780, 440, "#ffd56b");
    drawBowShape(665, 165, "#ff84b8");
    drawSparkles(530, 200);
    return;
  }

  if (backdrop.name === "Sweet Shop") {
    drawCandyStripe(150, 414, "#ff8fc3", "#ffffff");
    drawCandyStripe(790, 414, "#8fd5ff", "#ffffff");
    drawJarShape(250, 450, "#ffd5ea");
    drawJarShape(690, 450, "#ffe9a6");
    drawFrostingHill(500, 482, "#fff4fb");
    return;
  }

  if (backdrop.name === "Soccer Field") {
    drawGoal(760, 398);
    drawFieldStripe();
    drawPennants(180, 150);
    drawPennants(620, 145);
  }
}

function drawMushroom(x, y, capColor) {
  context.fillStyle = "#fff4d9";
  context.fillRect(x - 8, y - 20, 16, 34);
  context.fillStyle = capColor;
  context.beginPath();
  context.arc(x, y - 22, 26, Math.PI, 0);
  context.fill();
}

function drawFlower(x, y, color) {
  context.fillStyle = "#74b95d";
  context.fillRect(x - 2, y - 34, 4, 38);
  context.fillStyle = color;
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5;
    context.beginPath();
    context.arc(x + Math.cos(angle) * 10, y - 10 + Math.sin(angle) * 10, 8, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#ffe577";
  context.beginPath();
  context.arc(x, y - 10, 7, 0, Math.PI * 2);
  context.fill();
}

function drawSparkles(x, y) {
  context.strokeStyle = "rgba(255,255,255,0.95)";
  context.lineWidth = 3;
  for (let index = 0; index < 3; index += 1) {
    const offsetX = index * 18;
    context.beginPath();
    context.moveTo(x + offsetX, y - 8);
    context.lineTo(x + offsetX, y + 8);
    context.moveTo(x + offsetX - 8, y);
    context.lineTo(x + offsetX + 8, y);
    context.stroke();
  }
}

function drawLeafCluster(x, y) {
  context.fillStyle = "#64b761";
  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.ellipse(x + index * 18, y + (index % 2) * 10, 16, 10, index * 0.4, 0, Math.PI * 2);
    context.fill();
  }
}

function drawMiniRainbow(x, y) {
  ["#ff7fb2", "#ffb252", "#ffe16f", "#7cd97f", "#67c9ff", "#b085ff"].forEach((color, index) => {
    context.strokeStyle = color;
    context.lineWidth = 8;
    context.beginPath();
    context.arc(x, y, 36 - index * 5, Math.PI, Math.PI * 2);
    context.stroke();
  });
}

function drawStarBurst(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y - 16);
  context.lineTo(x + 6, y - 4);
  context.lineTo(x + 18, y - 2);
  context.lineTo(x + 8, y + 6);
  context.lineTo(x + 12, y + 18);
  context.lineTo(x, y + 10);
  context.lineTo(x - 12, y + 18);
  context.lineTo(x - 8, y + 6);
  context.lineTo(x - 18, y - 2);
  context.lineTo(x - 6, y - 4);
  context.closePath();
  context.fill();
}

function drawFence(x, y, width) {
  context.fillStyle = "#f8efe3";
  for (let index = 0; index < 5; index += 1) {
    context.fillRect(x + index * 34, y - 38, 12, 44);
  }
  context.fillRect(x - 10, y - 22, width, 10);
  context.fillRect(x - 10, y - 2, width, 10);
}

function drawCarrotPatch(x, y) {
  for (let index = 0; index < 3; index += 1) {
    const offset = index * 28;
    context.fillStyle = "#62b55e";
    context.beginPath();
    context.moveTo(x + offset, y - 32);
    context.lineTo(x + offset - 8, y - 12);
    context.lineTo(x + offset + 8, y - 12);
    context.closePath();
    context.fill();
    context.fillStyle = "#ff9e4d";
    context.beginPath();
    context.moveTo(x + offset, y - 8);
    context.lineTo(x + offset - 8, y + 18);
    context.lineTo(x + offset + 8, y + 18);
    context.closePath();
    context.fill();
  }
}

function drawPaintBlob(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, 30, 0, Math.PI * 2);
  context.arc(x + 26, y + 8, 16, 0, Math.PI * 2);
  context.arc(x - 22, y + 10, 14, 0, Math.PI * 2);
  context.fill();
}

function drawBowShape(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x - 18, y, 18, 12, -0.3, 0, Math.PI * 2);
  context.ellipse(x + 18, y, 18, 12, 0.3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffd2e8";
  context.beginPath();
  context.arc(x, y, 8, 0, Math.PI * 2);
  context.fill();
}

function drawCandyStripe(x, y, stripeA, stripeB) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.3);
  context.fillStyle = stripeA;
  context.fillRect(-20, -46, 40, 92);
  context.fillStyle = stripeB;
  for (let index = -2; index < 3; index += 1) {
    context.fillRect(-18 + index * 12, -46, 6, 92);
  }
  context.restore();
}

function drawJarShape(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x - 26, y - 34, 52, 62, 16);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.fillRect(x - 18, y - 42, 36, 12);
}

function drawFrostingHill(x, y, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x - 24, y, 28, Math.PI, 0);
  context.arc(x + 4, y - 10, 34, Math.PI, 0);
  context.arc(x + 34, y, 28, Math.PI, 0);
  context.fill();
}

function drawGoal(x, y) {
  context.strokeStyle = "rgba(255,255,255,0.95)";
  context.lineWidth = 6;
  context.strokeRect(x - 80, y - 70, 120, 74);
  for (let index = 1; index < 4; index += 1) {
    context.beginPath();
    context.moveTo(x - 80 + index * 30, y - 70);
    context.lineTo(x - 80 + index * 30, y + 4);
    context.stroke();
  }
}

function drawFieldStripe() {
  context.strokeStyle = "rgba(255,255,255,0.7)";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(120, 500);
  context.lineTo(840, 500);
  context.stroke();
}

function drawPennants(x, y) {
  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 140, y + 8);
  context.stroke();
  ["#ff8cbf", "#ffd665", "#7fd985", "#67c8ff"].forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x + index * 34, y + 3);
    context.lineTo(x + index * 34 + 20, y + 6);
    context.lineTo(x + index * 34 + 8, y + 24);
    context.closePath();
    context.fill();
  });
}

function preloadBackdropImages() {
  backdrops.forEach((backdrop, index) => {
    const image = new Image();
    image.src = backdrop.imagePath;
    image.addEventListener("load", () => {
      if (index === currentBackdropIndex) {
        drawBackdrop();
      }
    });
    backdropImages[index] = image;
  });
}

function renderStampButtons() {
  const backdrop = backdrops[currentBackdropIndex];
  const specialStamps = sillyStamps;
  const stamps = [
    ...backdrop.stamps.filter((stamp) => !specialStamps.includes(stamp)),
    ...specialStamps.filter((stamp) => backdrop.stamps.includes(stamp)),
  ];
  stampRow.innerHTML = "";

  stamps.forEach((stamp, index) => {
    const button = document.createElement("button");
    button.className = index === 0 ? "art-stamp is-active" : "art-stamp";
    button.type = "button";
    button.dataset.stamp = stamp;
    button.textContent = stamp;
    button.addEventListener("click", () => {
      currentStamp = stamp;
      currentTool = "stamp";
      syncToolVisualState();
      colorsGroup.hidden = true;
      stampsGroup.hidden = false;
      stampRow.querySelectorAll(".art-stamp").forEach((node) => {
        node.classList.toggle("is-active", node.dataset.stamp === stamp);
      });
    });
    stampRow.append(button);
  });

  currentStamp = stamps[0];
}

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function applyBrushStyle() {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = 0;
  context.globalAlpha = 1;

  if (currentBrushStyle === "pencil") {
    context.lineWidth = Math.max(2, currentSize * 0.55);
    context.globalAlpha = 0.95;
    return;
  }

  if (currentBrushStyle === "marker") {
    context.lineWidth = Math.max(4, currentSize * 0.95);
    context.globalAlpha = 0.78;
    return;
  }

  if (currentBrushStyle === "spray") {
    context.lineWidth = Math.max(2, currentSize * 0.35);
    context.globalAlpha = 0.5;
    return;
  }

  if (currentBrushStyle === "glitter") {
    context.lineWidth = Math.max(4, currentSize * 0.6);
    context.globalAlpha = 0.7;
    context.shadowBlur = 6;
    context.shadowColor = "#fff7b8";
    return;
  }

  context.lineWidth = Math.max(6, currentSize * 1.15);
  context.globalAlpha = 0.72;
  context.shadowBlur = 4;
  context.shadowColor = isRainbowStroke() ? rainbowColors[rainbowIndex % rainbowColors.length] : currentColor;
}

function drawSpray(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(6, Math.floor(distance / 5));
  const radius = Math.max(6, currentSize * 0.9);

  context.save();
  context.fillStyle = isRainbowStroke() ? rainbowColors[rainbowIndex % rainbowColors.length] : currentColor;
  context.globalAlpha = 0.18;

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;

    for (let dot = 0; dot < 7; dot += 1) {
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * radius;
      context.beginPath();
      context.arc(x + Math.cos(angle) * spread, y + Math.sin(angle) * spread, Math.max(1, currentSize * 0.12), 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

function drawGlitter(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(3, Math.floor(distance / 24));
  const sparkleColor = isRainbowStroke() ? rainbowColors[rainbowIndex % rainbowColors.length] : currentColor;

  context.save();
  context.fillStyle = sparkleColor;
  context.globalAlpha = 0.9;
  context.font = `${Math.max(12, currentSize)}px serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const x = from.x + (to.x - from.x) * progress + (Math.random() - 0.5) * 10;
    const y = from.y + (to.y - from.y) * progress + (Math.random() - 0.5) * 10;
    const glitterShape = ["✦", "✨", "◆", "❖"][index % 4];
    context.fillText(glitterShape, x, y);
  }

  context.restore();
}

function strokeLineBasic(from, to) {
  applyBrushStyle();
  context.strokeStyle = isRainbowStroke() ? rainbowColors[rainbowIndex % rainbowColors.length] : currentColor;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function strokeLine(from, to) {
  if (currentBrushStyle === "spray") {
    drawSpray(from, to);
  } else if (currentBrushStyle === "glitter") {
    drawGlitter(from, to);
  } else {
    strokeLineBasic(from, to);
  }

  if (isRainbowStroke()) {
    rainbowIndex += 1;
  }
}

function placeStamp(point) {
  context.save();
  context.font = `${currentSize * 3.2}px serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(currentStamp, point.x, point.y);
  context.restore();
}

function getShapeStrokeStyle(from, to) {
  if (!isRainbowStroke()) {
    return currentColor;
  }

  const gradient = context.createLinearGradient(from.x, from.y, to.x || from.x + 1, to.y || from.y + 1);
  rainbowColors.forEach((color, index) => {
    const stop = rainbowColors.length === 1 ? 0 : index / (rainbowColors.length - 1);
    gradient.addColorStop(stop, color);
  });
  return gradient;
}

function drawShapePreview(from, to) {
  if (!shapeSnapshot) {
    return;
  }

  context.putImageData(shapeSnapshot, 0, 0);
  applyBrushStyle();
  const strokeStyle = getShapeStrokeStyle(from, to);
  context.strokeStyle = strokeStyle;
  context.fillStyle = strokeStyle;

  const width = to.x - from.x;
  const height = to.y - from.y;

  if (currentTool === "line") {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  } else if (currentTool === "square") {
    context.strokeRect(from.x, from.y, width, height);
  } else if (currentTool === "circle") {
    context.beginPath();
    context.ellipse(from.x + width / 2, from.y + height / 2, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, Math.PI * 2);
    context.stroke();
  } else if (currentTool === "triangle") {
    context.beginPath();
    context.moveTo(from.x + width / 2, from.y);
    context.lineTo(from.x, from.y + height);
    context.lineTo(from.x + width, from.y + height);
    context.closePath();
    context.stroke();
  }

  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function handlePointerDown(event) {
  const point = getCanvasPoint(event);

  if (currentTool === "stamp") {
    saveHistorySnapshot();
    placeStamp(point);
    return;
  }

  if (["line", "circle", "square", "triangle"].includes(currentTool)) {
    saveHistorySnapshot();
    drawing = true;
    shapeStartPoint = point;
    shapeSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    return;
  }

  saveHistorySnapshot();
  drawing = true;
  lastPoint = point;
  strokeLine(point, point);
}

function handlePointerMove(event) {
  if (!drawing) {
    return;
  }

  const point = getCanvasPoint(event);

  if (shapeStartPoint) {
    drawShapePreview(shapeStartPoint, point);
    return;
  }

  strokeLine(lastPoint, point);
  lastPoint = point;
}

function stopDrawing(event) {
  if (drawing && shapeStartPoint && event) {
    const point = getCanvasPoint(event);
    drawShapePreview(shapeStartPoint, point);
    if (isRainbowStroke()) {
      rainbowIndex += 1;
    }
  }

  drawing = false;
  lastPoint = null;
  shapeStartPoint = null;
  shapeSnapshot = null;
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function saveArtwork() {
  const link = document.createElement("a");
  const backdropName = backdrops[currentBackdropIndex].name.toLowerCase().replace(/\s+/g, "-");
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = canvas.toDataURL("image/png");
  link.download = `morgan-art-${backdropName}-${dateStamp}.png`;
  link.click();
}

toolButtons.forEach((button) => {
  if (button.dataset.brushStyle) {
    return;
  }

  button.addEventListener("click", () => {
    currentTool = button.dataset.tool;
    syncToolVisualState();
    colorsGroup.hidden = currentTool === "stamp";
    stampsGroup.hidden = currentTool !== "stamp";
  });
});

brushStyleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentBrushStyle = button.dataset.brushStyle;
    currentTool = "paint";
    syncToolVisualState();
    colorsGroup.hidden = false;
    stampsGroup.hidden = true;
  });
});

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentColor = button.dataset.color;
    setActive(colorButtons, currentColor, "color");

    if (currentTool === "stamp") {
      currentTool = "paint";
      currentBrushStyle = "pencil";
      colorsGroup.hidden = false;
      stampsGroup.hidden = true;
      syncToolVisualState();
    }
  });
});

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentSize = Number(button.dataset.size);
    setActive(sizeButtons, button.dataset.size, "size");
  });
});

backdropButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveHistorySnapshot();
    currentBackdropIndex = Number(button.dataset.backdrop);
    setActive(backdropButtons, button.dataset.backdrop, "backdrop");
    renderStampButtons();
    drawBackdrop();
  });
});

clearButton.addEventListener("click", () => {
  saveHistorySnapshot();
  drawBackdrop();
});
saveButton.addEventListener("click", saveArtwork);
undoButton.addEventListener("click", undoLastAction);

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

preloadBackdropImages();
drawBackdrop();
clearHistory();
renderStampButtons();
syncToolVisualState();
