export interface MoodSceneParams {
  w: number;
  h: number;
  t: number;
  motion: number;
  melody: number;
  chord: number;
  mode: 'card' | 'stage';
}

export const SCENE_COLORS = {
  ink: 'rgba(241, 245, 249, 0.88)',
  inkMid: 'rgba(241, 245, 249, 0.56)',
  inkFaint: 'rgba(241, 245, 249, 0.24)',
  accent: 'rgba(141, 164, 255, 0.72)',
  accentFaint: 'rgba(141, 164, 255, 0.28)',
  warm: 'rgba(253, 230, 138, 0.90)',
  catFill: '#050711'
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillStyle: string
): void {
  const inner = r * 0.28;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + inner, cy - inner, cx + r, cy);
  ctx.quadraticCurveTo(cx + inner, cy + inner, cx, cy + r);
  ctx.quadraticCurveTo(cx - inner, cy + inner, cx - r, cy);
  ctx.quadraticCurveTo(cx - inner, cy - inner, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

interface SceneCtx {
  ctx: CanvasRenderingContext2D;
  t: number;
  motion: number;
  melody: number;
  chord: number;
  isStage: boolean;
  lw: number;
}

function drawMidnightScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, chord, isStage, lw } = s;

  if (isStage) {
    // Cafe window frame & muntins
    ctx.strokeStyle = SCENE_COLORS.inkFaint;
    ctx.lineWidth = lw;
    ctx.strokeRect(-102, -94, 204, 94);
    ctx.beginPath();
    ctx.moveTo(0, -94);
    ctx.lineTo(0, 0);
    ctx.moveTo(-102, -60);
    ctx.lineTo(102, -60);
    ctx.stroke();

    // Warm pendant lamp at top-left
    const lampX = -76;
    const lampY = -80;
    const sway = Math.sin(t * 0.65) * 2.2 * motion;
    ctx.strokeStyle = SCENE_COLORS.inkMid;
    ctx.beginPath();
    ctx.moveTo(lampX, -240);
    ctx.lineTo(lampX + sway, lampY);
    ctx.stroke();

    const coneAlpha = 0.06 + chord * 0.05 + melody * 0.07;
    ctx.fillStyle = `rgba(253, 230, 138, ${coneAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(lampX + sway - 8, lampY + 7);
    ctx.lineTo(lampX + sway + 8, lampY + 7);
    ctx.lineTo(lampX + sway + 38, 0);
    ctx.lineTo(lampX + sway - 38, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0d1226';
    ctx.strokeStyle = SCENE_COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(lampX + sway - 10, lampY + 7);
    ctx.quadraticCurveTo(lampX + sway, lampY - 2, lampX + sway + 10, lampY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SCENE_COLORS.warm;
    ctx.fillRect(lampX + sway - 2, lampY + 7, 4, 2);
  }

  // Window sill baseline
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(-112, 0);
  ctx.lineTo(112, 0);
  ctx.stroke();

  // Sleeping black cat
  const catX = -22;
  const breath = Math.sin(t * 1.15) * 1.0 * motion;
  const tailBase = Math.sin(t * 1.1) * 7.5 * motion;
  const tailTip = Math.sin(t * 1.1 - 0.65) * 11 * motion;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = SCENE_COLORS.catFill;
  ctx.lineWidth = lw * 4.4;
  ctx.beginPath();
  ctx.moveTo(catX + 20, -4);
  ctx.quadraticCurveTo(catX + 32 + tailBase * 0.5, 8, catX + 24 + tailTip, 16);
  ctx.stroke();
  ctx.strokeStyle = SCENE_COLORS.accentFaint;
  ctx.lineWidth = lw * 0.9;
  ctx.stroke();
  ctx.restore();

  // Curled cat body
  ctx.fillStyle = SCENE_COLORS.catFill;
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(catX - 26, 0);
  ctx.bezierCurveTo(catX - 26, -26 - breath, catX + 24, -26 - breath, catX + 24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head & reactive ears
  const headX = catX - 14;
  const headY = -14 - breath * 0.4;
  const earTwitch = melody * 2.6 * motion;

  ctx.fillStyle = SCENE_COLORS.catFill;
  ctx.beginPath();
  ctx.arc(headX, headY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left ear
  ctx.beginPath();
  ctx.moveTo(headX - 8, headY - 4.5);
  ctx.lineTo(headX - 7, headY - 16);
  ctx.lineTo(headX - 1.5, headY - 8.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right ear (twitches on melody notes)
  ctx.beginPath();
  ctx.moveTo(headX + 1.5, headY - 8.5);
  ctx.lineTo(headX + 7 + earTwitch * 0.45, headY - 16 - earTwitch * 0.35);
  ctx.lineTo(headX + 8.5, headY - 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (isStage) {
    ctx.strokeStyle = SCENE_COLORS.warm;
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY + 9);
    ctx.lineTo(headX + 6, headY + 9.5);
    ctx.stroke();
  }

  // Closed eye
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw * 0.9;
  ctx.beginPath();
  ctx.arc(headX - 2, headY - 0.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Warm mug (with saucer in stage)
  const mugX = 48;
  if (isStage) {
    ctx.strokeStyle = SCENE_COLORS.inkMid;
    ctx.beginPath();
    ctx.moveTo(mugX - 13, -1);
    ctx.lineTo(mugX + 13, -1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(241, 245, 249, 0.10)';
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.1;
  ctx.fillRect(mugX - 9, -17, 18, 16);
  ctx.strokeRect(mugX - 9, -17, 18, 16);
  ctx.beginPath();
  ctx.arc(mugX + 9, -9, 4.8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Rising steam wisps
  const steamCount = isStage ? 3 : 2;
  for (let i = 0; i < steamCount; i++) {
    const cycle = (t * 0.26 + i / steamCount) % 1;
    const sy = -21 - cycle * 30 * (0.35 + 0.65 * motion);
    const sway = Math.sin(t * 1.9 + i * 2.0) * 3.4 * motion;
    const alpha = motion > 0.05 ? Math.sin(cycle * Math.PI) * 0.65 * motion : 0.22;
    ctx.strokeStyle = `rgba(253, 230, 138, ${alpha.toFixed(3)})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(mugX - 4 + i * 4, sy + 9);
    ctx.quadraticCurveTo(mugX - 4 + i * 4 + sway, sy + 4, mugX - 4 + i * 4 - sway * 0.6, sy);
    ctx.stroke();
  }

  if (isStage) {
    const plateX = 82;
    ctx.strokeStyle = SCENE_COLORS.inkMid;
    ctx.beginPath();
    ctx.moveTo(plateX - 11, -1);
    ctx.lineTo(plateX + 11, -1);
    ctx.stroke();
    ctx.fillStyle = 'rgba(253, 230, 138, 0.16)';
    ctx.strokeStyle = SCENE_COLORS.warm;
    ctx.beginPath();
    ctx.ellipse(plateX, -4.5, 8, 3.2, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawAmberScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, chord, isStage, lw } = s;

  if (isStage) {
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.08)';
    ctx.lineWidth = lw * 0.9;
    for (let i = 0; i < 3; i++) {
      const sy = -82 + i * 26;
      ctx.beginPath();
      ctx.moveTo(-104, sy);
      ctx.lineTo(96, sy);
      ctx.stroke();
    }
  }

  // Desk baseline
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(-112, 0);
  ctx.lineTo(112, 0);
  ctx.stroke();

  // Stacked books on left
  const stackX = -78;
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw;
  ctx.strokeRect(stackX - 20, -9, 40, 9);
  ctx.strokeRect(stackX - 17, -18, 35, 9);
  if (isStage) ctx.strokeRect(stackX - 18, -26, 30, 8);

  const ribSway = Math.sin(t * 1.2) * 1.8 * motion;
  ctx.strokeStyle = SCENE_COLORS.warm;
  ctx.beginPath();
  ctx.moveTo(stackX - 6, -18);
  ctx.quadraticCurveTo(stackX - 6 + ribSway, -6, stackX - 5 + ribSway * 1.3, 4);
  ctx.stroke();

  if (isStage) {
    const cupX = -42;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.10)';
    ctx.strokeStyle = SCENE_COLORS.ink;
    ctx.fillRect(cupX - 6, -11, 12, 11);
    ctx.strokeRect(cupX - 6, -11, 12, 11);
    ctx.beginPath();
    ctx.arc(cupX + 6, -5.5, 3, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // Open book in center
  const bookX = -4;
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(bookX - 28, -2);
  ctx.quadraticCurveTo(bookX - 14, -12, bookX, -2);
  ctx.quadraticCurveTo(bookX + 14, -12, bookX + 28, -2);
  ctx.stroke();

  if (isStage) {
    ctx.strokeStyle = SCENE_COLORS.inkFaint;
    ctx.lineWidth = lw * 0.8;
    for (let row = 0; row < 2; row++) {
      const ly = -5 - row * 2.5;
      ctx.beginPath();
      ctx.moveTo(bookX - 20, ly);
      ctx.lineTo(bookX - 6, ly);
      ctx.moveTo(bookX + 6, ly);
      ctx.lineTo(bookX + 20, ly);
      ctx.stroke();
    }
  }

  // Animated turning page
  const turnCycle = (t * 0.22) % 1;
  const turnProgress = turnCycle < 0.45 ? 0.5 - 0.5 * Math.cos((turnCycle / 0.45) * Math.PI) : 0;
  if (motion > 0.05 && turnProgress > 0.01 && turnProgress < 0.99) {
    const tipX = bookX + Math.cos(turnProgress * Math.PI) * 24 * motion;
    const tipY = -8 - Math.sin(turnProgress * Math.PI) * 14 * motion;
    ctx.strokeStyle = SCENE_COLORS.accent;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(bookX, -2);
    ctx.quadraticCurveTo((bookX + tipX) * 0.5, tipY - 4, tipX, tipY);
    ctx.stroke();
  }

  // Gooseneck desk lamp on right
  const lampX = 68;
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.2;
  ctx.beginPath();
  ctx.moveTo(lampX - 10, 0);
  ctx.lineTo(lampX + 10, 0);
  ctx.moveTo(lampX + 2, 0);
  ctx.bezierCurveTo(lampX + 6, -40, lampX - 5, -54, lampX - 22, -46);
  ctx.stroke();

  const sx = lampX - 23;
  const sy = -45;
  ctx.fillStyle = '#12182b';
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.beginPath();
  ctx.moveTo(sx - 8, sy + 10);
  ctx.lineTo(sx + 2, sy - 4);
  ctx.lineTo(sx + 12, sy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const coneAlpha = 0.08 + 0.04 * Math.sin(t * 1.4) * motion + melody * 0.12 + chord * 0.05;
  ctx.fillStyle = `rgba(253, 230, 138, ${coneAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(sx - 5, sy + 9);
  ctx.lineTo(sx + 9, sy + 6);
  ctx.lineTo(bookX + 28, -2);
  ctx.lineTo(bookX - 14, -2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = SCENE_COLORS.warm;
  ctx.fillRect(sx - 1, sy + 6, 4, 3);
}

function drawSummerScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, isStage, lw } = s;

  if (isStage) {
    // Distant island silhouette & horizon
    ctx.fillStyle = 'rgba(141, 164, 255, 0.14)';
    ctx.strokeStyle = SCENE_COLORS.accentFaint;
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.moveTo(-108, -16);
    ctx.quadraticCurveTo(-76, -32, -46, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = SCENE_COLORS.inkFaint;
    ctx.beginPath();
    ctx.moveTo(-114, -16);
    ctx.lineTo(114, -16);
    ctx.stroke();
  }

  // Back wave
  ctx.strokeStyle = SCENE_COLORS.accent;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let x = -114; x <= 114; x += 6) {
    const y = -8 + Math.sin(x * 0.045 + t * 1.3) * 2.6 * motion;
    if (x === -114) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Sailboat bobbing with follow-through
  const boatX = -16;
  const bobY = Math.sin(t * 1.3 - 0.5) * 3.0 * motion;
  const tilt = Math.cos(t * 1.3 - 0.8) * 0.045 * motion;

  ctx.save();
  ctx.translate(boatX, -4 + bobY);
  ctx.rotate(tilt);

  if (isStage) {
    ctx.strokeStyle = SCENE_COLORS.accentFaint;
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.moveTo(-14, 9);
    ctx.lineTo(14, 9);
    ctx.moveTo(-9, 13);
    ctx.lineTo(9, 13);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(241, 245, 249, 0.14)';
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(-22, -5);
  ctx.lineTo(22, -5);
  ctx.lineTo(15, 4);
  ctx.lineTo(-16, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, -48);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 245, 249, 0.17)';
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.quadraticCurveTo(10, -24, 18, -9);
  ctx.lineTo(0, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = SCENE_COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(-2, -38);
  ctx.lineTo(-15, -9);
  ctx.lineTo(-2, -9);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Front wave(s)
  const frontWaves = isStage ? [4, 14] : [4];
  frontWaves.forEach((wy, idx) => {
    ctx.strokeStyle = idx === 0 ? SCENE_COLORS.inkMid : SCENE_COLORS.accentFaint;
    ctx.lineWidth = lw;
    ctx.beginPath();
    for (let x = -114; x <= 114; x += 6) {
      const y = wy + Math.sin(x * 0.05 + t * (1.55 + idx * 0.25) + 1.4 + idx) * 2.2 * motion;
      if (x === -114) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  // Seagulls
  const gulls = isStage
    ? [
        { x: -64, y: -62, phase: 0.2, scale: 0.95 },
        { x: -38, y: -74, phase: 1.4, scale: 0.78 },
        { x: 58, y: -56, phase: 2.3, scale: 0.88 }
      ]
    : [
        { x: 52, y: -62, phase: 0, scale: 1.0 },
        { x: 78, y: -52, phase: 1.3, scale: 0.78 }
      ];

  ctx.strokeStyle = melody > 0.35 ? SCENE_COLORS.warm : SCENE_COLORS.inkMid;
  ctx.lineWidth = lw;
  gulls.forEach((g) => {
    const flap = Math.sin(t * 2.2 + g.phase) * 3.4 * motion;
    const span = 9 * g.scale;
    ctx.beginPath();
    ctx.moveTo(g.x - span, g.y - flap);
    ctx.quadraticCurveTo(g.x - span * 0.4, g.y - 4.5, g.x, g.y);
    ctx.quadraticCurveTo(g.x + span * 0.4, g.y - 4.5, g.x + span, g.y - flap);
    ctx.stroke();
  });
}

function drawTwilightScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, chord, isStage, lw } = s;
  const seaY = -12;

  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-114, seaY);
  ctx.lineTo(114, seaY);
  ctx.stroke();

  // Headland (plus distant harbor roofs in stage)
  const lhX = -68;
  ctx.fillStyle = '#080b18';
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.beginPath();
  ctx.moveTo(-114, seaY);
  if (isStage) {
    ctx.lineTo(-104, seaY - 9);
    ctx.lineTo(-96, seaY - 6);
    ctx.lineTo(-88, seaY - 12);
  }
  ctx.quadraticCurveTo(lhX, seaY - 18, lhX + 34, seaY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lighthouse tower
  const baseY = seaY - 8;
  const topY = -72;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.16)';
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(lhX - 8, baseY);
  ctx.lineTo(lhX - 4.5, topY + 10);
  ctx.lineTo(lhX + 4.5, topY + 10);
  ctx.lineTo(lhX + 8, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeRect(lhX - 5.5, topY, 11, 10);
  ctx.beginPath();
  ctx.moveTo(lhX - 7, topY);
  ctx.lineTo(lhX, topY - 7);
  ctx.lineTo(lhX + 7, topY);
  ctx.stroke();

  // Beacon beams & warm lantern core
  const glow = 0.55 + 0.35 * Math.sin(t * 1.4) * motion + melody * 0.35 + chord * 0.12;
  const beamAlpha = Math.min(0.24, 0.08 + glow * 0.10);
  ctx.fillStyle = `rgba(253, 230, 138, ${beamAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(lhX + 6, topY + 2);
  ctx.lineTo(lhX + 94, topY - 11);
  ctx.lineTo(lhX + 94, topY + 19);
  ctx.lineTo(lhX + 6, topY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(lhX - 6, topY + 2);
  ctx.lineTo(lhX - 44, topY - 6);
  ctx.lineTo(lhX - 44, topY + 12);
  ctx.lineTo(lhX - 6, topY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(253, 230, 138, ${Math.min(1, glow).toFixed(3)})`;
  ctx.fillRect(lhX - 3, topY + 3, 6, 4.5);

  // Shimmering water reflection bars
  const refX = 36;
  const barCount = isStage ? 6 : 4;
  for (let i = 0; i < barCount; i++) {
    const ry = seaY + 5 + i * (isStage ? 4.8 : 6);
    const halfW = (28 - i * 3.5) + Math.sin(t * 1.6 + i * 1.2) * 4.5 * motion;
    const shiftX = Math.cos(t * 1.2 + i * 0.9) * 3.5 * motion;
    ctx.strokeStyle = i < 2 ? SCENE_COLORS.warm : SCENE_COLORS.accent;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(refX + shiftX - halfW, ry);
    ctx.lineTo(refX + shiftX + halfW, ry);
    ctx.stroke();
  }
}

function drawRainScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, isStage, lw } = s;
  const winL = -98;
  const winR = 98;
  const winT = -82;

  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw * 1.1;
  ctx.strokeRect(winL, winT, winR - winL, -winT);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0, winT);
  ctx.lineTo(0, 0);
  if (isStage) {
    ctx.moveTo(winL, winT * 0.62);
    ctx.lineTo(winR, winT * 0.62);
  }
  ctx.stroke();

  // Rain drops & sill ripples clipped inside glass
  ctx.save();
  ctx.beginPath();
  ctx.rect(winL + 1, winT + 1, winR - winL - 2, -winT - 2);
  ctx.clip();

  const dropOffsets = [-74, -46, -16, 18, 48, 76];
  dropOffsets.forEach((bx, idx) => {
    const cycle = motion > 0.05 ? (t * (0.42 + idx * 0.04) + idx * 0.35) % 1 : (0.28 + idx * 0.14) % 1;
    if (cycle < 0.72) {
      const p = cycle / 0.72;
      const dy = winT + p * (-winT - 6);
      const dx = bx - p * 8;
      ctx.strokeStyle = SCENE_COLORS.accent;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(dx + 2.5, dy - 11);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    } else if (motion > 0.05) {
      const rp = (cycle - 0.72) / 0.28;
      const rx = 4 + rp * 10;
      const alpha = (1 - rp) * 0.65 * motion;
      ctx.strokeStyle = `rgba(141, 164, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.ellipse(bx - 6, -4, rx, 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.restore();

  if (isStage) {
    // Warm glass candle on sill
    const candleX = 28;
    ctx.strokeStyle = SCENE_COLORS.inkMid;
    ctx.lineWidth = lw;
    ctx.strokeRect(candleX - 5, -11, 10, 11);
    const flameH = 4.5 + Math.sin(t * 2.4) * 1.1 * motion + melody * 1.8;
    ctx.fillStyle = SCENE_COLORS.warm;
    ctx.beginPath();
    ctx.moveTo(candleX, -11 - flameH);
    ctx.quadraticCurveTo(candleX + 3, -12, candleX, -11);
    ctx.quadraticCurveTo(candleX - 3, -12, candleX, -11 - flameH);
    ctx.fill();
  }

  // Cute potted sprout on right sill
  const potX = 64;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.14)';
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(potX - 9, -13);
  ctx.lineTo(potX + 9, -13);
  ctx.lineTo(potX + 6.5, 0);
  ctx.lineTo(potX - 6.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const sway = (Math.sin(t * 1.4) * 0.07 + melody * 0.06) * motion;
  ctx.save();
  ctx.translate(potX, -13);
  ctx.rotate(sway);
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.fillStyle = SCENE_COLORS.accent;
  ctx.beginPath();
  ctx.ellipse(-6, -13, 6, 3, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, -14, 6, 3, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMoonMobileScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, isStage, lw } = s;
  const pivotY = -74;

  // Suspension string
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0, isStage ? -240 : -102);
  ctx.lineTo(0, pivotY);
  ctx.stroke();

  const beamAngle = Math.sin(t * 1.05) * 0.06 * motion;
  const lagAngle = Math.sin(t * 1.05 - 0.55) * 0.045 * motion;

  ctx.save();
  ctx.translate(0, pivotY);
  ctx.rotate(beamAngle);

  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(-54, 0);
  ctx.lineTo(54, 0);
  ctx.stroke();

  // Left: Crescent moon charm
  ctx.save();
  ctx.translate(-46, 0);
  ctx.rotate(lagAngle);
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 28);
  ctx.stroke();

  ctx.fillStyle = SCENE_COLORS.warm;
  ctx.beginPath();
  ctx.arc(0, 40, 12.5, -Math.PI * 0.42, Math.PI * 0.42, true);
  ctx.arc(6.5, 40, 10.5, Math.PI * 0.36, -Math.PI * 0.36, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right: Star charms
  const stars = isStage
    ? [
        { x: 18, len: 22, r: 6.5, phase: 0 },
        { x: 40, len: 42, r: 8.5, phase: 1.3 },
        { x: 54, len: 18, r: 5.5, phase: 2.4 }
      ]
    : [
        { x: 20, len: 20, r: 6.5, phase: 0 },
        { x: 46, len: 38, r: 8.5, phase: 1.4 }
      ];

  stars.forEach((st) => {
    ctx.save();
    ctx.translate(st.x, 0);
    ctx.rotate(lagAngle * 1.1);
    ctx.strokeStyle = SCENE_COLORS.inkFaint;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, st.len);
    ctx.stroke();

    const twinkle = 0.65 + 0.30 * Math.sin(t * 1.8 + st.phase) * motion + melody * 0.25;
    drawFourPointStar(
      ctx,
      0,
      st.len + st.r,
      st.r,
      `rgba(241, 245, 249, ${Math.min(1, twinkle).toFixed(3)})`
    );
    ctx.restore();
  });

  ctx.restore();

  // Sill line (with small flower vase in stage)
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.14)';
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-92, 0);
  ctx.lineTo(92, 0);
  ctx.stroke();

  if (isStage) {
    const vaseX = 64;
    ctx.fillStyle = 'rgba(141, 164, 255, 0.12)';
    ctx.strokeStyle = SCENE_COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(vaseX - 4, -14);
    ctx.lineTo(vaseX + 4, -14);
    ctx.lineTo(vaseX + 7, 0);
    ctx.lineTo(vaseX - 7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = SCENE_COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(vaseX, -14);
    ctx.quadraticCurveTo(vaseX + 2, -22, vaseX + 3, -27);
    ctx.stroke();
    drawFourPointStar(ctx, vaseX + 3, -28, 3, SCENE_COLORS.warm);
  }
}

function drawObsidianScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, isStage, lw } = s;
  const topY = -74;
  const midY = -37;
  const hgX = -14;

  if (isStage) {
    // Quiet background pendulum on the left
    const pendX = -74;
    const pendAngle = Math.sin(t * 1.0) * 0.12 * motion;
    ctx.save();
    ctx.translate(pendX, -86);
    ctx.rotate(pendAngle);
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.16)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 56);
    ctx.stroke();
    ctx.fillStyle = 'rgba(141, 164, 255, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 56, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Desk baseline
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-102, 0);
  ctx.lineTo(102, 0);
  ctx.stroke();

  // Hourglass frame
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.4;
  ctx.beginPath();
  ctx.moveTo(hgX - 22, topY);
  ctx.lineTo(hgX + 22, topY);
  ctx.moveTo(hgX - 22, 0);
  ctx.lineTo(hgX + 22, 0);
  ctx.stroke();

  ctx.strokeStyle = SCENE_COLORS.accentFaint;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(hgX - 17, topY);
  ctx.lineTo(hgX - 17, 0);
  ctx.moveTo(hgX + 17, topY);
  ctx.lineTo(hgX + 17, 0);
  ctx.stroke();

  // Glass bulbs
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw * 1.1;
  ctx.beginPath();
  ctx.moveTo(hgX - 14, topY + 2);
  ctx.bezierCurveTo(hgX - 14, midY - 10, hgX - 2.5, midY - 5, hgX - 2.5, midY);
  ctx.bezierCurveTo(hgX - 2.5, midY + 5, hgX - 14, midY + 10, hgX - 14, -2);
  ctx.moveTo(hgX + 14, topY + 2);
  ctx.bezierCurveTo(hgX + 14, midY - 10, hgX + 2.5, midY - 5, hgX + 2.5, midY);
  ctx.bezierCurveTo(hgX + 2.5, midY + 5, hgX + 14, midY + 10, hgX + 14, -2);
  ctx.stroke();

  // Upper & lower sand pools
  ctx.fillStyle = 'rgba(253, 230, 138, 0.45)';
  ctx.beginPath();
  ctx.moveTo(hgX - 10, topY + 14);
  ctx.lineTo(hgX + 10, topY + 14);
  ctx.lineTo(hgX, midY - 3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(hgX - 12, -1);
  ctx.lineTo(hgX, -17);
  ctx.lineTo(hgX + 12, -1);
  ctx.closePath();
  ctx.fill();

  // Falling sand grains
  if (motion > 0.05) {
    ctx.fillStyle = SCENE_COLORS.warm;
    const count = isStage ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const p = (t * 0.75 + i / count) % 1;
      const gy = midY + 2 + p * (-17 - midY);
      ctx.fillRect(hgX - 0.8, gy, 1.6, 2.2);
    }
  }
  if (motion > 0.05 || melody > 0.02) {
    drawFourPointStar(ctx, hgX, -17.5, 2.6 + melody * 2.4, SCENE_COLORS.warm);
  }

  // Resting pen (plus notebook in stage)
  const penX = 48;
  ctx.strokeStyle = SCENE_COLORS.inkMid;
  ctx.lineWidth = lw;
  if (isStage) {
    ctx.strokeRect(penX - 16, -7, 38, 7);
    ctx.beginPath();
    ctx.moveTo(penX + 3, -7);
    ctx.lineTo(penX + 3, 0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(penX - 12, -8);
  ctx.lineTo(penX + 18, -8);
  ctx.lineTo(penX + 26, -10.5);
  ctx.lineTo(penX + 18, -13);
  ctx.lineTo(penX - 12, -13);
  ctx.closePath();
  ctx.stroke();
}

function drawNightTrainScene(s: SceneCtx): void {
  const { ctx, t, motion, melody, chord, isStage, lw } = s;
  const joltY = Math.pow(Math.max(0, Math.sin(t * 0.9)), 20) * 2.0 * motion;

  ctx.save();
  ctx.translate(0, joltY);

  const winX = -96;
  const winY = -82;
  const winW = 192;
  const winH = 74;

  ctx.save();
  ctx.beginPath();
  ctx.rect(winX, winY, winW, winH);
  ctx.clip();

  // Drifting constellation
  const skyLoop = winW + 90;
  const skyShift = motion > 0.05 ? (t * 8.5) % skyLoop : 0;
  const constellation = [
    { x: 24, y: winY + 26 },
    { x: 58, y: winY + 17 },
    { x: 92, y: winY + 34 },
    { x: 128, y: winY + 20 },
    { x: 158, y: winY + 38 }
  ];

  [0, skyLoop].forEach((offset) => {
    ctx.strokeStyle = SCENE_COLORS.accentFaint;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    constellation.forEach((pt, idx) => {
      const px = winX + winW + 30 - ((skyShift + offset - pt.x + skyLoop) % skyLoop);
      if (idx === 0) ctx.moveTo(px, pt.y);
      else ctx.lineTo(px, pt.y);
    });
    ctx.stroke();

    constellation.forEach((pt, idx) => {
      const px = winX + winW + 30 - ((skyShift + offset - pt.x + skyLoop) % skyLoop);
      const twinkle = 0.65 + 0.30 * Math.sin(t * 2 + idx) * motion + melody * 0.25;
      drawFourPointStar(
        ctx,
        px,
        pt.y,
        idx % 2 === 1 ? 3.8 : 2.6,
        `rgba(253, 230, 138, ${Math.min(1, twinkle).toFixed(3)})`
      );
    });
  });

  // Distant passing town lights
  const townLoop = winW + 76;
  const townShift = motion > 0.05 ? (t * 22) % townLoop : 0;
  const townBaseY = winY + winH;
  const buildings = [
    { x: 16, bw: 16, bh: 16 },
    { x: 38, bw: 22, bh: 11 },
    { x: 76, bw: 15, bh: 21 },
    { x: 118, bw: 26, bh: 13 },
    { x: 164, bw: 16, bh: 18 }
  ];

  buildings.forEach((b, idx) => {
    const bx = winX + winW - ((townShift - b.x + townLoop) % townLoop);
    ctx.fillStyle = '#060918';
    ctx.fillRect(bx, townBaseY - b.bh, b.bw, b.bh);
    ctx.fillStyle = idx % 2 === 0 ? SCENE_COLORS.warm : SCENE_COLORS.accent;
    ctx.fillRect(bx + 4, townBaseY - b.bh + 4, 2.5, 2.5);
  });

  // Left curtain drape (plus right drape in stage)
  ctx.fillStyle = 'rgba(141, 164, 255, 0.20)';
  ctx.beginPath();
  ctx.moveTo(winX, winY);
  ctx.lineTo(winX + 22, winY);
  ctx.quadraticCurveTo(winX + 10, winY + winH * 0.5, winX + 18, winY + winH);
  ctx.lineTo(winX, winY + winH);
  ctx.closePath();
  ctx.fill();

  if (isStage) {
    ctx.beginPath();
    ctx.moveTo(winX + winW, winY);
    ctx.lineTo(winX + winW - 18, winY);
    ctx.quadraticCurveTo(winX + winW - 8, winY + winH * 0.5, winX + winW - 14, winY + winH);
    ctx.lineTo(winX + winW, winY + winH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Outer & inner window frame
  ctx.strokeStyle = SCENE_COLORS.ink;
  ctx.lineWidth = lw * 1.2;
  ctx.strokeRect(winX, winY, winW, winH);
  ctx.strokeStyle = SCENE_COLORS.inkFaint;
  ctx.lineWidth = lw * 0.9;
  ctx.strokeRect(winX + 3.5, winY + 3.5, winW - 7, winH - 7);

  if (isStage) {
    const lampX = winX + winW - 22;
    const sillY = winY + winH;
    ctx.fillStyle = `rgba(253, 230, 138, ${(0.10 + chord * 0.06 + melody * 0.08).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lampX, sillY - 12, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SCENE_COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(lampX - 3.5, sillY);
    ctx.lineTo(lampX + 3.5, sillY);
    ctx.moveTo(lampX, sillY);
    ctx.lineTo(lampX, sillY - 8);
    ctx.stroke();
    ctx.fillStyle = SCENE_COLORS.warm;
    ctx.beginPath();
    ctx.moveTo(lampX - 5, sillY - 8);
    ctx.lineTo(lampX - 3, sillY - 15);
    ctx.lineTo(lampX + 3, sillY - 15);
    ctx.lineTo(lampX + 5, sillY - 8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders the shared mood vignette for both small card thumbnails ('card')
 * and the wide main visualizer ('stage') from a single canonical scene source.
 */
export function renderMoodScene(
  ctx: CanvasRenderingContext2D,
  vibeId: string,
  params: MoodSceneParams
): void {
  const { w, h, t, motion, melody, chord, mode } = params;
  const isStage = mode === 'stage';

  let scale: number;
  let originX: number;
  let originY: number;

  if (isStage) {
    const availW = w < 520 ? w * 0.86 : w * 0.72;
    const availH = Math.max(80, h - 82);
    scale = Math.min(availW / 260, availH / 112);
    originX = w < 520 ? w * 0.48 : w * 0.44;
    originY = h - 62;
  } else {
    scale = Math.min(w / 260, h / 116);
    originX = w * 0.5;
    originY = h * 0.80;
  }

  const lw = (isStage ? 1.25 : 0.95) / Math.max(0.25, scale);

  ctx.save();
  ctx.translate(originX, originY);
  ctx.scale(scale, scale);

  const sceneCtx: SceneCtx = { ctx, t, motion, melody, chord, isStage, lw };

  switch (vibeId) {
    case 'midnight-tokyo':
      drawMidnightScene(sceneCtx);
      break;
    case 'amber-cafe':
      drawAmberScene(sceneCtx);
      break;
    case 'mossy-dawn':
      drawSummerScene(sceneCtx);
      break;
    case 'sunset-terrace':
      drawTwilightScene(sceneCtx);
      break;
    case 'cyber-rain':
      drawRainScene(sceneCtx);
      break;
    case 'sakura-dust':
      drawMoonMobileScene(sceneCtx);
      break;
    case 'monolith-focus':
      drawObsidianScene(sceneCtx);
      break;
    case 'starlight-drift':
    default:
      drawNightTrainScene(sceneCtx);
      break;
  }

  ctx.restore();
}
