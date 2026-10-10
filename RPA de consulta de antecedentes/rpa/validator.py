"""Validación y deduplicación de cédulas."""
import re

_PATTERN = re.compile(r"[0-9]{6,10}")


def is_valid_cedula(value: str) -> bool:
    return _PATTERN.fullmatch(value) is not None


def validation_error(value: str) -> str | None:
    """Devuelve el motivo del rechazo, o None si la cédula es válida."""
    if not value:
        return "Cédula vacía"
    if not is_valid_cedula(value):
        return "Cédula inválida: debe tener entre 6 y 10 dígitos numéricos"
    return None


def deduplicate(values: list[str]) -> tuple[list[str], int]:
    """Elimina duplicados conservando el orden. Devuelve (únicas, cantidad_eliminada)."""
    unique = list(dict.fromkeys(values))
    return unique, len(values) - len(unique)
