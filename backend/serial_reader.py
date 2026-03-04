"""
serial_reader.py
Lê eventos do Arduino via porta Serial e envia para a API Flask.
"""

import serial
import json
import requests
import threading
import time

# ============================================
# CONFIGURAÇÕES
# ============================================a

PORTA_SERIAL = 'COM4'       # Porta do Arduino
BAUD_RATE    = 9600          # Deve ser igual ao Serial.begin() do Arduino
API_BASE_URL = 'http://localhost:5000/api'

# Mapeamento: estação do Arduino -> posto_id da API
MAPA_ESTACOES = {1: 1, 2: 2, 3: 3}


# ============================================
# FUNÇÕES DE COMUNICAÇÃO COM A API
# ============================================

def registrar_evento_posto(posto_id: int):
    """Envia evento de conclusão de etapa para a API Flask."""
    try:
        resposta = requests.post(
            f'{API_BASE_URL}/sensor/evento',
            json={'posto_id': posto_id, 'tipo_evento': 'passagem'},
            timeout=3
        )
        dados = resposta.json()

        if dados.get('sucesso'):
            print(f'[Serial] ✓ Posto {posto_id} registrado | Produção: {dados.get("producao_atual", {}).get("total_pecas", "?")}')
        else:
            print(f'[Serial] ✗ Posto {posto_id} recusado: {dados.get("mensagem")}')

    except requests.exceptions.ConnectionError:
        print('[Serial] ✗ Flask offline. Verifique se o servidor está rodando.')
    except Exception as e:
        print(f'[Serial] ✗ Erro ao chamar API: {e}')


def processar_mensagem(linha: str):
    """Processa uma linha JSON recebida do Arduino."""
    linha = linha.strip()
    if not linha.startswith('{'):
        return  # Ignora linhas que não são JSON

    try:
        dados = json.loads(linha)
        evento  = dados.get('evento', '')
        estacao = dados.get('estacao', 0)

        if evento == 'sistema_iniciado':
            print('[Serial] Arduino conectado e pronto.')

        elif evento == 'sistema_resetado':
            print('[Serial] Arduino resetado. Aguardando nova peça...')

        elif evento == 'peca_detectada':
            print(f'[Serial] Peça detectada na Estação {estacao}, processando...')

        elif evento == 'peca_removida':
            print(f'[Serial] Peça removida da Estação {estacao} antes de completar.')

        elif evento == 'etapa_concluida':
            posto_id = MAPA_ESTACOES.get(estacao)
            if posto_id:
                print(f'[Serial] Estação {estacao} concluída! Registrando no banco...')
                registrar_evento_posto(posto_id)

    except json.JSONDecodeError:
        pass  # Ignora linhas malformadas silenciosamente


# ============================================
# LOOP PRINCIPAL DE LEITURA SERIAL
# ============================================

def iniciar_leitura_serial():
    """Abre a porta serial e fica lendo em loop."""
    while True:
        try:
            print(f'[Serial] Conectando ao Arduino em {PORTA_SERIAL}...')
            with serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1) as ser:
                print(f'[Serial] Conectado! Aguardando eventos do Arduino...')
                while True:
                    if ser.in_waiting > 0:
                        linha = ser.readline().decode('utf-8', errors='ignore')
                        processar_mensagem(linha)

        except serial.SerialException as e:
            print(f'[Serial] Erro na porta serial: {e}')
            print(f'[Serial] Tentando reconectar em 5 segundos...')
            time.sleep(5)

        except Exception as e:
            print(f'[Serial] Erro inesperado: {e}')
            time.sleep(5)


def iniciar_thread_serial():
    """Inicia a leitura serial em uma thread separada (não bloqueia o Flask)."""
    thread = threading.Thread(target=iniciar_leitura_serial, daemon=True)
    thread.start()
    print('[Serial] Thread de leitura serial iniciada.')
