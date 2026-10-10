import pytest

from rpa.validator import deduplicate, is_valid_cedula, validation_error


@pytest.mark.parametrize("value", ["123456", "1234567890", "0012345"])
def test_valid_cedulas(value):
    assert is_valid_cedula(value)
    assert validation_error(value) is None


@pytest.mark.parametrize(
    "value",
    ["", "12345", "12345678901", "12a456", "12 3456", "-123456", "123.456", "123456\n", "١٢٣٤٥٦"],
)
def test_invalid_cedulas(value):
    assert not is_valid_cedula(value)
    assert validation_error(value)


def test_empty_has_specific_message():
    assert validation_error("") == "Cédula vacía"


def test_deduplicate_keeps_order_and_counts():
    unique, removed = deduplicate(["2", "1", "2", "3", "1"])
    assert unique == ["2", "1", "3"]
    assert removed == 2
