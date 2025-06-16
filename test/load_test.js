import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";

export const options = {
  vus: 1000,
  duration: "30s",
};

export default function () {
  // 1) Hottest‐path: REST endpoint
  let res = http.get("http://localhost:8080/temperature");
  check(res, {
    "is 200": (r) => r.status === 200,
    "is 429": (r) => r.status === 429,
  });

  // 2) WebSocket handshake + one-message check
  let url = "ws://localhost:8080/ws?period=1000";
  let rws = ws.connect(url, null, (socket) => {
    socket.on("open", () => {
      socket.setTimeout(() => socket.close(), 1000);
    });
    socket.on("message", (msg) => {
      // ensure payload looks like JSON with temperature
      check(JSON.parse(msg), {
        hasTemp: (p) => p.temperature !== undefined,
      });
      socket.close();
    });
  });
  check(rws, { "WS status 101": (r) => r && r.status === 101 });

  sleep(1);
}
