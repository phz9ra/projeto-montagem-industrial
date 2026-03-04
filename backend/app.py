"""
app.py
Aplicacao principal Flask - Sistema de Monitoramento Industrial
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import database as db
from routes import api
from serial_reader import iniciar_thread_serial   # <-- NOVO

# Criar aplicacao Flask
app = Flask(__name__)

# Habilitar CORS para permitir requisicoes do frontend
CORS(app)

# Registrar as rotas da API
app.register_blueprint(api, url_prefix='/api')


# ============================================
# SERVIR ARQUIVOS DO FRONTEND
# ============================================

@app.route('/')
def servir_index():
    frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    return send_from_directory(frontend_path, 'index.html')


@app.route('/<path:filename>')
def servir_arquivos_estaticos(filename):
    frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    return send_from_directory(frontend_path, filename)


# ============================================
# INICIALIZAÇÃO
# ============================================

def inicializar_sistema():
    print("\n" + "="*50)
    print("SISTEMA DE MONITORAMENTO INDUSTRIAL")
    print("="*50 + "\n")

    print("Inicializando banco de dados...")
    db.inicializar_banco()

    print("Iniciando leitura do Arduino (Serial)...")
    iniciar_thread_serial()   # <-- NOVO

    print("\nSistema pronto para uso!")
    print("\nAcesse o sistema em: http://localhost:5000")
    print("="*50 + "\n")


if __name__ == '__main__':
    inicializar_sistema()

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False   # <-- IMPORTANTE: False para a thread serial funcionar corretamente
    )
