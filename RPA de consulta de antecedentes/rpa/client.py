"""Cliente HTTP del servicio de consulta, con reintentos y espera exponencial."""
import logging
import time
from dataclasses import dataclass

import requests

log = logging.getLogger("rpa.client")

ESTADO_LIMPIO = "limpio"
ESTADO_CON_ANTECEDENTES = "con antecedentes"
ESTADO_NO_ENCONTRADO = "no encontrado"
ESTADO_ERROR = "error"


@dataclass
class QueryResult:
    cedula: str
    nombres: str
    estado: str
    detalle: str
    attempts: int = 1


class ServiceClient:
    """Contrato del servicio: GET {base_url}/consulta?cedula=N
    200 {"nombres": str, "antecedentes": bool, "detalle": str?} | 404 no registrada | 5xx/429 transitorio.
    """

    def __init__(self, base_url, max_retries=3, backoff_base=1.0, timeout=10.0,
                 session=None, sleep=time.sleep):
        self.base_url = base_url.rstrip("/")
        self.max_retries = max(0, max_retries)
        self.backoff_base = backoff_base
        self.timeout = timeout
        self.session = session or requests.Session()
        self.sleep = sleep

    def consultar(self, cedula: str) -> QueryResult:
        total = self.max_retries + 1
        last_error = ""

        for attempt in range(1, total + 1):
            try:
                resp = self.session.get(
                    f"{self.base_url}/consulta",
                    params={"cedula": cedula},
                    timeout=self.timeout,
                )
            except (requests.ConnectionError, requests.Timeout) as exc:
                last_error = type(exc).__name__  # el detalle completo no cabe en el reporte
            else:
                if resp.status_code == 200:
                    return self._parse_ok(cedula, resp, attempt)
                if resp.status_code == 404:
                    return QueryResult(cedula, "", ESTADO_NO_ENCONTRADO,
                                       "Cédula no registrada en el servicio", attempt)
                if resp.status_code == 429 or resp.status_code >= 500:
                    last_error = f"HTTP {resp.status_code}"
                else:
                    # Otros 4xx no son transitorios: reintentar no sirve.
                    return QueryResult(cedula, "", ESTADO_ERROR,
                                       f"Respuesta no esperada: HTTP {resp.status_code}", attempt)

            if attempt < total:
                wait = self.backoff_base * 2 ** (attempt - 1)
                log.warning("cedula=%s intento %d/%d falló (%s). Reintentando en %.1fs",
                            cedula, attempt, total, last_error, wait)
                self.sleep(wait)

        return QueryResult(cedula, "", ESTADO_ERROR,
                           f"Servicio no disponible tras {total} intentos: {last_error}", total)

    @staticmethod
    def _parse_ok(cedula, resp, attempt) -> QueryResult:
        try:
            data = resp.json()
            nombres = str(data["nombres"])
            tiene = bool(data["antecedentes"])
            detalle = data.get("detalle")
        except (ValueError, KeyError, TypeError, AttributeError):
            return QueryResult(cedula, "", ESTADO_ERROR,
                               "Respuesta del servicio con formato inválido", attempt)
        if tiene:
            return QueryResult(cedula, nombres, ESTADO_CON_ANTECEDENTES,
                               detalle or "Registra antecedentes", attempt)
        return QueryResult(cedula, nombres, ESTADO_LIMPIO,
                           detalle or "Sin antecedentes registrados", attempt)
