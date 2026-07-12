let globalImg = null;

document.getElementById('imageLoader')
  .addEventListener('change', function(e) {
    if (!e.target.files) return;
    document.getElementById('codeText').value = '';
    const rdr = new FileReader();
    rdr.onload = function(event) {
      const img = new Image();
      img.onload = function() { 
        globalImg = img;
        processImage(img); 
      }
      img.src = event.target.result;
    }
    rdr.readAsDataURL(e.target.files);
  });

const inputs = ['rowsCount', 'colsCount', 'layersCount'];
inputs.forEach(id => {
  document.getElementById(id)
    .addEventListener('change', function() { runTrigger(); });
});

document.getElementById('codeText')
  .addEventListener('input', function() {
    if (this.value.length > 0) {
      globalImg = null;
      document.getElementById('imageLoader').value = '';
      runTrigger();
    }
  });

function runTrigger() {
  const txt = document.getElementById('codeText').value;
  if (globalImg) {
    processImage(globalImg);
  } else if (txt.length > 0) {
    generateTextAndProcess(txt);
  }
}

function remixCurrent() { runTrigger(); }

function generateTextAndProcess(text) {
  const canvas = document.createElement('canvas');
  // רוחב 650 נותן מקום מושלם לכל 4 הספרות
  canvas.width = 650; canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 650, 300);
  
  const spacedText = text.split('').join(' ');
  ctx.fillStyle = 'black';
  
  // פונט 200px - הגודל המושלם למילוי מקסימלי
  ctx.font = '200px EscapeFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // ציור במרכז המדויק (325 הוא חצי מ-650)
  ctx.fillText(spacedText, 325, 150);
  
  const img = new Image();
  img.onload = function() { processImage(img); };
  img.src = canvas.toDataURL();
}

// החזרת מנגנון הטעינה האוטומטית המקורי והטוב
document.fonts.ready.then(function() {
  runTrigger();
});


// מנגנון טעינה קשיח ומאובטח לפונטים מקומיים
WebFont.load({
  custom: { families: ['EscapeFont'] },
  active: function() { runTrigger(); }
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i]; array[i] = array[j]; array[j] = temp;
  }
  return array;
}

function processImage(uploadedImage) {
  const N = parseInt(document.getElementById('rowsCount').value) || 8;
  const M = parseInt(document.getElementById('colsCount').value) || 4;
  const L = parseInt(document.getElementById('layersCount').value) || 4;
  
  const scale = 1;
  const w = Math.round(uploadedImage.width * scale);
  const h = Math.round(uploadedImage.height * scale);
  const cellW = w / M; const cellH = h / N;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w; srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(uploadedImage, 0, 0, w, h);
  const pixels = srcCtx.getImageData(0, 0, w, h).data;

  const hasContent = Array.from({length: N}, () => 
    Array.from({length: M}, () => false)
  );
  for (let y = 0; y < h; y++) {
    const r = Math.min(N - 1, Math.floor(y / cellH));
    for (let x = 0; x < w; x++) {
      const c = Math.min(M - 1, Math.floor(x / cellW));
      if (pixels[(y * w + x) * 4] < 128) hasContent[r][c] = true;
    }
  }

  const gridMap = Array.from({length: N}, () => Array.from({length: M}, () => 0));
  const counts = Array.from({length: L}, () => 0);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < M; c++) {
      let opts = Array.from({length: L}, (_, i) => i);
      opts.sort((a, b) => counts[a] - counts[b]);
      if (r > 0) opts = opts.filter(i => i !== gridMap[r-1][c]);
      if (c > 0) opts = opts.filter(i => i !== gridMap[r][c-1]);
      if (opts.length > 1 && Math.random() < 0.4) opts = shuffle(opts);
      
      const grp = opts.length === 0 ? Math.floor(Math.random() * L) : opts[0];
      gridMap[r][c] = grp;
      if (hasContent[r][c]) counts[grp]++;
    }
  }

  const grid = document.getElementById('outputGrid');
  grid.innerHTML = '';

  const mHolder = document.createElement('div');
  mHolder.className = 'canvas-container master-container';
  mHolder.innerHTML = '<h3>🔍 Unified Solution Map</h3>';
  const mCvs = document.createElement('canvas');
  mCvs.width = w; mCvs.height = h;
  const mCtx = mCvs.getContext('2d');
  mCtx.fillStyle = 'white'; mCtx.fillRect(0, 0, w, h);
  const mImg = document.createElement('img');
  mImg.className = 'out-img';
  mHolder.appendChild(mCvs); mHolder.appendChild(mImg);
  grid.appendChild(mHolder);

  const canvases = []; const ctxs = []; const outImgs = [];
  for (let i = 0; i < L; i++) {
    const holder = document.createElement('div');
    holder.className = 'canvas-container';
    holder.innerHTML = '<h3>Layer ' + (i+1) + '</h3>';
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, w, h);
    const img = document.createElement('img');
    img.className = 'out-img';
    const hint = document.createElement('div');
    hint.className = 'hint'; hint.innerText = '☝️ Long press to Save';
    holder.appendChild(cvs); holder.appendChild(img);
    holder.appendChild(hint); grid.appendChild(holder);
    canvases.push(cvs); ctxs.push(ctx); outImgs.push(img);
  }

  const targetImgDatas = ctxs.map(ctx => ctx.getImageData(0, 0, w, h));
  const masterImgData = mCtx.getImageData(0, 0, w, h);
  
  const colors = ['#eb4d4b', '#4834d4', '#22a6b3', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#e84393'];
  const rgb = colors.slice(0, L).map(hex => {
    const c = parseInt(hex.slice(1), 16);
    return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 };
  });

  for (let y = 0; y < h; y++) {
    const gRow = Math.min(N - 1, Math.floor(y / cellH));
    const isBorderY = (y < 4 || y > h - 5);
    for (let x = 0; x < w; x++) {
      const gCol = Math.min(M - 1, Math.floor(x / cellW));
      const isBorderX = (x < 4 || x > w - 5);
      const srcIdx = (y * w + x) * 4;
      const isFrame = (isBorderX || isBorderY);

      if (pixels[srcIdx] < 128 || isFrame) {
        const group = gridMap[gRow][gCol];
        const color = rgb[group];
        const tData = targetImgDatas[group].data;
        tData[srcIdx] = 0; tData[srcIdx+1] = 0; tData[srcIdx+2] = 0; tData[srcIdx+3] = 255;
        const mPixels = masterImgData.data;
        mPixels[srcIdx] = color.r; mPixels[srcIdx+1] = color.g; mPixels[srcIdx+2] = color.b; mPixels[srcIdx+3] = 255;
      }
    }
  }

  ctxs.forEach((ctx, idx) => {
    ctx.putImageData(targetImgDatas[idx], 0, 0);
    outImgs[idx].src = canvases[idx].toDataURL();
  });
  mCtx.putImageData(masterImgData, 0, 0);
  mImg.src = mCvs.toDataURL();
}

document.fonts.ready.then(function() {
  runTrigger();
});
