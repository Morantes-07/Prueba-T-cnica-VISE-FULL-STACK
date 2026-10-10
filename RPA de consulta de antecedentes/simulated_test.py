import responses
import requests
from client_http import ServicioAntecedentes

@responses.activate
def probar_simulacion():
    url_objetivo = "https://apps.procuraduria.gov.co/webcert/inicio.aspx?tpo=2"
    
    # 1. Configuramos nuestro MOCK (Simulador)
    # Le decimos a Python: "Si alguien llama a esta URL, devuelve este JSON inventado y un estado 200"
    responses.add(
        responses.GET,
        url_objetivo,
        json={"estado": "limpio", "detalle": "No registra antecedentes"},
        status=200
    )

    # 2. Usamos nuestra clase (que no sabe que el servidor es falso)
    cliente = ServicioAntecedentes()
    
    try:
        resultado = cliente.consultar_cedula("12345678")
        print("\n¡Éxito! El bot leyó el servicio simulado:")
        print(resultado)
    except Exception as e:
        print(f"\nFalló la consulta: {e}")

if __name__ == "__main__":
    probar_simulacion()