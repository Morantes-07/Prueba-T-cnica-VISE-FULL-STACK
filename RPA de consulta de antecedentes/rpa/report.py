"""Generación del reporte Excel y resumen."""
from collections import Counter
from pathlib import Path

import pandas as pd

from rpa.client import ESTADO_CON_ANTECEDENTES, ESTADO_ERROR, ESTADO_LIMPIO, ESTADO_NO_ENCONTRADO

COLUMNS = ["cedula", "nombres", "estado", "detalle", "fecha_consulta"]


def build_report(rows: list[dict], output_path: str) -> pd.DataFrame:
    df = pd.DataFrame(rows, columns=COLUMNS)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(output_path, index=False, engine="openpyxl")
    return df


def summarize(rows: list[dict]) -> dict:
    counts = Counter(r["estado"] for r in rows)
    return {
        "total": len(rows),
        "limpios": counts[ESTADO_LIMPIO],
        "con antecedentes": counts[ESTADO_CON_ANTECEDENTES],
        "no encontrados": counts[ESTADO_NO_ENCONTRADO],
        "errores": counts[ESTADO_ERROR],
    }
