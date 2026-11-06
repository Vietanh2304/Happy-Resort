// Chụp khoảnh khắc: ghép lại đúng khung cảnh đang thấy (nền, đồ đạc, nhân vật, bong bóng chat, camera)
// lên một canvas, đóng khung kiểu ảnh polaroid có ngày và chú thích, xuất JPEG nhỏ để lưu album.

const OVERLAYS = ['tint', 'room-night', 'cinema-dark', 'bath-ambient', 'rest-ambient', 'cafe-ambient', 'fest-tint'];

function loadImg(url: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = url;
  });
}

function zOf(el: Element): number {
  let e: Element | null = el;
  while (e && !e.classList.contains('stage')) {
    const z = parseInt(getComputedStyle(e).zIndex);
    if (!Number.isNaN(z)) return z;
    e = e.parentElement;
  }
  return 0;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Chụp phần cảnh đang hiện trên màn hình → canvas thô */
export async function captureWorld(): Promise<HTMLCanvasElement> {
  const wrap = document.querySelector('.world .stage-wrap') as HTMLElement | null;
  const stage = wrap?.querySelector('.stage') as HTMLElement | null;
  if (!wrap || !stage) throw new Error('Không tìm thấy khung cảnh để chụp');
  const view = wrap.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  const W = Math.min(720, Math.round(view.width)), k = W / view.width, H = Math.round(view.height * k);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2a1f3a';
  ctx.fillRect(0, 0, W, H);
  const bgUrl = stage.style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
  if (bgUrl) ctx.drawImage(await loadImg(bgUrl), (sr.left - view.left) * k, (sr.top - view.top) * k, sr.width * k, sr.height * k);

  const els = [...stage.querySelectorAll('img, video, div, span')].filter(el => {
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) return true;
    return OVERLAYS.some(c => el.classList.contains(c)) || el.classList.contains('speech') || el.classList.contains('wheel-view');
  });
  const order = els.map((el, i) => ({ el, z: zOf(el), i })).sort((a, b) => a.z - b.z || a.i - b.i);

  for (const { el } of order) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.right < view.left || r.left > view.right || r.bottom < view.top || r.top > view.bottom) continue;
    ctx.save();
    ctx.globalAlpha = Number(cs.opacity) || 1;
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el.classList.contains('wheel-view')) {
      const he = el as HTMLElement;
      const w = he.offsetWidth, h = he.offsetHeight;
      const m = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : new DOMMatrix();
      ctx.translate((r.left + r.width / 2 - view.left) * k, (r.top + r.height / 2 - view.top) * k);
      ctx.scale(k, k);
      ctx.transform(m.a, m.b, m.c, m.d, 0, 0);
      if (cs.filter && cs.filter !== 'none') ctx.filter = cs.filter;
      ctx.imageSmoothingEnabled = el.classList.contains('smooth') || el instanceof HTMLVideoElement;
      try {
        if (el instanceof HTMLImageElement) { if (el.complete && el.naturalWidth) ctx.drawImage(el, -w / 2, -h / 2, w, h); }
        else if (el instanceof HTMLVideoElement) { if (el.videoWidth) ctx.drawImage(el, -w / 2, -h / 2, w, h); }
        else {
          const url = cs.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
          if (url) {
            const im = await loadImg(url);
            const [bw, bh] = cs.backgroundSize.split(' ').map(parseFloat);
            const [bx, by] = cs.backgroundPosition.split(' ').map(parseFloat);
            ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
            ctx.drawImage(im, -w / 2 + bx, -h / 2 + by, bw, bh);
          }
        }
      } catch { /* ảnh chưa tải xong: bỏ qua */ }
    } else if (el.classList.contains('speech')) {
      const x = (r.left - view.left) * k, y = (r.top - view.top) * k, w = r.width * k, h = r.height * k;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3b2d3f'; ctx.lineWidth = 2 * k;
      roundRect(ctx, x, y, w, h, 8 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3b2d3f';
      ctx.font = `${Math.round(parseFloat(cs.fontSize) * k)}px ${cs.fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(el.textContent ?? '', x + w / 2, y + h / 2, w - 6);
    } else {
      // Lớp phủ màu (trời tối, ánh nến...)
      ctx.fillStyle = cs.backgroundColor;
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') ctx.globalCompositeOperation = cs.mixBlendMode as GlobalCompositeOperation;
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ctx.fillRect((r.left - view.left) * k, (r.top - view.top) * k, r.width * k, r.height * k);
    }
    ctx.restore();
  }
  return cv;
}

/** Đóng khung polaroid: viền kem, ngày và chú thích viết tay ở dưới */
export function polaroid(shot: HTMLCanvasElement, caption: string, sub: string): string {
  const pad = 18, bottom = 64;
  const cv = document.createElement('canvas');
  const maxW = 640, k = Math.min(1, maxW / shot.width);
  const w = Math.round(shot.width * k), h = Math.round(shot.height * k);
  cv.width = w + pad * 2; cv.height = h + pad + bottom;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(shot, pad, pad, w, h);
  ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, w, h);
  ctx.fillStyle = '#5a3a4a';
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Quicksand", "Segoe UI", sans-serif';
  ctx.fillText(caption || 'Hai bờ, một khoảnh khắc 💞', cv.width / 2, h + pad + 30, cv.width - 30);
  ctx.fillStyle = '#9a8a8a';
  ctx.font = '14px "Quicksand", "Segoe UI", sans-serif';
  ctx.fillText(sub, cv.width / 2, h + pad + 52, cv.width - 30);
  return cv.toDataURL('image/jpeg', 0.82);
}

/** Tải ảnh về máy (cả ảnh trong kho riêng: tải về blob trước để trình duyệt chịu lưu thành file) */
export async function download(url: string, name: string) {
  let href = url;
  if (!url.startsWith('data:')) href = URL.createObjectURL(await (await fetch(url)).blob());
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  if (href !== url) setTimeout(() => URL.revokeObjectURL(href), 4000);
}
