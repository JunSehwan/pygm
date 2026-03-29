export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("[styleShareUtils] copy fail:", error);
    return false;
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
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

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = String(text || "").split("\n");

  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push("");
      return;
    }

    const words = paragraph.split(" ");
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      const width = ctx.measureText(testLine).width;

      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    if (line) lines.push(line);
  });

  return lines;
}

export async function createStyleResultShareImage({
  finalType,
  axisSummary,
  brandName = "차밍수프",
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context 생성 실패");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#fff7fb");
  gradient.addColorStop(0.5, "#fff1f5");
  gradient.addColorStop(1, "#f8fafc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ec4899";
  ctx.beginPath();
  ctx.arc(140, 120, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(59,130,246,0.10)";
  ctx.beginPath();
  ctx.arc(900, 180, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#be185d";
  ctx.font = "700 34px sans-serif";
  ctx.fillText(brandName, 72, 86);

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 68px sans-serif";
  ctx.fillText("내 연애스타일 결과", 72, 190);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 28px sans-serif";
  ctx.fillText("16가지 유형 진단테스트", 72, 236);

  drawRoundedRect(ctx, 72, 290, 936, 320, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#ec4899";
  ctx.font = "800 28px sans-serif";
  ctx.fillText(finalType?.meta?.code || "", 112, 350);

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 72px sans-serif";
  ctx.fillText(finalType?.meta?.ko || "", 112, 445);

  ctx.fillStyle = "#475569";
  ctx.font = "600 30px sans-serif";
  const oneLineLines = wrapText(ctx, finalType?.meta?.oneLine || "", 780);
  oneLineLines.slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, 112, 510 + index * 42);
  });

  drawRoundedRect(ctx, 72, 650, 936, 500, 34);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 40px sans-serif";
  ctx.fillText("성향 밸런스", 112, 720);

  let startY = 790;
  axisSummary.forEach((item) => {
    ctx.fillStyle = "#64748b";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(item.label, 112, startY);

    ctx.fillStyle = "#0f172a";
    ctx.font = "800 28px sans-serif";
    ctx.fillText(item.selectedLabel, 112, startY + 38);

    const barX = 112;
    const barY = startY + 62;
    const barWidth = 856;
    const barHeight = 18;

    drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 9);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();

    const leftWidth = Math.round((barWidth * item.leftPercent) / 100);
    const rightWidth = barWidth - leftWidth;

    drawRoundedRect(ctx, barX, barY, leftWidth, barHeight, 9);
    ctx.fillStyle = "#ec4899";
    ctx.fill();

    drawRoundedRect(ctx, barX + leftWidth, barY, rightWidth, barHeight, 9);
    ctx.fillStyle = "#60a5fa";
    ctx.fill();

    ctx.fillStyle = "#ec4899";
    ctx.font = "700 22px sans-serif";
    ctx.fillText(`${item.leftLabel} ${item.leftPercent}%`, 112, startY + 112);

    ctx.fillStyle = "#3b82f6";
    ctx.font = "700 22px sans-serif";
    const rightText = `${item.rightLabel} ${item.rightPercent}%`;
    const textWidth = ctx.measureText(rightText).width;
    ctx.fillText(rightText, 968 - textWidth, startY + 112);

    startY += 105;
  });

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 24px sans-serif";
  ctx.fillText("나도 테스트하기", 72, 1265);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("이미지 생성 실패"));
        return;
      }

      const file = new File([blob], "style-test-result.png", {
        type: "image/png",
      });

      resolve({ file, blob });
    }, "image/png");
  });
}

export async function shareWithSystem({ title, text, url, file }) {
  if (
    navigator.share &&
    file &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title,
      text,
      url,
      files: [file],
    });
    return { ok: true, mode: "native-file" };
  }

  if (navigator.share) {
    await navigator.share({
      title,
      text,
      url,
    });
    return { ok: true, mode: "native-text" };
  }

  return { ok: false, mode: "fallback" };
}

export function downloadFile(file) {
  const fileUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = file.name || "share-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(fileUrl);
}

export function openFacebookShare({ url }) {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;
  window.open(shareUrl, "_blank", "width=640,height=720");
}

export function openSmsShare({ text, url }) {
  const body = `${text}\n${url}`;
  window.location.href = `sms:?&body=${encodeURIComponent(body)}`;
}