"""
app.py
Backend API Flask - Sistema de Monitoramento Industrial
"""

from flask import Flask
from flask_cors import CORS
import database as db
from routes import api
import serial_reader

# Criar aplicacao Flask
app = Flask(__name__)

# Habilitar CORS para Next.js (porta 3000)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Registrar as rotas da API
app.register_blueprint(api, url_prefix='/api')


# ============================================
# INICIALIZAÇÃO
# ============================================

def inicializar_sistema():
    """
    Inicializa o sistema (banco de dados, configurações).
    """
    print("\n" + "="*50)
    print("SISTEMA DE MONITORAMENTO INDUSTRIAL - API")
    print("="*50 + "\n")
    
    # Inicializar banco de dados
    print("Inicializando banco de dados...")
    db.inicializar_banco()
    
    # Iniciar leitura serial (Arduino) em thread separada
    try:
        serial_reader.iniciar_thread_serial()
    except Exception as e:
        print(f"[Aviso] Leitura serial não iniciada: {e}")
        print("[Aviso] A API funcionará normalmente sem o Arduino.")
    
    print("\nAPI Backend pronta!")
    print("\nAPI rodando em: http://localhost:5000")
    print("Frontend Next.js: http://localhost:3000")
    print("="*50 + "\n")


if __name__ == '__main__':
    # Inicializar sistema
    inicializar_sistema()
    
    # Iniciar servidor Flask (API)
    app.run(
        host='0.0.0.0',
        port=5000,  # API na porta 5000
        debug=True,
        use_reloader=False 
    )
