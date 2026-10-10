"""Lectura del Excel de entrada."""
import pandas as pd


class InputFileError(Exception):
    """El archivo de entrada no existe, no se puede leer o no tiene la columna 'cedula'."""


def read_cedulas(path: str) -> list[str]:
    try:
        # dtype=str conserva los ceros a la izquierda.
        df = pd.read_excel(path, dtype=str, engine="openpyxl")
    except FileNotFoundError as exc:
        raise InputFileError(f"No existe el archivo de entrada: {path}") from exc
    except Exception as exc:
        raise InputFileError(f"No se pudo leer el Excel '{path}': {exc}") from exc

    df.columns = [str(c).strip().lower() for c in df.columns]
    if "cedula" not in df.columns:
        raise InputFileError("El archivo no tiene una columna llamada 'cedula'")

    values = df["cedula"].fillna("").astype(str).str.strip()
    # Una celda numérica que llega como "123456.0" se normaliza.
    return [v[:-2] if v.endswith(".0") else v for v in values]
