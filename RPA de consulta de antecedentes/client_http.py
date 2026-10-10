import requests
import logging
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

# Configuración básica del log (como lo pide la prueba)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ServicioAntecedentes:
    def __init__(self):
        self.url = "https://apps.procuraduria.gov.co/webcert/inicio.aspx?tpo=2"
        self.headers = {"User-Agent": "Mozilla/5.0"}

    # @retry de Tenacity hace la magia:
    # - wait_exponential: espera 1s, luego 2s, luego 4s, etc. (multiplicador)
    # - stop_after_attempt: se rinde después de 4 intentos
    # - retry_if_exception_type: solo reintenta si hay errores de red, no si la cédula es inválida
    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(4),
        retry=retry_if_exception_type(requests.exceptions.RequestException),
        reraise=True
    )
    def consultar_cedula(self, cedula):
        """Consulta una cédula en el servicio con reintentos automáticos."""
        logging.info(f"Consultando cédula: {cedula}...")
        
        # En una API real enviaríamos un JSON, aquí simulamos pasar la cédula por parámetro
        params = {"cedula": cedula}
        
        # Desactivamos verify=False por si acaso, y ponemos un timeout
        response = requests.get(self.url, headers=self.headers, params=params, timeout=5, verify=False)
        
        # Lanza una excepción si el status_code es 4xx o 5xx (esto activa el @retry)
        response.raise_for_status()
        
        return response.json()