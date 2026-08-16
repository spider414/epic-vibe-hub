import { Download, Wallet } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDay, formatTime, SITE } from "@/lib/site";

export type DigitalTicketProps = {
  ticketCode: string;
  serial: number;
  total: number;
  status: string;
  holderName: string;
  orderNumber: string;
  ticketType: string;
  eventTitle: string;
  eventStartsAt: string | null;
  venue: string;
};

/** The QR payload — a namespaced, unguessable ticket identifier used at the door. */
export function qrPayload(ticketCode: string) {
  return `EPIC-TICKET:${ticketCode}`;
}

export function DigitalTicket(props: DigitalTicketProps) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload(props.ticketCode), { margin: 1, width: 512 }).then((url) => {
      if (active) setQr(url);
    });
    return () => {
      active = false;
    };
  }, [props.ticketCode]);

  async function download() {
    if (!qr) return;
    try {
      await downloadTicketPng(props, qr);
    } catch {
      toast.error("Could not generate the image — use your browser's print option instead.");
    }
  }

  return (
    <div className="ticket-shell overflow-hidden rounded-3xl border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
        <div>
          <p className="font-display text-lg leading-none tracking-wide text-primary">
            {SITE.name.toUpperCase()}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Official digital ticket
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {props.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Event</p>
            <p className="font-display text-2xl leading-tight">{props.eventTitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Cell
              label="Date"
              value={
                props.eventStartsAt
                  ? `${formatDay(props.eventStartsAt)} · ${formatTime(props.eventStartsAt)}`
                  : "—"
              }
            />
            <Cell label="Venue" value={props.venue} />
            <Cell label="Name" value={props.holderName} />
            <Cell label="Ticket type" value={props.ticketType} />
            <Cell label="Ticket number" value={`${props.orderNumber}-${props.serial}`} />
            <Cell label="Admits" value={`1 of ${props.total}`} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {qr ? (
            <img
              src={qr}
              alt={`QR code for ticket ${props.orderNumber}-${props.serial}`}
              className="h-40 w-40 rounded-xl bg-white p-2"
            />
          ) : (
            <div className="h-40 w-40 animate-pulse rounded-xl bg-muted" />
          )}
          <p className="max-w-40 break-all text-center font-mono text-[10px] text-muted-foreground">
            {props.ticketCode}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border px-5 py-4">
        <Button size="sm" className="bg-hype text-primary-foreground" onClick={download} disabled={!qr}>
          <Download className="mr-2 h-4 w-4" /> Download ticket
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.info("Apple/Google Wallet passes are coming soon.")}
        >
          <Wallet className="mr-2 h-4 w-4" /> Add to wallet
        </Button>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

async function downloadTicketPng(props: DigitalTicketProps, qrDataUrl: string) {
  const W = 1000;
  const H = 520;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");

  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#c8ff2e";
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = "#c8ff2e";
  ctx.font = "bold 34px Helvetica, Arial, sans-serif";
  ctx.fillText(SITE.name.toUpperCase(), 48, 78);

  ctx.fillStyle = "#8b8b93";
  ctx.font = "16px Helvetica, Arial, sans-serif";
  ctx.fillText("OFFICIAL DIGITAL TICKET", 48, 104);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px Helvetica, Arial, sans-serif";
  ctx.fillText(truncate(props.eventTitle, 26), 48, 170);

  const rows: Array<[string, string]> = [
    [
      "DATE",
      props.eventStartsAt
        ? `${formatDay(props.eventStartsAt)} · ${formatTime(props.eventStartsAt)}`
        : "—",
    ],
    ["VENUE", truncate(props.venue, 34)],
    ["NAME", truncate(props.holderName, 34)],
    ["TICKET TYPE", props.ticketType],
    ["TICKET NUMBER", `${props.orderNumber}-${props.serial}`],
    ["STATUS", props.status.replace("_", " ").toUpperCase()],
  ];
  rows.forEach(([label, value], i) => {
    const x = 48 + (i % 2) * 300;
    const y = 240 + Math.floor(i / 2) * 78;
    ctx.fillStyle = "#8b8b93";
    ctx.font = "14px Helvetica, Arial, sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Helvetica, Arial, sans-serif";
    ctx.fillText(value, x, y + 30);
  });

  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise((resolve, reject) => {
    qrImg.onload = resolve;
    qrImg.onerror = reject;
  });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(700, 150, 250, 250);
  ctx.drawImage(qrImg, 710, 160, 230, 230);
  ctx.fillStyle = "#8b8b93";
  ctx.font = "13px monospace";
  ctx.fillText(props.ticketCode.slice(0, 28), 700, 428);

  const link = document.createElement("a");
  link.download = `${props.orderNumber}-${props.serial}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
