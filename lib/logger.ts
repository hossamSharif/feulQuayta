import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = { level, message, ...meta };
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
  Sentry.captureMessage(message, level === "error" ? "error" : "info");
}

export function logClientLookup(
  operatorId: string,
  plate: string,
  outcome: "found" | "not_found" | "error"
) {
  log("info", "Client lookup", { operatorId, plate, outcome });
}

export function logFillUp(
  operatorId: string,
  transactionId: string,
  outcome: "success" | "overage" | "error"
) {
  log("info", "Fill-up recorded", { operatorId, transactionId, outcome });
}

export function logOverageRequest(operatorId: string, requestId: string, action: "approved" | "rejected") {
  log("info", "Overage request processed", { operatorId, requestId, action });
}

export function logPayment(operatorId: string, paymentId: string, amount: number, method: string) {
  log("info", "Payment recorded", { operatorId, paymentId, amount, method });
}
