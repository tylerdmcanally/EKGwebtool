const canvas = document.getElementById("stripCanvas");
const ctx = canvas.getContext("2d");

const els = {
  imageInput: document.getElementById("imageInput"),
  demoBtn: document.getElementById("demoBtn"),
  stage: document.getElementById("stage"),
  emptyState: document.getElementById("emptyState"),
  timeCalMode: document.getElementById("timeCalMode"),
  paperSpeedField: document.getElementById("paperSpeedField"),
  paperSpeed: document.getElementById("paperSpeed"),
  customSpeed: document.getElementById("customSpeed"),
  customSpeedField: document.getElementById("customSpeedField"),
  gain: document.getElementById("gain"),
  customGain: document.getElementById("customGain"),
  customGainField: document.getElementById("customGainField"),
  boxPxX: document.getElementById("boxPxX"),
  boxPxY: document.getElementById("boxPxY"),
  lockBoxes: document.getElementById("lockBoxes"),
  calibrationBoxes: document.getElementById("calibrationBoxes"),
  gridOpacity: document.getElementById("gridOpacity"),
  showGrid: document.getElementById("showGrid"),
  autoGridBtn: document.getElementById("autoGridBtn"),
  gridCalSummary: document.getElementById("gridCalSummary"),
  marchSteps: document.getElementById("marchSteps"),
  knownTimeField: document.getElementById("knownTimeField"),
  knownTimeMs: document.getElementById("knownTimeMs"),
  timeLargeBoxes: document.getElementById("timeLargeBoxes"),
  timeCalSummary: document.getElementById("timeCalSummary"),
  timeCalHelp: document.getElementById("timeCalHelp"),
  highlightType: document.getElementById("highlightType"),
  summary: document.getElementById("summary"),
  measurementList: document.getElementById("measurementList"),
  readout: document.getElementById("readout"),
  statusText: document.getElementById("statusText"),
  downloadPngBtn: document.getElementById("downloadPngBtn"),
  downloadPdfBtn: document.getElementById("downloadPdfBtn"),
  shareBtn: document.getElementById("shareBtn"),
  undoBtn: document.getElementById("undoBtn"),
  clearBtn: document.getElementById("clearBtn"),
  zoomInBtn: document.getElementById("zoomInBtn"),
  zoomOutBtn: document.getElementById("zoomOutBtn"),
  fitBtn: document.getElementById("fitBtn")
};

const colors = {
  interval: "#0f766e",
  rr: "#b45309",
  march: "#7c3aed",
  amplitude: "#2563eb",
  gridalign: "#be123c",
  timecal: "#0369a1",
  calibrate: "#111827",
  note: "#374151"
};

const state = {
  image: null,
  imageName: "",
  annotations: [],
  active: null,
  selectedTool: "pan",
  nextId: 1,
  view: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  calibration: {
    paperSpeed: 25,
    gain: 10,
    pxPerSmallX: 18,
    pxPerSmallY: 18,
    lockBoxes: false,
    calibrationBoxes: 5,
    gridOpacity: 0.35,
    showGrid: true,
    originX: 0,
    originY: 0
  }
};

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(els.stage);
} else {
  window.addEventListener("resize", render);
}

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => {
    setTool(button.dataset.tool);
  });
});

els.imageInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) {
    loadImageFile(file);
  }
});

["dragenter", "dragover"].forEach((name) => {
  els.stage.addEventListener(name, (event) => {
    event.preventDefault();
    els.stage.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((name) => {
  els.stage.addEventListener(name, () => {
    els.stage.classList.remove("dragging");
  });
});

els.stage.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    loadImageFile(file);
  }
});

els.demoBtn.addEventListener("click", loadDemoStrip);

els.timeCalMode.addEventListener("change", () => {
  if (els.timeCalMode.value === "known" && Number(els.timeLargeBoxes.value) === 5) {
    els.timeLargeBoxes.value = 2;
  }
  if (els.timeCalMode.value === "speed" && Number(els.timeLargeBoxes.value) === 2) {
    els.timeLargeBoxes.value = 5;
  }
  syncCalibrationFromInputs();
});
els.paperSpeed.addEventListener("change", syncCalibrationFromInputs);
els.customSpeed.addEventListener("input", syncCalibrationFromInputs);
els.gain.addEventListener("change", syncCalibrationFromInputs);
els.customGain.addEventListener("input", syncCalibrationFromInputs);
els.boxPxX.addEventListener("input", () => {
  const value = numberFromInput(els.boxPxX, state.calibration.pxPerSmallX);
  state.calibration.pxPerSmallX = value;
  if (state.calibration.lockBoxes) {
    state.calibration.pxPerSmallY = value;
    els.boxPxY.value = value;
  }
  render();
  updateMeasurements();
});
els.boxPxY.addEventListener("input", () => {
  const value = numberFromInput(els.boxPxY, state.calibration.pxPerSmallY);
  state.calibration.pxPerSmallY = value;
  if (state.calibration.lockBoxes) {
    state.calibration.pxPerSmallX = value;
    els.boxPxX.value = value;
  }
  render();
  updateMeasurements();
});
els.lockBoxes.addEventListener("change", () => {
  state.calibration.lockBoxes = els.lockBoxes.checked;
  if (state.calibration.lockBoxes) {
    state.calibration.pxPerSmallY = state.calibration.pxPerSmallX;
    els.boxPxY.value = state.calibration.pxPerSmallX;
  }
  render();
});
els.calibrationBoxes.addEventListener("input", syncCalibrationFromInputs);
els.gridOpacity.addEventListener("input", syncCalibrationFromInputs);
els.showGrid.addEventListener("change", syncCalibrationFromInputs);
els.autoGridBtn.addEventListener("click", autoDetectGrid);
els.marchSteps.addEventListener("input", render);
els.knownTimeMs.addEventListener("input", syncCalibrationFromInputs);
els.timeLargeBoxes.addEventListener("input", syncCalibrationFromInputs);
els.highlightType.addEventListener("change", render);

els.undoBtn.addEventListener("click", () => {
  state.annotations.pop();
  render();
  updateMeasurements();
});

els.clearBtn.addEventListener("click", () => {
  if (!state.annotations.length) return;
  state.annotations = [];
  render();
  updateMeasurements();
});

els.zoomInBtn.addEventListener("click", () => zoomAtCenter(1.2));
els.zoomOutBtn.addEventListener("click", () => zoomAtCenter(1 / 1.2));
els.fitBtn.addEventListener("click", fitImage);
els.downloadPngBtn.addEventListener("click", downloadPng);
els.downloadPdfBtn.addEventListener("click", downloadPdf);
els.shareBtn.addEventListener("click", shareReport);

els.measurementList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-delete-id]");
  if (!button) return;
  const id = Number(button.dataset.deleteId);
  state.annotations = state.annotations.filter((annotation) => annotation.id !== id);
  render();
  updateMeasurements();
});

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
canvas.addEventListener("wheel", onWheel, { passive: false });

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    state.annotations.pop();
    render();
    updateMeasurements();
  }
  if (event.key === "Escape") {
    state.active = null;
    render();
  }
});

syncCalibrationFromInputs();
render();
updateMeasurements();

function setTool(tool) {
  state.selectedTool = tool;
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  const cursors = {
    pan: "grab",
    erase: "not-allowed",
    note: "copy",
    gridalign: "crosshair",
    timecal: "crosshair",
    calibrate: "crosshair",
    interval: "crosshair",
    rr: "crosshair",
    march: "crosshair",
    amplitude: "crosshair",
    highlight: "crosshair"
  };
  canvas.style.cursor = cursors[tool] || "crosshair";
  setStatus(statusForTool(tool));
}

function statusForTool(tool) {
  const map = {
    pan: "Drag the strip to reposition it. Use the zoom controls or mouse wheel to scale.",
    gridalign: "Drag a rectangle over known small boxes to align and size the grid overlay.",
    timecal: "Drag left-to-right across the large boxes selected in the Calibration panel.",
    calibrate: "Drag across a known number of small boxes to set image spacing.",
    interval: "Drag horizontally across an interval to measure milliseconds.",
    rr: "Drag between R waves to estimate rate from the R-R interval.",
    march: "Drag to set the caliper opening, then repeated ticks march out that same spacing.",
    amplitude: "Drag vertically to measure voltage in mV.",
    highlight: "Drag a rectangle around a P wave, QRS, ST segment, T wave, or custom area.",
    note: "Click the strip to add a label.",
    erase: "Click an annotation to remove it."
  };
  return map[tool] || "";
}

function syncCalibrationFromInputs() {
  const knownMode = els.timeCalMode.value === "known";
  els.paperSpeedField.classList.toggle("hidden", knownMode);
  els.knownTimeField.classList.toggle("hidden", !knownMode);
  els.customSpeedField.classList.toggle("hidden", knownMode || els.paperSpeed.value !== "custom");
  els.customGainField.classList.toggle("hidden", els.gain.value !== "custom");

  state.calibration.paperSpeed = els.paperSpeed.value === "custom"
    ? numberFromInput(els.customSpeed, 25)
    : Number(els.paperSpeed.value);
  state.calibration.gain = els.gain.value === "custom"
    ? numberFromInput(els.customGain, 10)
    : Number(els.gain.value);
  if (knownMode) {
    state.calibration.paperSpeed = timeCalibrationSettings().paperSpeed;
  }
  state.calibration.calibrationBoxes = numberFromInput(els.calibrationBoxes, 5);
  state.calibration.gridOpacity = Number(els.gridOpacity.value);
  state.calibration.showGrid = els.showGrid.checked;
  updateTimeCalibrationSummary();

  render();
  updateMeasurements();
}

function numberFromInput(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getCalibrationBoxCount() {
  return Math.max(1, Math.round(numberFromInput(els.calibrationBoxes, 5)));
}

function getKnownTimeMs() {
  return numberFromInput(els.knownTimeMs, 400);
}

function getTimeLargeBoxes() {
  return numberFromInput(els.timeLargeBoxes, 2);
}

function updateTimeCalibrationSummary() {
  const data = timeCalibrationSettings();
  if (els.timeCalMode.value === "known") {
    els.timeCalHelp.textContent = "Enter the known duration and box count. With an aligned grid, no drag is needed; use Set Time Scale only if the overlay is off.";
    els.timeCalSummary.textContent = `Calibration target: ${round(data.largeBoxes, 2)} large boxes = ${round(data.knownMs, 0)} ms (${round(data.paperSpeed, 2)} mm/s effective).`;
    return;
  }
  els.timeCalHelp.textContent = "Auto-detect the grid first. If the overlay is off, enter a large-box count and use Set Time Scale manually.";
  els.timeCalSummary.textContent = `Calibration target: ${round(data.largeBoxes, 2)} large boxes at ${round(data.paperSpeed, 2)} mm/s = ${round(data.knownMs, 0)} ms.`;
}

function autoDetectGrid() {
  if (!state.image) {
    setStatus("Load an image before auto-detecting the grid.");
    return;
  }

  const result = detectEcgGrid(state.image);
  if (!result) {
    els.gridCalSummary.textContent = "Grid not detected. Use Set Time Scale manually on a clearly visible box span.";
    setStatus("Could not auto-detect a reliable grid. Use Set Time Scale manually.");
    return;
  }

  const normalizedSpacing = normalizeDetectedGridSpacing(result.x.spacing, result.y.spacing);
  state.calibration.pxPerSmallX = normalizedSpacing.x;
  state.calibration.pxPerSmallY = normalizedSpacing.y;
  state.calibration.originX = result.x.origin;
  state.calibration.originY = result.y.origin;
  state.calibration.showGrid = true;
  els.boxPxX.value = round(normalizedSpacing.x, 2);
  els.boxPxY.value = round(normalizedSpacing.y, 2);
  els.showGrid.checked = true;

  const confidenceLabel = result.confidence >= 0.5 ? "high confidence" : "review needed";
  els.gridCalSummary.textContent = `Grid detected (${confidenceLabel}). Confirm the overlay lines match the small boxes before measuring.`;
  setStatus("Auto-detected the grid. Confirm overlay alignment before measuring.");
  render();
  updateMeasurements();
}

function detectEcgGrid(image) {
  // Best-effort detector: find repeating red/gray grid-line peaks in image-space projections.
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(24, Math.round(image.width * scale));
  const height = Math.max(24, Math.round(image.height * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  sourceCtx.imageSmoothingEnabled = true;
  sourceCtx.drawImage(image, 0, 0, width, height);
  const pixels = sourceCtx.getImageData(0, 0, width, height).data;
  const xProfile = new Float64Array(width);
  const yProfile = new Float64Array(height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const score = gridPixelScore(r, g, b);
      xProfile[x] += score;
      yProfile[y] += score;
    }
  }

  normalizeProfile(xProfile, height);
  normalizeProfile(yProfile, width);
  const xAxis = estimateGridAxis(xProfile);
  const yAxis = estimateGridAxis(yProfile);
  if (!xAxis || !yAxis) return null;

  const confidence = Math.min(xAxis.confidence, yAxis.confidence);
  if (confidence < 0.06) return null;

  return {
    confidence,
    x: {
      spacing: xAxis.period / scale,
      origin: xAxis.phase / scale
    },
    y: {
      spacing: yAxis.period / scale,
      origin: yAxis.phase / scale
    }
  };
}

function normalizeDetectedGridSpacing(xSpacing, ySpacing) {
  if (!Number.isFinite(xSpacing) || !Number.isFinite(ySpacing) || xSpacing <= 0 || ySpacing <= 0) {
    return { x: xSpacing, y: ySpacing };
  }

  const ratio = ySpacing / xSpacing;
  if (ratio > 0.85 && ratio < 1.18) {
    const average = (xSpacing + ySpacing) / 2;
    return { x: average, y: average };
  }
  if (ratio < 0.65 || ratio > 1.55) {
    return { x: xSpacing, y: xSpacing };
  }
  return { x: xSpacing, y: ySpacing };
}

function gridPixelScore(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const redBias = r - (g + b) / 2;
  const pinkLine = Math.max(0, redBias - 3) * 1.4;
  const grayLine = max - min < 32 ? Math.max(0, 238 - brightness) * 0.16 : 0;
  return pinkLine + grayLine;
}

function normalizeProfile(profile, divisor) {
  for (let index = 0; index < profile.length; index += 1) {
    profile[index] /= divisor;
  }
}

function estimateGridAxis(profile) {
  const smoothed = smoothProfile(profile, 1);
  const baseline = quantile(Array.from(smoothed), 0.35);
  const signal = smoothed.map((value) => Math.max(0, value - baseline));
  const total = signal.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  const minPeriod = 4;
  const maxPeriod = Math.min(70, Math.floor(signal.length / 4));
  let best = null;
  for (let period = minPeriod; period <= maxPeriod; period += 1) {
    const fit = bestPhaseForPeriod(signal, period, total);
    if (!best || fit.score > best.score) {
      best = { period, ...fit };
    }
  }

  if (!best) return null;
  const refined = refinePeriod(signal, best.period, best.phase, total);
  if (refined && (refined.score > best.score || refined.period < best.period)) {
    return refined;
  }
  return best;
}

function bestPhaseForPeriod(signal, period, total) {
  let best = { phase: 0, score: 0, confidence: 0 };
  for (let phase = 0; phase < period; phase += 1) {
    const fit = gridFitScore(signal, period, phase, total);
    if (fit.score > best.score) {
      best = { phase, ...fit };
    }
  }
  return best;
}

function gridFitScore(signal, period, phase, total) {
  let lineSum = 0;
  let lineCount = 0;
  let gapSum = 0;
  let gapCount = 0;
  const lineRadius = Math.max(1, Math.round(period * 0.08));
  const gapStart = Math.max(lineRadius + 1, Math.floor(period * 0.32));

  for (let index = 0; index < signal.length; index += 1) {
    const distance = phaseDistance(index, phase, period);
    if (distance <= lineRadius) {
      lineSum += signal[index];
      lineCount += 1;
    } else if (distance >= gapStart) {
      gapSum += signal[index];
      gapCount += 1;
    }
  }

  if (!lineCount || !gapCount) return { score: 0, confidence: 0 };
  const lineAvg = lineSum / lineCount;
  const gapAvg = gapSum / gapCount;
  const contrast = Math.max(0, (lineAvg - gapAvg) / (lineAvg + gapAvg + 0.0001));
  const energy = lineSum / (total + 0.0001);
  const expectedLines = Math.max(1, Math.floor(signal.length / period));
  const coverage = Math.min(1, expectedLines / 8);
  const confidence = contrast * Math.min(1, energy * 2.4) * coverage;
  return {
    score: confidence,
    confidence
  };
}

function refinePeriod(signal, period, phase, total) {
  let best = { period, phase, ...gridFitScore(signal, period, phase, total) };
  const candidates = [period / 5, period / 2, period * 2, period * 5]
    .map((value) => Math.round(value))
    .filter((value) => value >= 4 && value <= Math.min(70, Math.floor(signal.length / 4)));

  candidates.forEach((candidate) => {
    const fit = bestPhaseForPeriod(signal, candidate, total);
    const subdivision = best.period >= 18 && candidate === Math.round(best.period / 5);
    if (subdivision && candidate < best.period) {
      best = {
        period: candidate,
        phase: fit.score > 0 ? fit.phase : best.phase % candidate,
        score: Math.max(fit.score, best.score * 0.2),
        confidence: Math.min(best.confidence * 0.45, Math.max(fit.confidence, 0.08))
      };
      return;
    }
    const threshold = subdivision ? 0.12 : 0.72;
    if (fit.score >= best.score * threshold && candidate < best.period) {
      best = { period: candidate, ...fit };
    }
  });
  return best;
}

function smoothProfile(profile, radius) {
  return Array.from(profile, (_value, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const next = index + offset;
      if (next >= 0 && next < profile.length) {
        sum += profile[next];
        count += 1;
      }
    }
    return count ? sum / count : 0;
  });
}

function phaseDistance(index, phase, period) {
  const distance = Math.abs(((index - phase) % period + period) % period);
  return Math.min(distance, period - distance);
}

function quantile(values, q) {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  const index = clamp(Math.floor((values.length - 1) * q), 0, values.length - 1);
  return values[index];
}

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = () => loadImageSource(String(reader.result), file.name);
  reader.readAsDataURL(file);
}

function loadImageSource(src, name) {
  const image = new Image();
  image.onload = () => {
    state.image = image;
    state.imageName = name || "ekg-strip";
    state.annotations = [];
    state.nextId = 1;
    els.emptyState.classList.add("hidden");
    fitImage();
    updateMeasurements();
    setStatus("Image loaded. Check paper speed and box calibration before measuring.");
  };
  image.onerror = () => setStatus("The selected image could not be loaded.");
  image.src = src;
}

function loadDemoStrip() {
  const demo = document.createElement("canvas");
  const dctx = demo.getContext("2d");
  const small = 16;
  const width = 1680;
  const height = 560;
  demo.width = width;
  demo.height = height;

  dctx.fillStyle = "#fffdfb";
  dctx.fillRect(0, 0, width, height);
  drawDemoGrid(dctx, width, height, small);

  const baseline = height * 0.52;
  const mvScale = small * 10;
  const msPerPx = 40 / small;
  dctx.lineWidth = 3;
  dctx.strokeStyle = "#191919";
  dctx.beginPath();
  for (let x = 0; x < width; x += 2) {
    const ms = x * msPerPx;
    const y = baseline - demoVoltageAt(ms) * mvScale;
    if (x === 0) dctx.moveTo(x, y);
    else dctx.lineTo(x, y);
  }
  dctx.stroke();

  state.calibration.pxPerSmallX = small;
  state.calibration.pxPerSmallY = small;
  state.calibration.originX = 0;
  state.calibration.originY = 0;
  els.boxPxX.value = small;
  els.boxPxY.value = small;
  loadImageSource(demo.toDataURL("image/png"), "demo-rhythm-strip.png");
}

function drawDemoGrid(dctx, width, height, small) {
  for (let x = 0; x <= width; x += small) {
    const major = Math.round(x / small) % 5 === 0;
    dctx.beginPath();
    dctx.moveTo(x, 0);
    dctx.lineTo(x, height);
    dctx.lineWidth = major ? 1.2 : 0.6;
    dctx.strokeStyle = major ? "rgba(214, 87, 87, 0.45)" : "rgba(237, 154, 154, 0.32)";
    dctx.stroke();
  }
  for (let y = 0; y <= height; y += small) {
    const major = Math.round(y / small) % 5 === 0;
    dctx.beginPath();
    dctx.moveTo(0, y);
    dctx.lineTo(width, y);
    dctx.lineWidth = major ? 1.2 : 0.6;
    dctx.strokeStyle = major ? "rgba(214, 87, 87, 0.45)" : "rgba(237, 154, 154, 0.32)";
    dctx.stroke();
  }
}

function demoVoltageAt(ms) {
  const beat = 820;
  const phase = ((ms % beat) + beat) % beat;
  return (
    gaussian(phase, 155, 28, 0.13) -
    gaussian(phase, 308, 8, 0.16) +
    gaussian(phase, 326, 7, 1.12) -
    gaussian(phase, 348, 12, 0.36) +
    gaussian(phase, 555, 64, 0.32) +
    0.015 * Math.sin(ms / 180)
  );
}

function gaussian(x, center, width, height) {
  return height * Math.exp(-0.5 * ((x - center) / width) ** 2);
}

function render() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#dfe5e2";
  ctx.fillRect(0, 0, width, height);

  if (!state.image) return;

  renderScene(ctx, state.view, width, height, {
    includeWorkspaceBackground: false,
    showActive: true
  });
  updateReadout();
}

function renderScene(targetCtx, view, width, height, options = {}) {
  if (!state.image) return;
  if (options.includeWorkspaceBackground) {
    targetCtx.fillStyle = "#ffffff";
    targetCtx.fillRect(0, 0, width, height);
  }

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.drawImage(
    state.image,
    view.offsetX,
    view.offsetY,
    state.image.width * view.scale,
    state.image.height * view.scale
  );

  if (state.calibration.showGrid) {
    drawGrid(targetCtx, view);
  }

  state.annotations.forEach((annotation) => drawAnnotation(targetCtx, annotation, view));
  if (options.showActive && state.active && state.active.kind !== "pan") {
    drawAnnotation(targetCtx, previewAnnotation(), view, true);
  }
}

function drawGrid(targetCtx, view) {
  const image = state.image;
  const xStep = state.calibration.pxPerSmallX;
  const yStep = state.calibration.pxPerSmallY;
  const alpha = state.calibration.gridOpacity;
  if (!image || xStep <= 0 || yStep <= 0 || alpha <= 0) return;

  const left = view.offsetX;
  const top = view.offsetY;
  const right = left + image.width * view.scale;
  const bottom = top + image.height * view.scale;
  targetCtx.save();
  targetCtx.lineCap = "butt";

  const firstX = firstGridLine(state.calibration.originX, xStep);
  const firstY = firstGridLine(state.calibration.originY, yStep);

  for (let x = firstX; x <= image.width; x += xStep) {
    const index = Math.round((x - state.calibration.originX) / xStep);
    const sx = left + x * view.scale;
    if (sx < left || sx > right) continue;
    targetCtx.beginPath();
    targetCtx.moveTo(sx, top);
    targetCtx.lineTo(sx, bottom);
    targetCtx.lineWidth = index % 5 === 0 ? 1.15 : 0.55;
    targetCtx.strokeStyle = index % 5 === 0
      ? `rgba(214, 75, 75, ${alpha})`
      : `rgba(235, 125, 125, ${alpha * 0.72})`;
    targetCtx.stroke();
  }

  for (let y = firstY; y <= image.height; y += yStep) {
    const index = Math.round((y - state.calibration.originY) / yStep);
    const sy = top + y * view.scale;
    if (sy < top || sy > bottom) continue;
    targetCtx.beginPath();
    targetCtx.moveTo(left, sy);
    targetCtx.lineTo(right, sy);
    targetCtx.lineWidth = index % 5 === 0 ? 1.15 : 0.55;
    targetCtx.strokeStyle = index % 5 === 0
      ? `rgba(214, 75, 75, ${alpha})`
      : `rgba(235, 125, 125, ${alpha * 0.72})`;
    targetCtx.stroke();
  }

  targetCtx.restore();
}

function drawAnnotation(targetCtx, annotation, view, isPreview = false) {
  if (annotation.kind === "gridalign") {
    drawGridAlignPreview(targetCtx, annotation, view);
    return;
  }
  if (annotation.kind === "highlight") {
    drawHighlight(targetCtx, annotation, view, isPreview);
    return;
  }
  if (annotation.kind === "note") {
    drawNote(targetCtx, annotation, view);
    return;
  }
  drawMeasure(targetCtx, annotation, view, isPreview);
}

function drawMeasure(targetCtx, annotation, view, isPreview = false) {
  if (annotation.type === "march") {
    drawMarchMeasure(targetCtx, annotation, view, isPreview);
    return;
  }

  const start = toScreen(annotation.start, view);
  const end = toScreen(annotation.end, view);
  const color = annotation.color || colors[annotation.type] || colors.interval;
  const tick = annotation.type === "amplitude" ? 14 : 18;

  targetCtx.save();
  targetCtx.strokeStyle = color;
  targetCtx.fillStyle = color;
  targetCtx.globalAlpha = isPreview ? 0.74 : 1;
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash(annotation.kind === "calibration" ? [7, 5] : []);
  targetCtx.beginPath();
  targetCtx.moveTo(start.x, start.y);
  targetCtx.lineTo(end.x, end.y);
  targetCtx.stroke();
  targetCtx.setLineDash([]);

  if (annotation.type === "amplitude") {
    targetCtx.beginPath();
    targetCtx.moveTo(start.x - tick / 2, start.y);
    targetCtx.lineTo(start.x + tick / 2, start.y);
    targetCtx.moveTo(end.x - tick / 2, end.y);
    targetCtx.lineTo(end.x + tick / 2, end.y);
    targetCtx.stroke();
  } else {
    targetCtx.beginPath();
    targetCtx.moveTo(start.x, start.y - tick / 2);
    targetCtx.lineTo(start.x, start.y + tick / 2);
    targetCtx.moveTo(end.x, end.y - tick / 2);
    targetCtx.lineTo(end.x, end.y + tick / 2);
    targetCtx.stroke();
  }

  targetCtx.beginPath();
  targetCtx.arc(start.x, start.y, 4, 0, Math.PI * 2);
  targetCtx.arc(end.x, end.y, 4, 0, Math.PI * 2);
  targetCtx.fill();

  drawBubble(targetCtx, labelForAnnotation(annotation), midpoint(start, end), color);
  targetCtx.restore();
}

function drawGridAlignPreview(targetCtx, annotation, view) {
  const rect = normalizedRect(annotation.start, annotation.end);
  const start = toScreen({ x: rect.x, y: rect.y }, view);
  const end = toScreen({ x: rect.x + rect.width, y: rect.y + rect.height }, view);
  const width = end.x - start.x;
  const height = end.y - start.y;
  const boxes = Math.max(1, getCalibrationBoxCount());

  targetCtx.save();
  targetCtx.strokeStyle = colors.gridalign;
  targetCtx.fillStyle = hexToRgba(colors.gridalign, 0.08);
  targetCtx.lineWidth = 2;
  targetCtx.setLineDash([8, 5]);
  targetCtx.fillRect(start.x, start.y, width, height);
  targetCtx.strokeRect(start.x, start.y, width, height);
  targetCtx.setLineDash([]);
  targetCtx.lineWidth = 1;

  for (let index = 1; index < boxes; index += 1) {
    const x = start.x + (width * index) / boxes;
    const y = start.y + (height * index) / boxes;
    targetCtx.beginPath();
    targetCtx.moveTo(x, start.y);
    targetCtx.lineTo(x, end.y);
    targetCtx.moveTo(start.x, y);
    targetCtx.lineTo(end.x, y);
    targetCtx.stroke();
  }

  drawBubble(targetCtx, `${boxes} x ${boxes} boxes`, { x: start.x + 8, y: start.y + 16 }, colors.gridalign);
  targetCtx.restore();
}

function drawMarchMeasure(targetCtx, annotation, view, isPreview = false) {
  const points = marchPoints(annotation);
  if (points.length < 2) return;

  const color = annotation.color || colors.march;
  const screenPoints = points.map((point) => toScreen(point, view));
  const first = screenPoints[0];
  const second = screenPoints[1];
  const last = screenPoints[screenPoints.length - 1];
  const angle = Math.atan2(second.y - first.y, second.x - first.x);
  const tickAngle = angle + Math.PI / 2;
  const halfTick = 15;

  targetCtx.save();
  targetCtx.strokeStyle = color;
  targetCtx.fillStyle = color;
  targetCtx.globalAlpha = isPreview ? 0.74 : 1;
  targetCtx.lineWidth = 2;

  targetCtx.beginPath();
  targetCtx.moveTo(first.x, first.y);
  targetCtx.lineTo(second.x, second.y);
  targetCtx.stroke();

  targetCtx.setLineDash([5, 7]);
  targetCtx.beginPath();
  targetCtx.moveTo(first.x, first.y);
  targetCtx.lineTo(last.x, last.y);
  targetCtx.stroke();
  targetCtx.setLineDash([]);

  screenPoints.forEach((point, index) => {
    const x1 = point.x + Math.cos(tickAngle) * halfTick;
    const y1 = point.y + Math.sin(tickAngle) * halfTick;
    const x2 = point.x - Math.cos(tickAngle) * halfTick;
    const y2 = point.y - Math.sin(tickAngle) * halfTick;
    targetCtx.beginPath();
    targetCtx.moveTo(x1, y1);
    targetCtx.lineTo(x2, y2);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.arc(point.x, point.y, index < 2 ? 4 : 3, 0, Math.PI * 2);
    targetCtx.fill();
  });

  drawBubble(targetCtx, labelForAnnotation(annotation), midpoint(first, second), color);
  targetCtx.restore();
}

function drawHighlight(targetCtx, annotation, view, isPreview = false) {
  const rect = normalizedRect(annotation.start, annotation.end);
  const start = toScreen({ x: rect.x, y: rect.y }, view);
  const end = toScreen({ x: rect.x + rect.width, y: rect.y + rect.height }, view);
  const color = annotation.color;
  const width = end.x - start.x;
  const height = end.y - start.y;

  targetCtx.save();
  targetCtx.globalAlpha = isPreview ? 0.65 : 1;
  targetCtx.fillStyle = hexToRgba(color, 0.18);
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 2;
  targetCtx.fillRect(start.x, start.y, width, height);
  targetCtx.strokeRect(start.x, start.y, width, height);
  drawBubble(targetCtx, annotation.label, { x: start.x + 8, y: start.y + 16 }, color);
  targetCtx.restore();
}

function drawNote(targetCtx, annotation, view) {
  const point = toScreen(annotation.point, view);
  targetCtx.save();
  targetCtx.fillStyle = colors.note;
  targetCtx.strokeStyle = "#fff";
  targetCtx.lineWidth = 2.5;
  targetCtx.beginPath();
  targetCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.stroke();
  drawBubble(targetCtx, annotation.label, { x: point.x + 12, y: point.y - 10 }, colors.note);
  targetCtx.restore();
}

function drawBubble(targetCtx, text, point, color) {
  const label = String(text || "").slice(0, 80);
  targetCtx.save();
  targetCtx.font = "700 12px Inter, Arial, sans-serif";
  const metrics = targetCtx.measureText(label);
  const width = Math.ceil(metrics.width + 16);
  const height = 24;
  const x = point.x + 8;
  const y = point.y - height - 8;
  targetCtx.fillStyle = "rgba(255, 255, 255, 0.94)";
  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 1;
  roundedRect(targetCtx, x, y, width, height, 6);
  targetCtx.fill();
  targetCtx.stroke();
  targetCtx.fillStyle = "#17201c";
  targetCtx.fillText(label, x + 8, y + 16);
  targetCtx.restore();
}

function roundedRect(targetCtx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  targetCtx.beginPath();
  targetCtx.moveTo(x + r, y);
  targetCtx.arcTo(x + width, y, x + width, y + height, r);
  targetCtx.arcTo(x + width, y + height, x, y + height, r);
  targetCtx.arcTo(x, y + height, x, y, r);
  targetCtx.arcTo(x, y, x + width, y, r);
  targetCtx.closePath();
}

function previewAnnotation() {
  const active = state.active;
  if (!active) return null;
  if (active.kind === "gridalign") {
    return {
      id: 0,
      kind: "gridalign",
      start: active.start,
      end: active.end
    };
  }
  if (active.kind === "highlight") {
    const meta = selectedHighlightMeta();
    return {
      id: 0,
      kind: "highlight",
      start: active.start,
      end: active.end,
      label: meta.label,
      color: meta.color
    };
  }
  return {
    id: 0,
    kind: active.kind === "calibrate" || active.kind === "timecal" ? "calibration" : "measure",
    type: active.kind,
    start: active.start,
    end: active.end,
    steps: active.kind === "march" ? getMarchSteps() : undefined,
    color: colors[active.kind] || colors.interval
  };
}

function onPointerDown(event) {
  if (!state.image) return;
  canvas.setPointerCapture(event.pointerId);
  const tool = state.selectedTool;
  const point = clampToImage(toImagePoint(event));

  if (tool === "pan") {
    state.active = {
      kind: "pan",
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: state.view.offsetX,
      offsetY: state.view.offsetY
    };
    canvas.style.cursor = "grabbing";
    return;
  }

  if (tool === "note") {
    const label = window.prompt("Note label");
    if (label && label.trim()) {
      state.annotations.push({
        id: state.nextId++,
        kind: "note",
        point,
        label: label.trim()
      });
      render();
      updateMeasurements();
    }
    return;
  }

  if (tool === "erase") {
    eraseAt(point);
    return;
  }

  state.active = {
    kind: tool,
    start: point,
    end: point
  };
  render();
}

function onPointerMove(event) {
  if (!state.active || !state.image) return;

  if (state.active.kind === "pan") {
    const dx = event.clientX - state.active.clientX;
    const dy = event.clientY - state.active.clientY;
    state.view.offsetX = state.active.offsetX + dx;
    state.view.offsetY = state.active.offsetY + dy;
    render();
    return;
  }

  state.active.end = clampToImage(toImagePoint(event));
  render();
}

function onPointerUp(event) {
  if (!state.active || !state.image) return;
  if (state.active.kind === "pan") {
    state.active = null;
    canvas.style.cursor = state.selectedTool === "pan" ? "grab" : "crosshair";
    return;
  }

  const active = state.active;
  state.active = null;
  const dx = Math.abs(active.end.x - active.start.x);
  const dy = Math.abs(active.end.y - active.start.y);
  if (dx + dy < 4) {
    render();
    return;
  }

  if (active.kind === "gridalign") {
    applyGridAlignment(active.start, active.end);
  } else if (active.kind === "timecal") {
    applyTimeCalibration(active.start, active.end);
  } else if (active.kind === "calibrate") {
    applyCalibration(active.start, active.end);
  } else if (active.kind === "highlight") {
    const meta = selectedHighlightMeta();
    state.annotations.push({
      id: state.nextId++,
      kind: "highlight",
      start: active.start,
      end: active.end,
      label: meta.label,
      color: meta.color
    });
  } else {
    state.annotations.push({
      id: state.nextId++,
      kind: "measure",
      type: active.kind,
      start: active.start,
      end: active.end,
      steps: active.kind === "march" ? getMarchSteps() : undefined,
      color: colors[active.kind] || colors.interval
    });
  }

  render();
  updateMeasurements();
}

function onWheel(event) {
  if (!state.image) return;
  event.preventDefault();
  const zoom = event.deltaY < 0 ? 1.08 : 1 / 1.08;
  const rect = canvas.getBoundingClientRect();
  zoomAt(zoom, event.clientX - rect.left, event.clientY - rect.top);
}

function applyCalibration(start, end) {
  const boxes = getCalibrationBoxCount();
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  if (dx >= dy) {
    const value = dx / boxes;
    state.calibration.pxPerSmallX = value;
    els.boxPxX.value = round(value, 2);
    if (state.calibration.lockBoxes) {
      state.calibration.pxPerSmallY = value;
      els.boxPxY.value = round(value, 2);
    }
    setStatus(`Horizontal calibration set to ${round(value, 2)} px per small box.`);
  } else {
    const value = dy / boxes;
    state.calibration.pxPerSmallY = value;
    els.boxPxY.value = round(value, 2);
    if (state.calibration.lockBoxes) {
      state.calibration.pxPerSmallX = value;
      els.boxPxX.value = round(value, 2);
    }
    setStatus(`Vertical calibration set to ${round(value, 2)} px per small box.`);
  }
}

function applyGridAlignment(start, end) {
  const boxes = getCalibrationBoxCount();
  const rect = normalizedRect(start, end);
  if (rect.width < 4 || rect.height < 4) {
    setStatus("Grid alignment box was too small to calibrate.");
    return;
  }

  const pxX = rect.width / boxes;
  const pxY = rect.height / boxes;
  if (state.calibration.lockBoxes) {
    const average = (pxX + pxY) / 2;
    state.calibration.pxPerSmallX = average;
    state.calibration.pxPerSmallY = average;
    els.boxPxX.value = round(average, 2);
    els.boxPxY.value = round(average, 2);
  } else {
    state.calibration.pxPerSmallX = pxX;
    state.calibration.pxPerSmallY = pxY;
    els.boxPxX.value = round(pxX, 2);
    els.boxPxY.value = round(pxY, 2);
  }
  state.calibration.originX = rect.x;
  state.calibration.originY = rect.y;
  setStatus(`Grid overlay aligned across ${boxes} small boxes.`);
}

function applyTimeCalibration(start, end) {
  const data = timeCalibrationData({ start, end });
  if (!Number.isFinite(data.paperSpeed) || data.dx < 4 || data.smallBoxes < 1) {
    setStatus("Dragged span was too short to calibrate the time scale.");
    return;
  }

  state.calibration.pxPerSmallX = data.pxPerSmallX;
  state.calibration.originX = Math.min(start.x, end.x);
  els.boxPxX.value = round(data.pxPerSmallX, 2);
  if (state.calibration.lockBoxes) {
    state.calibration.pxPerSmallY = data.pxPerSmallX;
    els.boxPxY.value = round(data.pxPerSmallX, 2);
  }
  if (els.timeCalMode.value === "known") {
    setPaperSpeed(data.paperSpeed);
  }
  const msPerLarge = data.knownMs / data.largeBoxes;
  const sourceLabel = els.timeCalMode.value === "known" ? "known marker" : "standard speed";
  setStatus(`Time scale set from ${sourceLabel}: ${round(data.knownMs, 0)} ms across ${round(data.largeBoxes, 2)} large boxes (${round(msPerLarge, 1)} ms/large box).`);
}

function setPaperSpeed(speed) {
  const commonSpeed = [25, 50].find((value) => Math.abs(value - speed) <= 0.5);
  if (commonSpeed) {
    els.paperSpeed.value = String(commonSpeed);
    els.customSpeed.value = round(speed, 2);
  } else {
    els.paperSpeed.value = "custom";
    els.customSpeed.value = round(speed, 2);
  }
  syncCalibrationFromInputs();
}

function eraseAt(point) {
  const index = findAnnotationIndex(point);
  if (index >= 0) {
    state.annotations.splice(index, 1);
    render();
    updateMeasurements();
  }
}

function findAnnotationIndex(point) {
  for (let index = state.annotations.length - 1; index >= 0; index -= 1) {
    const annotation = state.annotations[index];
    if (annotation.kind === "note") {
      if (distance(point, annotation.point) <= 14 / state.view.scale) return index;
      continue;
    }
    if (annotation.kind === "highlight") {
      const rect = normalizedRect(annotation.start, annotation.end);
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return index;
      }
      continue;
    }
    if (annotation.type === "march") {
      if (distanceToMarch(annotation, point) <= 10 / state.view.scale) return index;
      continue;
    }
    if (distanceToSegment(point, annotation.start, annotation.end) <= 10 / state.view.scale) {
      return index;
    }
  }
  return -1;
}

function toImagePoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - state.view.offsetX) / state.view.scale,
    y: (event.clientY - rect.top - state.view.offsetY) / state.view.scale
  };
}

function clampToImage(point) {
  if (!state.image) return point;
  return {
    x: clamp(point.x, 0, state.image.width),
    y: clamp(point.y, 0, state.image.height)
  };
}

function toScreen(point, view) {
  return {
    x: view.offsetX + point.x * view.scale,
    y: view.offsetY + point.y * view.scale
  };
}

function firstGridLine(origin, step) {
  if (!Number.isFinite(origin) || !Number.isFinite(step) || step <= 0) return 0;
  return origin - Math.ceil(origin / step) * step;
}

function fitImage() {
  if (!state.image) {
    render();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const padding = width < 640 ? 22 : 44;
  const scale = Math.min(
    (width - padding * 2) / state.image.width,
    (height - padding * 2) / state.image.height
  );
  state.view.scale = clamp(scale, 0.05, 8);
  state.view.offsetX = (width - state.image.width * state.view.scale) / 2;
  state.view.offsetY = (height - state.image.height * state.view.scale) / 2;
  render();
}

function zoomAtCenter(multiplier) {
  const rect = canvas.getBoundingClientRect();
  zoomAt(multiplier, rect.width / 2, rect.height / 2);
}

function zoomAt(multiplier, x, y) {
  const oldScale = state.view.scale;
  const newScale = clamp(oldScale * multiplier, 0.05, 12);
  const imageX = (x - state.view.offsetX) / oldScale;
  const imageY = (y - state.view.offsetY) / oldScale;
  state.view.scale = newScale;
  state.view.offsetX = x - imageX * newScale;
  state.view.offsetY = y - imageY * newScale;
  render();
}

function selectedHighlightMeta() {
  const selected = els.highlightType.selectedOptions[0];
  return {
    label: selected.value,
    color: selected.dataset.color || "#0f766e"
  };
}

function labelForAnnotation(annotation) {
  if (annotation.type === "timecal") {
    const data = timeCalibrationData(annotation);
    return `${round(data.knownMs, 0)} ms / ${round(data.largeBoxes, 2)} large boxes | ${round(data.paperSpeed, 2)} mm/s`;
  }
  if (annotation.kind === "calibration" || annotation.type === "calibrate") {
    const dx = Math.abs(annotation.end.x - annotation.start.x);
    const dy = Math.abs(annotation.end.y - annotation.start.y);
    const span = dx >= dy ? dx : dy;
    return `${round(span, 1)} px / ${state.calibration.calibrationBoxes} boxes`;
  }

  const data = measurementData(annotation);
  if (annotation.type === "rr") {
    return `${round(data.rate, 0)} bpm | ${round(data.ms, 0)} ms`;
  }
  if (annotation.type === "march") {
    return `${round(data.ms, 0)} ms | ${round(data.rate, 0)} bpm | ${getMarchSteps(annotation)} steps`;
  }
  if (annotation.type === "amplitude") {
    return `${round(data.mv, 2)} mV | ${round(data.dyBoxes, 1)} mm`;
  }
  return `${round(data.ms, data.ms < 100 ? 1 : 0)} ms | ${round(data.dxBoxes, 2)} boxes`;
}

function measurementData(annotation) {
  const dx = Math.abs(annotation.end.x - annotation.start.x);
  const dy = Math.abs(annotation.end.y - annotation.start.y);
  const dxBoxes = dx / state.calibration.pxPerSmallX;
  const dyBoxes = dy / state.calibration.pxPerSmallY;
  const ms = dxBoxes * (1000 / state.calibration.paperSpeed);
  const mv = dyBoxes * (1 / state.calibration.gain);
  const rate = ms > 0 ? 60000 / ms : 0;
  return { dx, dy, dxBoxes, dyBoxes, ms, mv, rate };
}

function timeCalibrationData(annotation) {
  const dx = Math.abs(annotation.end.x - annotation.start.x);
  const settings = timeCalibrationSettings();
  const { knownMs, largeBoxes, smallBoxes, paperSpeed } = settings;
  const pxPerSmallX = smallBoxes > 0 ? dx / smallBoxes : 0;
  const msPerSmallBox = settings.msPerSmallBox;
  return { dx, largeBoxes, smallBoxes, knownMs, pxPerSmallX, msPerSmallBox, paperSpeed };
}

function timeCalibrationSettings() {
  const largeBoxes = getTimeLargeBoxes();
  const smallBoxes = largeBoxes * 5;
  const selectedSpeed = state.calibration.paperSpeed || 25;
  const knownMs = els.timeCalMode.value === "known"
    ? getKnownTimeMs()
    : smallBoxes * (1000 / selectedSpeed);
  const msPerSmallBox = smallBoxes > 0 ? knownMs / smallBoxes : 0;
  const paperSpeed = msPerSmallBox > 0 ? 1000 / msPerSmallBox : selectedSpeed;
  return { largeBoxes, smallBoxes, knownMs, msPerSmallBox, paperSpeed };
}

function getMarchSteps(annotation) {
  const value = annotation && Number.isFinite(annotation.steps)
    ? annotation.steps
    : Number(els.marchSteps.value);
  return clamp(Math.round(value) || 1, 1, 30);
}

function marchPoints(annotation) {
  const steps = getMarchSteps(annotation);
  const vector = {
    x: annotation.end.x - annotation.start.x,
    y: annotation.end.y - annotation.start.y
  };
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const point = {
      x: annotation.start.x + vector.x * index,
      y: annotation.start.y + vector.y * index
    };
    if (
      state.image &&
      (point.x < 0 || point.x > state.image.width || point.y < 0 || point.y > state.image.height)
    ) {
      if (index > 1) break;
    }
    points.push(point);
  }
  return points;
}

function distanceToMarch(annotation, point) {
  const points = marchPoints(annotation);
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length; index += 1) {
    nearest = Math.min(nearest, distance(point, points[index]));
    if (index > 0) {
      nearest = Math.min(nearest, distanceToSegment(point, points[index - 1], points[index]));
    }
  }
  return nearest;
}

function updateMeasurements() {
  const measures = state.annotations.filter((annotation) => annotation.kind === "measure");
  if (!measures.length) {
    els.summary.innerHTML = "<span>No measurements yet.</span>";
    els.measurementList.innerHTML = "";
    return;
  }

  const rrRates = measures
    .filter((annotation) => annotation.type === "rr" || annotation.type === "march")
    .map((annotation) => measurementData(annotation).rate)
    .filter((rate) => Number.isFinite(rate) && rate > 0);
  const avgRate = rrRates.length
    ? `${round(rrRates.reduce((sum, rate) => sum + rate, 0) / rrRates.length, 0)} bpm avg`
    : "No R-R rate";
  els.summary.innerHTML = `
    <span>${measures.length} measurement${measures.length === 1 ? "" : "s"}</span><br>
    <span>${avgRate}</span><br>
    <span>${round(1000 / state.calibration.paperSpeed, 1)} ms per small box, ${round(1 / state.calibration.gain, 3)} mV per small box</span>
  `;
  els.measurementList.innerHTML = measures.map((annotation) => {
    const type = measurementName(annotation);
    return `<li><strong>${type}</strong>: ${labelForAnnotation(annotation)} <button type="button" aria-label="Delete measurement" data-delete-id="${annotation.id}">x</button></li>`;
  }).join("");
}

function measurementName(annotation) {
  if (annotation.type === "rr") return "R-R";
  if (annotation.type === "march") return "March";
  if (annotation.type === "amplitude") return "Amplitude";
  return "Interval";
}

function updateReadout() {
  if (!state.image) return;
  const msPerBox = 1000 / state.calibration.paperSpeed;
  const mvPerBox = 1 / state.calibration.gain;
  els.readout.textContent = `${state.imageName} | ${round(state.view.scale * 100, 0)}% zoom | ${round(msPerBox, 1)} ms/box | ${round(mvPerBox, 3)} mV/box`;
}

function setStatus(message) {
  els.statusText.textContent = message;
}

async function downloadPng() {
  if (!state.image) {
    setStatus("Load an image before exporting.");
    return;
  }
  const report = createReportCanvas();
  const blob = await canvasToBlob(report, "image/png");
  downloadBlob(blob, filenameBase() + "-annotated.png");
}

async function downloadPdf() {
  if (!state.image) {
    setStatus("Load an image before exporting.");
    return;
  }
  const blob = await createPdfBlob();
  downloadBlob(blob, filenameBase() + "-annotated.pdf");
}

async function shareReport() {
  if (!state.image) {
    setStatus("Load an image before sharing.");
    return;
  }
  const blob = await createPdfBlob();
  const file = new File([blob], filenameBase() + "-annotated.pdf", { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Annotated EKG",
        text: "Annotated EKG measurement report.",
        files: [file]
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }
  downloadBlob(blob, file.name);
  const subject = encodeURIComponent("Annotated EKG report");
  const body = encodeURIComponent("The annotated EKG PDF has been downloaded. Attach it to this email before sending.");
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function createReportCanvas() {
  const report = document.createElement("canvas");
  const reportCtx = report.getContext("2d");
  report.width = 1800;
  report.height = 1200;

  reportCtx.fillStyle = "#ffffff";
  reportCtx.fillRect(0, 0, report.width, report.height);

  reportCtx.fillStyle = "#17201c";
  reportCtx.font = "800 34px Inter, Arial, sans-serif";
  reportCtx.fillText("EKG Caliper Studio Report", 48, 62);
  reportCtx.font = "500 18px Inter, Arial, sans-serif";
  reportCtx.fillStyle = "#52605b";
  reportCtx.fillText(`${state.imageName} | ${new Date().toLocaleString()}`, 48, 94);

  const imageSlot = { x: 48, y: 130, width: 1240, height: 980 };
  const panel = { x: 1326, y: 130, width: 426, height: 980 };
  reportCtx.strokeStyle = "#d8dfdc";
  reportCtx.lineWidth = 2;
  reportCtx.strokeRect(imageSlot.x, imageSlot.y, imageSlot.width, imageSlot.height);

  const scale = Math.min(imageSlot.width / state.image.width, imageSlot.height / state.image.height);
  const view = {
    scale,
    offsetX: imageSlot.x + (imageSlot.width - state.image.width * scale) / 2,
    offsetY: imageSlot.y + (imageSlot.height - state.image.height * scale) / 2
  };
  reportCtx.save();
  reportCtx.beginPath();
  reportCtx.rect(imageSlot.x, imageSlot.y, imageSlot.width, imageSlot.height);
  reportCtx.clip();
  renderScene(reportCtx, view, report.width, report.height, {
    includeWorkspaceBackground: false,
    showActive: false
  });
  reportCtx.restore();

  reportCtx.fillStyle = "#eef2f1";
  reportCtx.fillRect(panel.x, panel.y, panel.width, panel.height);
  reportCtx.strokeStyle = "#d8dfdc";
  reportCtx.strokeRect(panel.x, panel.y, panel.width, panel.height);
  reportCtx.fillStyle = "#17201c";
  reportCtx.font = "800 24px Inter, Arial, sans-serif";
  reportCtx.fillText("Measurements", panel.x + 24, panel.y + 42);

  const lines = reportLines();
  reportCtx.font = "500 17px Inter, Arial, sans-serif";
  reportCtx.fillStyle = "#25312d";
  let y = panel.y + 82;
  lines.slice(0, 28).forEach((line) => {
    wrapText(reportCtx, line, panel.x + 24, y, panel.width - 48, 24);
    y += 52;
  });

  reportCtx.fillStyle = "#66716d";
  reportCtx.font = "600 15px Inter, Arial, sans-serif";
  reportCtx.fillText("For education, review, and documentation only. Not a diagnostic medical device.", 48, 1160);
  return report;
}

function reportLines() {
  const lines = [
    `Paper speed: ${round(state.calibration.paperSpeed, 1)} mm/s`,
    `Gain: ${round(state.calibration.gain, 1)} mm/mV`,
    `Time scale: ${round(1000 / state.calibration.paperSpeed, 1)} ms/small box`,
    `Voltage scale: ${round(1 / state.calibration.gain, 3)} mV/small box`
  ];
  const measures = state.annotations.filter((annotation) => annotation.kind === "measure");
  if (!measures.length) {
    lines.push("No caliper measurements recorded.");
    return lines;
  }
  measures.forEach((annotation, index) => {
    const name = measurementName(annotation);
    lines.push(`${index + 1}. ${name}: ${labelForAnnotation(annotation)}`);
  });
  return lines;
}

function wrapText(targetCtx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (targetCtx.measureText(testLine).width > maxWidth && line) {
      targetCtx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line) targetCtx.fillText(line, x, y);
}

async function createPdfBlob() {
  const report = createReportCanvas();
  const jpegDataUrl = report.toDataURL("image/jpeg", 0.9);
  return makeSingleImagePdf(jpegDataUrl, report.width, report.height);
}

function makeSingleImagePdf(dataUrl, imageWidth, imageHeight) {
  const pageWidth = 792;
  const pageHeight = 612;
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;
  const imageBinary = atob(dataUrl.split(",")[1]);
  const commands = `q\n${round(drawWidth, 3)} 0 0 ${round(drawHeight, 3)} ${round(drawX, 3)} ${round(drawY, 3)} cm\n/Im0 Do\nQ\n`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBinary.length} >>\nstream\n${imageBinary}\nendstream`,
    `<< /Length ${commands.length} >>\nstream\n${commands}endstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }
  return new Blob([bytes], { type: "application/pdf" });
}

function canvasToBlob(sourceCanvas, type) {
  return new Promise((resolve) => sourceCanvas.toBlob(resolve, type));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function filenameBase() {
  return (state.imageName || "ekg-strip")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "ekg-strip";
}

function normalizedRect(start, end) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return distance(point, start);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return distance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy
  });
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const bigint = Number.parseInt(value.length === 3
    ? value.split("").map((char) => char + char).join("")
    : value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
