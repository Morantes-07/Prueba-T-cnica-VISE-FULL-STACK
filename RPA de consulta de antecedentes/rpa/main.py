"""CLI del RPA: lee cedulas.xlsx, consulta el servicio y genera el reporte."""
import argparse
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from rpa.client import ESTADO_ERROR, QueryResult, ServiceClient
from rpa.reader import InputFileError, read_cedulas
from rpa.report import build_report, summarize
from rpa.validator import deduplicate, validation_error

log = logging.getLogger("rpa.main")


def _row(result: QueryResult) -> dict:
    return {
        "cedula": result.cedula,
        "nombres": result.nombres,
        "estado": result.estado,
        "detalle": result.detalle,
        "fecha_consulta": datetime.now().isoformat(timespec="seconds"),
    }


def process(raw_cedulas: list[str], client: ServiceClient) -> tuple[list[dict], int]:
    unique, duplicates = deduplicate(raw_cedulas)
    log.info("Entrada: %d filas, %d duplicadas eliminadas, %d únicas a procesar",
             len(raw_cedulas), duplicates, len(unique))

    rows = []
    for cedula in unique:
        motivo = validation_error(cedula)
        if motivo:
            log.warning("cedula=%r descartada: %s (no se consultó)", cedula, motivo)
            rows.append(_row(QueryResult(cedula, "", ESTADO_ERROR, f"{motivo} (no se consultó)", 0)))
            continue

        try:
            result = client.consultar(cedula)
        except Exception as exc:  # una cédula fallida nunca detiene el proceso
            log.exception("cedula=%s error inesperado", cedula)
            result = QueryResult(cedula, "", ESTADO_ERROR, f"Error inesperado: {exc}", 0)

        log.info("cedula=%s estado=%s intentos=%d detalle=%s",
                 result.cedula, result.estado, result.attempts, result.detalle)
        rows.append(_row(result))

    return rows, duplicates


def setup_logging(log_file: str) -> None:
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    for handler in (logging.FileHandler(log_file, encoding="utf-8"), logging.StreamHandler()):
        handler.setFormatter(formatter)
        root.addHandler(handler)


def parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="RPA de consulta de antecedentes (servicio simulado)")
    p.add_argument("--input", default="data/cedulas.xlsx", help="Excel con columna 'cedula'")
    p.add_argument("--output", default="data/reporte_antecedentes.xlsx", help="Excel de salida")
    p.add_argument("--url", default=os.getenv("SERVICE_URL", "http://localhost:8000"),
                   help="URL base del servicio (env SERVICE_URL)")
    p.add_argument("--retries", type=int, default=int(os.getenv("MAX_RETRIES", "3")),
                   help="Reintentos por consulta (env MAX_RETRIES)")
    p.add_argument("--backoff", type=float, default=float(os.getenv("BACKOFF_BASE", "1.0")),
                   help="Base de la espera exponencial en segundos (env BACKOFF_BASE)")
    p.add_argument("--timeout", type=float, default=float(os.getenv("REQUEST_TIMEOUT", "10")),
                   help="Timeout por petición en segundos (env REQUEST_TIMEOUT)")
    p.add_argument("--log-file", default="logs/rpa.log")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    setup_logging(args.log_file)
    log.info("Inicio | input=%s output=%s url=%s retries=%d backoff=%s",
             args.input, args.output, args.url, args.retries, args.backoff)

    try:
        raw = read_cedulas(args.input)
    except InputFileError as exc:
        log.error("%s", exc)
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    client = ServiceClient(args.url, args.retries, args.backoff, args.timeout)
    rows, duplicates = process(raw, client)

    try:
        build_report(rows, args.output)
    except OSError as exc:
        log.error("No se pudo escribir el reporte %s: %s", args.output, exc)
        print(f"ERROR: no se pudo escribir el reporte: {exc}", file=sys.stderr)
        return 1

    summary = summarize(rows)
    log.info("Reporte generado: %s | %s", args.output, summary)
    print("\n===== RESUMEN =====")
    print(f"Duplicadas eliminadas: {duplicates}")
    for label, value in summary.items():
        print(f"{label.capitalize()}: {value}")
    print(f"Reporte: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
