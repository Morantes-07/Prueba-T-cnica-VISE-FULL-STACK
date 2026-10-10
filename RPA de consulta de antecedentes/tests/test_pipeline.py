import requests

from rpa.client import ServiceClient
from rpa.main import process
from rpa.report import summarize
from tests.test_client import FakeResponse, FakeSession


def make_client(items):
    session = FakeSession(items)
    return ServiceClient("http://x", 1, 0, session=session, sleep=lambda s: None), session


def test_servicio_caido_no_detiene_el_proceso():
    client, session = make_client([requests.ConnectionError("caído")])
    rows, duplicates = process(["1000001", "1000001", "abc", "1000002"], client)

    assert duplicates == 1
    assert len(rows) == 3                                 # 2 válidas únicas + 1 inválida
    assert all(r["estado"] == "error" for r in rows)
    assert session.calls == 4                             # 2 cédulas x (1 intento + 1 reintento)
    assert summarize(rows)["errores"] == 3


def test_datos_invalidos_no_se_consultan():
    client, session = make_client([FakeResponse(200, {"nombres": "A", "antecedentes": False})])
    rows, _ = process(["12", "", "12345678901", "ab12345"], client)

    assert session.calls == 0
    assert len(rows) == 4
    assert all(r["estado"] == "error" and "no se consultó" in r["detalle"] for r in rows)


def test_una_falla_inesperada_no_detiene_a_las_demas():
    class Boom:
        def consultar(self, cedula):
            if cedula == "1000001":
                raise RuntimeError("fallo raro")
            session = FakeSession([FakeResponse(200, {"nombres": "A", "antecedentes": False})])
            return ServiceClient("http://x", 0, 0, session=session).consultar(cedula)

    rows, _ = process(["1000001", "1000002"], Boom())
    assert [r["estado"] for r in rows] == ["error", "limpio"]


def test_resumen_mixto():
    client, _ = make_client([FakeResponse(200, {"nombres": "A", "antecedentes": True}),
                             FakeResponse(404),
                             FakeResponse(200, {"nombres": "B", "antecedentes": False})])
    rows, _ = process(["1000010", "1000009", "1000002"], client)
    assert summarize(rows) == {"total": 3, "limpios": 1, "con antecedentes": 1,
                               "no encontrados": 1, "errores": 0}
