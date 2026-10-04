import { API_BASE_URL } from "../config/api";
import { ApiError, apiRequest } from "./apiClient";

function saveUrl(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

async function renderAccessImage(ticket) {
  const width = 1080;
  const height = 1680;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#08080D";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#11111A";
  roundedRect(ctx, 40, 40, width - 80, height - 80, 36);
  ctx.fill();

  try {
    const photo = await loadImage(ticket.event.image);
    ctx.save();
    roundedRect(ctx, 72, 72, width - 144, 460, 24);
    ctx.clip();
    ctx.drawImage(photo, 72, 72, width - 144, 460);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#151521";
    roundedRect(ctx, 72, 72, width - 144, 460, 24);
    ctx.fill();
  }

  ctx.textBaseline = "top";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 28px Manrope, sans-serif";
  ctx.fillText("MOMNT", 84, 568);
  ctx.fillStyle = "#A7A7B3";
  ctx.font = "500 22px Manrope, sans-serif";
  ctx.fillText("Make It A MOMNT.", 84, 608);
  ctx.fillStyle = "#FF2D8D";
  ctx.font = "700 20px Manrope, sans-serif";
  ctx.fillText("CONFIRMED ACCESS", 84, 668);
  ctx.fillStyle = "#A7A7B3";
  ctx.font = "600 22px Manrope, sans-serif";
  ctx.fillText(ticket.event.number, 84, 720);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 48px Manrope, sans-serif";
  ctx.fillText(ticket.event.title, 84, 760, width - 168);
  ctx.font = "600 26px Manrope, sans-serif";
  ctx.fillText(ticket.event.date.toUpperCase(), 84, 840);
  ctx.font = "500 24px Manrope, sans-serif";
  ctx.fillText(ticket.event.time, 84, 882);
  ctx.fillStyle = "#A7A7B3";
  ctx.fillText(`${ticket.event.location}  ·  Limited Private Experience`, 84, 924);

  ctx.fillStyle = "#FF2D8D";
  ctx.font = "700 18px Manrope, sans-serif";
  ctx.fillText("ACCESS FOR", 84, 1000);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 36px Manrope, sans-serif";
  ctx.fillText(ticket.customer.name, 84, 1030);
  ctx.fillStyle = "#A7A7B3";
  ctx.font = "700 18px Manrope, sans-serif";
  ctx.fillText("PASSES", 84, 1100);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 36px Manrope, sans-serif";
  ctx.fillText(String(ticket.quantity), 84, 1130);
  ctx.fillStyle = "#A7A7B3";
  ctx.font = "700 18px Manrope, sans-serif";
  ctx.fillText("TICKET", 84, 1200);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 32px Manrope, sans-serif";
  ctx.fillText(ticket.ticketId, 84, 1230);

  const qr = document.querySelector('img[alt="MOMNT event access QR code"]');
  if (qr?.complete && qr.naturalWidth > 0) {
    const size = 280;
    const x = width - size - 120;
    const y = 1040;
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, x, y, size, size, 20);
    ctx.fill();
    ctx.drawImage(qr, x + 18, y + 18, size - 36, size - 36);
  }

  ctx.fillStyle = "#A7A7B3";
  ctx.font = "600 22px Manrope, sans-serif";
  ctx.fillText("STATUS  ACTIVE", 84, 1380);
  ctx.font = "500 20px Manrope, sans-serif";
  ctx.fillText("Please keep this access ready for entry.", 84, 1480);
  return canvas.toDataURL("image/png");
}

export async function getTicket(ticketId) {
  try {
    const result = await apiRequest(`/tickets/${encodeURIComponent(ticketId)}`);
    return result.ticket;
  } catch (error) {
    if (error.code === "NETWORK") {
      throw new ApiError("NETWORK", "Unable to load your MOMNT access. Please try again.");
    }
    throw error;
  }
}

export async function getTicketByBooking(bookingId) {
  try {
    const result = await apiRequest(`/bookings/${encodeURIComponent(bookingId)}/ticket`);
    return result.ticket;
  } catch (error) {
    if (error.code === "NETWORK") {
      throw new ApiError("NETWORK", "Unable to load your MOMNT access. Please try again.");
    }
    throw error;
  }
}

export function getTicketValidationPreview(qrToken) {
  return apiRequest(`/tickets/validate/${encodeURIComponent(qrToken)}`);
}

export async function downloadTicket(ticket, filename) {
  const dataUrl = await renderAccessImage(ticket);
  saveUrl(dataUrl, filename);
}

export async function saveAccess(ticket, filename, title) {
  const dataUrl = await renderAccessImage(ticket);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title,
      text: title,
    });
    return "shared";
  }
  saveUrl(dataUrl, filename);
  return "downloaded";
}

export async function downloadQr(ticketId, filename) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}/qr`);
  } catch {
    throw new ApiError("NETWORK", "Unable to load your MOMNT access. Please try again.");
  }
  if (!response.ok) {
    throw new ApiError("TICKET_NOT_FOUND", "Your MOMNT access could not be found.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  saveUrl(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  }
}

export async function shareTicket({ title, text, url }) {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") throw error;
    }
  }
  const copied = await copyText(url);
  if (!copied) return { status: "manual", url };
  return "copied";
}
