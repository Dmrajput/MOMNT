import { useEffect, useRef, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminChrome } from "../components/AdminLayout";
import ErrorState from "../components/ErrorState";
import { adminQuery, adminRequest } from "../services/adminService";
import { formatTime } from "../utils/adminHelpers";

function guestView(result) {
  const ticket = result?.ticket || {};
  return {
    ticketId: ticket.ticketId,
    customerName: ticket.customerName || ticket.customer?.name || "",
    quantity: ticket.quantity,
    event: ticket.event?.title || ticket.event || "",
    eventDate: ticket.eventDate || ticket.event?.date || "",
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    checkedInByName: ticket.checkedInByName,
  };
}

export default function CheckIn() {
  const { toast, admin } = useAdminAuth();
  const { eventMode, setEventMode } = useAdminChrome();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraNote, setCameraNote] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => () => {
    setEventMode(false);
    stopScanner();
  }, [setEventMode]);

  useEffect(() => {
    adminRequest("/admin/events")
      .then((data) => {
        const rows = data.data || [];
        setEvents(rows);
        const upcoming = rows.find((event) => event.status === "published" && new Date(event.date).getTime() >= Date.now());
        setEventId((current) => current || upcoming?.eventId || rows[0]?.eventId || "");
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!eventId && events.length) return undefined;
    let active = true;
    adminRequest(`/admin/check-in/stats${adminQuery({ eventId })}`)
      .then((data) => {
        if (!active) return;
        setStats(data.stats);
        setRecent(data.recent || []);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [eventId, events.length, result]);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* The camera is already closed. */
      }
    }
    setScanning(false);
  }

  async function startScanner() {
    setCameraNote("");
    setResult(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("momnt-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        (text) => {
          stopScanner();
          lookup({ token: text });
        },
        () => {},
      );
    } catch {
      await stopScanner();
      setCameraNote("Camera access is unavailable. You can enter the ticket manually.");
    }
  }

  async function lookup(body) {
    setBusy(true);
    setResult(null);
    try {
      const data = await adminRequest("/admin/check-in/validate", { method: "POST", body });
      setResult(data);
    } catch {
      setResult({ valid: false, code: "INVALID_QR_TOKEN", message: "Ticket is not valid for entry." });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCheckIn() {
    const view = guestView(result);
    setBusy(true);
    try {
      const data = await adminRequest(`/admin/tickets/${view.ticketId}/check-in`, { method: "POST", body: {} });
      toast("Ticket checked in");
      setResult({
        valid: false,
        code: "CHECKED_IN",
        ticket: { ...data.ticket, checkedInByName: admin?.name },
      });
    } catch (err) {
      if (err.code === "ALREADY_CHECKED_IN" || err.code === "TICKET_ALREADY_CHECKED_IN") {
        setResult({ valid: false, code: "ALREADY_CHECKED_IN", ticket: guestView(result) });
      } else {
        toast(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  const view = result?.ticket ? guestView(result) : null;
  const already = result?.code === "ALREADY_CHECKED_IN";
  const justChecked = result?.code === "CHECKED_IN";
  const selected = events.find((event) => event.eventId === eventId);

  return (
    <div className={eventMode ? "mx-auto max-w-3xl" : ""}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm tracking-[0.18em] text-text-muted">CHECK-IN</p>
          <h1 className="text-3xl font-semibold">
            {stats ? `${stats.checkedInPasses} / ${stats.capacity || stats.passesIssued}` : "—"}
          </h1>
          <p className="text-text-secondary">{stats ? `${stats.checkInRate}% checked in` : "Loading the desk"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-sm text-text-secondary">
            <span className="sr-only">Select Event</span>
            <select aria-label="Select Event" value={eventId} onChange={(event) => setEventId(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-white">
              {events.map((event) => (
                <option key={event.eventId} value={event.eventId}>{event.number}</option>
              ))}
            </select>
          </label>
          <button type="button" className="rounded-xl border border-border px-3 py-2 text-sm" onClick={() => setEventMode(!eventMode)}>
            {eventMode ? "Exit Event Mode" : "Event Mode"}
          </button>
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {selected ? <p className="mb-4 text-sm text-text-muted">{selected.number} · {selected.status}</p> : null}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Capacity", stats?.capacity ?? 0],
          ["Total passes", stats?.passesIssued ?? 0],
          ["Checked-in passes", stats?.checkedInPasses ?? 0],
          ["Remaining", stats?.remaining ?? 0],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={scanning ? stopScanner : startScanner} className="rounded-xl bg-gradient-to-r from-orange to-pink px-5 py-3 text-sm font-semibold">
          {scanning ? "Stop scanner" : "Scan QR"}
        </button>
      </div>
      {cameraNote ? <p className="mt-3 text-sm text-warning">{cameraNote}</p> : null}
      <div id="momnt-qr-reader" className={`mt-4 overflow-hidden rounded-2xl bg-black ${scanning ? "min-h-64" : "hidden"}`} />

      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (ticketId.trim()) lookup({ ticketId: ticketId.trim() });
        }}
      >
        <label className="min-w-[240px] flex-1 text-sm text-text-secondary">
          Enter Ticket ID
          <input value={ticketId} onChange={(event) => setTicketId(event.target.value)} placeholder="MOMNT-01-X7K4P9" className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-3 text-white" />
        </label>
        <button type="submit" disabled={busy} className="self-end rounded-xl border border-border px-4 py-3 text-sm">
          {busy ? "Finding..." : "Find Ticket"}
        </button>
      </form>

      {view && already ? (
        <section className="mt-6 rounded-3xl border border-warning bg-warning/10 p-6" role="alert">
          <h2 className="text-2xl font-semibold text-warning">ALREADY CHECKED IN</h2>
          <p className="mt-3">Customer: {view.customerName}</p>
          <p>Checked in: {formatTime(view.checkedInAt)}</p>
          <p>Checked in by: {view.checkedInByName || "Staff"}</p>
        </section>
      ) : null}

      {view && justChecked ? (
        <section className="mt-6 rounded-3xl border border-success/40 bg-success/10 p-6" role="status">
          <h2 className="text-2xl font-semibold text-success">CHECKED IN</h2>
          <p className="mt-3">{view.customerName}</p>
          <p>Time: {formatTime(view.checkedInAt)}</p>
        </section>
      ) : null}

      {view && result.valid ? (
        <section className="mt-6 rounded-3xl border border-success/40 bg-card p-6">
          <h2 className="text-2xl font-semibold text-success">Valid MOMNT Access</h2>
          <p className="mt-3">Customer: {view.customerName}</p>
          <p>Passes: {view.quantity}</p>
          <p>Event: {view.event}</p>
          <p>Date: {view.eventDate}</p>
          <p>Status: {String(view.status || "ACTIVE").toUpperCase()}</p>
          <button type="button" disabled={busy} onClick={confirmCheckIn} className="mt-5 rounded-xl bg-gradient-to-r from-orange to-pink px-5 py-3 text-sm font-semibold disabled:opacity-60">
            {busy ? "Checking In..." : "Confirm Check-In"}
          </button>
        </section>
      ) : null}

      {result && !result.valid && !already && !justChecked ? (
        <section className="mt-6 rounded-3xl border border-danger/40 bg-danger/10 p-6" role="alert">
          <h2 className="text-2xl font-semibold">INVALID MOMNT ACCESS</h2>
          <p className="mt-2 text-text-secondary">Ticket is not valid for entry.</p>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-sm text-text-secondary">Recent Check-ins</h2>
        {recent.length ? (
          <ol className="space-y-2">
            {recent.map((item, index) => (
              <li key={item.ticketId} className="rounded-xl border border-border px-3 py-3 text-sm">
                {index + 1}. {item.customerName} · {item.quantity} {item.quantity === 1 ? "pass" : "passes"} · {formatTime(item.checkedInAt)}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-text-muted">No check-ins yet.</p>
        )}
      </section>
    </div>
  );
}
