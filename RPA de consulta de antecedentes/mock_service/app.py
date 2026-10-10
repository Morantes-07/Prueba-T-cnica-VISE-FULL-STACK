"""Servicio SIMULADO con datos ficticios. Comportamiento según el último dígito de la cédula:
  0 -> con antecedentes | 9 -> no encontrada (404)
  5 -> falla 2 veces con 503 y luego responde bien (prueba de reintentos)
  3 -> siempre 503 (servicio caído para esa cédula) | otro -> limpio
"""
import json
import os
import threading
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

_attempts: dict[str, int] = defaultdict(int)
_lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/health":
            return self._send(200, {"status": "ok"})
        if url.path != "/consulta":
            return self._send(404, {"error": "ruta no encontrada"})

        cedula = parse_qs(url.query).get("cedula", [""])[0]
        if not cedula.isdigit():
            return self._send(400, {"error": "cedula inválida"})

        last = cedula[-1]
        if last == "3":
            return self._send(503, {"error": "servicio no disponible"})
        if last == "5":
            with _lock:
                _attempts[cedula] += 1
                n = _attempts[cedula]
            if n <= 2:
                return self._send(503, {"error": "servicio no disponible"})
        if last == "9":
            return self._send(404, {"error": "cedula no encontrada"})

        data = {"cedula": cedula, "nombres": f"Persona Ficticia {cedula}", "antecedentes": last == "0"}
        if last == "0":
            data["detalle"] = "Registra 1 antecedente (dato ficticio)"
        return self._send(200, data)


if __name__ == "__main__":
    port = int(os.getenv("MOCK_PORT", "8000"))
    print(f"Servicio simulado escuchando en :{port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
