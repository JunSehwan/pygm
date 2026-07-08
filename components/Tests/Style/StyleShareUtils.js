function waitForFonts() {
  if (typeof document === "undefined" || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.catch(() => undefined);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const paragraphs = String(text || "").split("\n");
  const lines = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(" ");
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      const { width } = ctx.measureText(testLine);

      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    if (line) lines.push(line);
    if (!paragraph.trim()) lines.push("");
  });

  lines.slice(0, maxLines).forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
}

export async function createStyleResultShareImage({
  finalType,
  axisSummary = [],
  brandName = "차밍수프",
}) {
  await waitForFonts();

  const width = 1080;
  const height = 1450;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas context 생성 실패");
  }

  ctx.textBaseline = "top";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const bgColor = "#FFF7FB";
  const cardColor = "#FFFFFF";
  const titleColor = "#0F172A";
  const subColor = "#64748B";
  const pointPink = "#EC4899";
  const pointViolet = "#EDE9FE";
  const pointBlue = "#60A5FA";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = pointPink;
  ctx.beginPath();
  ctx.arc(122, 128, 88, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pointViolet;
  ctx.beginPath();
  ctx.arc(912, 148, 94, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(236,72,153,0.9)";
  ctx.font = "700 30px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText(brandName, 56, 92);

  ctx.fillStyle = titleColor;
  ctx.font = "800 68px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText("내 연애스타일 결과", 56, 180);

  ctx.fillStyle = subColor;
  ctx.font = "500 32px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText("16가지 유형 진단테스트", 56, 268);

  roundedRect(ctx, 56, 340, 968, 320, 28);
  ctx.fillStyle = cardColor;
  ctx.fill();

  ctx.fillStyle = pointPink;
  ctx.font = "700 38px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText(finalType.meta.code, 96, 394);

  ctx.fillStyle = titleColor;
  ctx.font = "800 70px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText(finalType.meta.ko, 96, 468);

  ctx.fillStyle = subColor;
  ctx.font = "600 34px Apple SD Gothic Neo, Pretendard, sans-serif";
  drawWrappedText(
    ctx,
    finalType.meta.oneLine || "",
    96,
    560,
    500,
    48,
    2
  );

  const imageSrc = finalType.meta.image?.startsWith("http")
    ? finalType.meta.image
    : finalType.meta.image || "";

  try {
    if (imageSrc) {
      const characterImage = await loadImage(imageSrc);

      const imageBoxX = 704;
      const imageBoxY = 386;
      const imageBoxW = 236;
      const imageBoxH = 236;

      ctx.save();
      roundedRect(ctx, imageBoxX, imageBoxY, imageBoxW, imageBoxH, 24);
      ctx.clip();

      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(imageBoxX, imageBoxY, imageBoxW, imageBoxH);

      const ratio = Math.min(
        imageBoxW / characterImage.width,
        imageBoxH / characterImage.height
      );
      const drawW = characterImage.width * ratio;
      const drawH = characterImage.height * ratio;
      const drawX = imageBoxX + (imageBoxW - drawW) / 2;
      const drawY = imageBoxY + (imageBoxH - drawH) / 2;

      ctx.drawImage(characterImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  } catch (error) {
    console.error("[StyleShareUtils] character image load error:", error);
  }

  roundedRect(ctx, 56, 700, 968, 650, 28);
  ctx.fillStyle = cardColor;
  ctx.fill();

  ctx.fillStyle = titleColor;
  ctx.font = "800 50px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText("성향 밸런스", 88, 752);

  const rows = Array.isArray(axisSummary) ? axisSummary.slice(0, 4) : [];
  const startY = 846;
  const rowGap = 136;

  rows.forEach((item, index) => {
    const y = startY + index * rowGap;
    const leftPercent = Number(item.leftPercent) || 0;
    const rightPercent = Number(item.rightPercent) || 0;

    ctx.fillStyle = titleColor;
    ctx.font = "800 34px Apple SD Gothic Neo, Pretendard, sans-serif";
    ctx.fillText(item.selectedLabel, 96, y);

    const barX = 96;
    const barY = y + 54;
    const barW = 860;
    const barH = 18;

    ctx.fillStyle = "#E2E8F0";
    roundedRect(ctx, barX, barY, barW, barH, 9);
    ctx.fill();

    const leftW = Math.max((barW * leftPercent) / 100, 8);
    const rightW = Math.max((barW * rightPercent) / 100, 8);

    ctx.fillStyle = pointPink;
    roundedRect(ctx, barX, barY, leftW, barH, 9);
    ctx.fill();

    ctx.fillStyle = pointBlue;
    roundedRect(ctx, barX + barW - rightW, barY, rightW, barH, 9);
    ctx.fill();

    ctx.fillStyle = pointPink;
    ctx.font = "700 24px Apple SD Gothic Neo, Pretendard, sans-serif";
    ctx.fillText(`${item.leftLabel} ${leftPercent}%`, 96, y + 88);

    const rightText = `${item.rightLabel} ${rightPercent}%`;
    const rightWidth = ctx.measureText(rightText).width;
    ctx.fillStyle = pointBlue;
    ctx.fillText(rightText, 96 + barW - rightWidth, y + 88);
  });

  ctx.fillStyle = subColor;
  ctx.font = "700 28px Apple SD Gothic Neo, Pretendard, sans-serif";
  ctx.fillText("나도 테스트하기 · charmingsoup.com", 72, 1382);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png", 1)
  );

  if (!blob) {
    throw new Error("이미지 생성 실패");
  }

  const file = new File([blob], `style-result-${finalType.meta.code}.png`, {
    type: "image/png",
  });

  return {
    blob,
    file,
    dataUrl: canvas.toDataURL("image/png", 1),
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("[StyleShareUtils] copyText error:", error);
    return false;
  }
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || "share-image.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openSmsShare({ text, url }) {
  const shareBody = `${text}\n${url}`;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const smsUrl = isIOS
    ? `sms:&body=${encodeURIComponent(shareBody)}`
    : `sms:?body=${encodeURIComponent(shareBody)}`;

  window.location.href = smsUrl;
}

export async function shareWithSystem({ title, text, url, file }) {
  try {
    if (navigator.canShare && file && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        url,
        files: [file],
      });
      return { ok: true };
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return { ok: true };
    }

    return { ok: false };
  } catch (error) {
    console.error("[StyleShareUtils] shareWithSystem error:", error);
    return { ok: false };
  }
}