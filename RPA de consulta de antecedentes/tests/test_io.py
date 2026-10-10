import pandas as pd
import pytest

from rpa.reader import InputFileError, read_cedulas
from rpa.report import COLUMNS, build_report


def test_reader_conserva_ceros_y_limpia_espacios(tmp_path):
    path = tmp_path / "c.xlsx"
    pd.DataFrame({"cedula": ["0012345", " 123456 ", None, 7654321]}).to_excel(path, index=False)
    assert read_cedulas(str(path)) == ["0012345", "123456", "", "7654321"]


def test_reader_sin_columna_cedula(tmp_path):
    path = tmp_path / "c.xlsx"
    pd.DataFrame({"documento": ["123456"]}).to_excel(path, index=False)
    with pytest.raises(InputFileError, match="cedula"):
        read_cedulas(str(path))


def test_reader_archivo_inexistente(tmp_path):
    with pytest.raises(InputFileError):
        read_cedulas(str(tmp_path / "nope.xlsx"))


def test_reader_archivo_corrupto(tmp_path):
    path = tmp_path / "c.xlsx"
    path.write_text("esto no es un excel")
    with pytest.raises(InputFileError):
        read_cedulas(str(path))


def test_reporte_tiene_las_columnas_exactas(tmp_path):
    out = tmp_path / "r.xlsx"
    rows = [{"cedula": "0012345", "nombres": "A", "estado": "limpio",
             "detalle": "ok", "fecha_consulta": "2026-10-10T10:00:00"}]
    build_report(rows, str(out))
    df = pd.read_excel(out, dtype=str)
    assert list(df.columns) == COLUMNS
    assert df.loc[0, "cedula"] == "0012345"
