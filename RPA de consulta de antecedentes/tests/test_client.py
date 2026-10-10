import requests

from rpa.client import (ESTADO_CON_ANTECEDENTES, ESTADO_ERROR, ESTADO_LIMPIO,
                        ESTADO_NO_ENCONTRADO, ServiceClient)


class FakeResponse:
    def __init__(self, status, payload=None):
        self.status_code = status
        self._payload = payload

    def json(self):
        if self._payload is None:
            raise ValueError("no es JSON")
        return self._payload


class FakeSession:
    """Devuelve (o lanza) los elementos en orden; el último se repite."""

    def __init__(self, items):
        self.items = items
        self.calls = 0

    def get(self, url, params=None, timeout=None):
        item = self.items[min(self.calls, len(self.items) - 1)]
        self.calls += 1
        if isinstance(item, Exception):
            raise item
        return item


def make_client(items, retries=3, backoff=1.0):
    sleeps = []
    session = FakeSession(items)
    client = ServiceClient("http://x", retries, backoff, session=session, sleep=sleeps.append)
    return client, session, sleeps


def test_limpio():
    client, _, _ = make_client([FakeResponse(200, {"nombres": "A B", "antecedentes": False})])
    r = client.consultar("123456")
    assert (r.estado, r.nombres) == (ESTADO_LIMPIO, "A B")


def test_con_antecedentes():
    client, _, _ = make_client([FakeResponse(200, {"nombres": "A", "antecedentes": True, "detalle": "x"})])
    r = client.consultar("123456")
    assert (r.estado, r.detalle) == (ESTADO_CON_ANTECEDENTES, "x")


def test_404_no_encontrado_sin_reintentos():
    client, session, sleeps = make_client([FakeResponse(404)])
    assert client.consultar("123456").estado == ESTADO_NO_ENCONTRADO
    assert session.calls == 1 and sleeps == []


def test_reintenta_5xx_y_se_recupera_con_espera_exponencial():
    client, session, sleeps = make_client(
        [FakeResponse(503), FakeResponse(503), FakeResponse(200, {"nombres": "A", "antecedentes": False})]
    )
    r = client.consultar("123456")
    assert r.estado == ESTADO_LIMPIO and r.attempts == 3
    assert session.calls == 3
    assert sleeps == [1.0, 2.0]


def test_servicio_caido_agota_reintentos():
    client, session, sleeps = make_client([requests.ConnectionError("caído")], retries=3, backoff=0.5)
    r = client.consultar("123456")
    assert r.estado == ESTADO_ERROR
    assert session.calls == 4            # 1 intento + 3 reintentos
    assert sleeps == [0.5, 1.0, 2.0]     # espera exponencial
    assert "4 intentos" in r.detalle


def test_timeout_se_reintenta():
    client, session, _ = make_client([requests.Timeout("lento")], retries=2)
    assert client.consultar("123456").estado == ESTADO_ERROR
    assert session.calls == 3


def test_4xx_distinto_de_404_no_se_reintenta():
    client, session, _ = make_client([FakeResponse(400)])
    assert client.consultar("123456").estado == ESTADO_ERROR
    assert session.calls == 1


def test_respuesta_con_formato_invalido():
    client, session, _ = make_client([FakeResponse(200, None)])
    r = client.consultar("123456")
    assert r.estado == ESTADO_ERROR and "formato" in r.detalle
    assert session.calls == 1
