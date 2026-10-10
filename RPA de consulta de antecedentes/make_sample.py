"""Genera un cedulas.xlsx de ejemplo (datos ficticios). Uso: python make_sample.py [ruta]"""
import sys
from pathlib import Path

import pandas as pd

path = Path(sys.argv[1] if len(sys.argv) > 1 else "data/cedulas.xlsx")
path.parent.mkdir(parents=True, exist_ok=True)

cedulas = [
    "1000001",       # limpio
    "1000002",       # limpio
    "1000010",       # con antecedentes
    "1000009",       # no encontrado
    "1000005",       # falla 2 veces y luego responde (reintentos)
    "1000003",       # servicio caído -> error tras agotar reintentos
    "1000001",       # duplicada
    "123",           # inválida: muy corta
    "12345678901",   # inválida: muy larga
    "ABC12345",      # inválida: no numérica
    "",              # inválida: vacía
    "0012345",       # válida con ceros a la izquierda (limpio)
]
pd.DataFrame({"cedula": cedulas}).to_excel(path, index=False)
print(f"Archivo de ejemplo creado: {path}")
