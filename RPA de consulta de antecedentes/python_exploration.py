import requests

def probar_endpoint():
    url = "https://apps.procuraduria.gov.co/webcert/inicio.aspx?tpo=2"
    
    # Un User-Agent simula que la petición viene de un navegador real
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }

    print(f"Consultando a: {url}...\n")
    
    try:
        # Hacemos una petición GET simple con un timeout de 10 segundos
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        
        print(f"Código de estado: {response.status_code}")
        print(f"Tipo de contenido: {response.headers.get('Content-Type')}\n")
        
        # Imprimimos los primeros 1000 caracteres para ver la estructura
        print("--- Inicio del contenido ---")
        print(response.text[:1000])
        print("--- Fin del contenido ---")
        
    except requests.exceptions.RequestException as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    probar_endpoint()