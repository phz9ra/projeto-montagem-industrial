"""
routes.py
Definição das rotas (endpoints) da API REST
Sistema de Monitoramento Industrial
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import database as db

# Criar blueprint para as rotas
api = Blueprint('api', __name__)


# ============================================
# ENDPOINTS DE TURNO
# ============================================

@api.route('/turno/iniciar', methods=['POST'])
def iniciar_turno():
    """
    Inicia um novo turno de produção.
    
    Body (JSON):
        {
            "meta_producao": 100  (opcional, padrão: 100)
        }
    
    Returns:
        JSON com dados do turno criado
    """
    try:
        # Verificar se já existe turno ativo
        turno_ativo = db.obter_turno_ativo()
        if turno_ativo and turno_ativo['status'] == 'ativo':
            return jsonify({
                'sucesso': False,
                'mensagem': 'Já existe um turno ativo. Finalize-o antes de iniciar um novo.',
                'turno_ativo': turno_ativo
            }), 400
        
        # Obter meta do corpo da requisição
        dados = request.get_json() or {}
        meta_producao = dados.get('meta_producao', 100)
        
        # Validar meta
        if not isinstance(meta_producao, int) or meta_producao <= 0:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Meta de produção deve ser um número inteiro positivo'
            }), 400
        
        # Criar novo turno
        turno_id = db.criar_turno(meta_producao)
        turno = db.obter_turno_ativo()
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Turno iniciado com sucesso',
            'turno': turno
        }), 201
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao iniciar turno: {str(e)}'
        }), 500


@api.route('/turno/pausar', methods=['POST'])
def pausar_turno():
    """
    Pausa o turno ativo.
    
    Returns:
        JSON com status da operação
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo encontrado'
            }), 404
        
        if turno_ativo['status'] == 'pausado':
            return jsonify({
                'sucesso': False,
                'mensagem': 'O turno já está pausado'
            }), 400
        
        db.pausar_turno(turno_ativo['id'])
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Turno pausado com sucesso',
            'turno_id': turno_ativo['id']
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao pausar turno: {str(e)}'
        }), 500


@api.route('/turno/retomar', methods=['POST'])
def retomar_turno():
    """
    Retoma um turno pausado.
    
    Returns:
        JSON com status da operação
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno encontrado'
            }), 404
        
        if turno_ativo['status'] != 'pausado':
            return jsonify({
                'sucesso': False,
                'mensagem': 'O turno não está pausado'
            }), 400
        
        db.retomar_turno(turno_ativo['id'])
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Turno retomado com sucesso',
            'turno_id': turno_ativo['id']
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao retomar turno: {str(e)}'
        }), 500


@api.route('/turno/finalizar', methods=['POST'])
def finalizar_turno():
    """
    Finaliza o turno ativo.
    
    Returns:
        JSON com dados finais do turno
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo encontrado'
            }), 404
        
        # Finalizar e obter dados
        turno_final = db.finalizar_turno(turno_ativo['id'])
        estatisticas = db.obter_estatisticas_producao(turno_ativo['id'])
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Turno finalizado com sucesso',
            'turno': turno_final,
            'estatisticas': estatisticas
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao finalizar turno: {str(e)}'
        }), 500


# ============================================
# ENDPOINTS DE SENSOR
# ============================================

@api.route('/sensor/evento', methods=['POST'])
def registrar_evento_sensor():
    """
    Registra um evento de sensor (passagem por posto).
    
    Body (JSON):
        {
            "posto_id": 1,  (1, 2 ou 3)
            "tipo_evento": "passagem"  (opcional)
        }
    
    Returns:
        JSON com confirmação do registro
    """
    try:
        # Validar corpo da requisição
        dados = request.get_json()
        if not dados:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Corpo da requisição vazio'
            }), 400
        
        posto_id = dados.get('posto_id')
        tipo_evento = dados.get('tipo_evento', 'passagem')
        
        # Validar posto_id
        if posto_id not in [1, 2, 3]:
            return jsonify({
                'sucesso': False,
                'mensagem': 'posto_id deve ser 1, 2 ou 3'
            }), 400
        
        # Verificar se há turno ativo
        turno_ativo = db.obter_turno_ativo()
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo. Inicie um turno primeiro.'
            }), 400
        
        # Verificar se o turno está pausado
        if turno_ativo['status'] == 'pausado':
            return jsonify({
                'sucesso': False,
                'mensagem': 'O turno está pausado. Retome o turno para registrar eventos.'
            }), 400
        
        # Validar sequência de postos
        ultimo_posto = db.obter_ultimo_evento_posto(turno_ativo['id'])
        
        # Regra: deve seguir a sequência (0 -> 1 -> 2 -> 3 -> 1 -> 2 -> 3...)
        if ultimo_posto == 0:  # Primeiro evento do turno
            if posto_id != 1:
                return jsonify({
                    'sucesso': False,
                    'mensagem': 'A produção deve iniciar pelo Posto 1'
                }), 400
        else:
            # Verificar sequência correta
            proximo_esperado = (ultimo_posto % 3) + 1
            if posto_id != proximo_esperado:
                return jsonify({
                    'sucesso': False,
                    'mensagem': f'Sequência incorreta. Próximo posto esperado: {proximo_esperado}',
                    'ultimo_posto': ultimo_posto
                }), 400
        
        # Registrar evento
        evento_id = db.registrar_evento(turno_ativo['id'], posto_id, tipo_evento)
        
        # Obter produção atualizada
        producao_atual = db.obter_producao_atual()
        
        # Verificar se incrementou produção (posto 3)
        incrementou = posto_id == 3
        
        return jsonify({
            'sucesso': True,
            'mensagem': f'Evento registrado no Posto {posto_id}',
            'evento_id': evento_id,
            'incrementou_producao': incrementou,
            'producao_atual': producao_atual
        }), 201
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao registrar evento: {str(e)}'
        }), 500


# ============================================
# ENDPOINTS DE PRODUÇÃO E META
# ============================================

@api.route('/producao/atual', methods=['GET'])
def obter_producao():
    """
    Retorna dados da produção atual.
    
    Returns:
        JSON com dados de produção do turno ativo
    """
    try:
        producao = db.obter_producao_atual()
        
        if not producao:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo no momento',
                'producao': None
            }), 200
        
        return jsonify({
            'sucesso': True,
            'producao': producao
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao obter produção: {str(e)}'
        }), 500


@api.route('/meta', methods=['GET'])
def obter_meta():
    """
    Retorna a meta do turno ativo.
    
    Returns:
        JSON com a meta atual
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo',
                'meta': None
            }), 200
        
        return jsonify({
            'sucesso': True,
            'meta': turno_ativo['meta_producao'],
            'turno_id': turno_ativo['id']
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao obter meta: {str(e)}'
        }), 500


@api.route('/meta', methods=['POST'])
def atualizar_meta():
    """
    Atualiza a meta do turno ativo.
    
    Body (JSON):
        {
            "meta": 150
        }
    
    Returns:
        JSON com confirmação
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo para atualizar meta'
            }), 404
        
        # Obter nova meta
        dados = request.get_json()
        if not dados or 'meta' not in dados:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Campo "meta" é obrigatório'
            }), 400
        
        nova_meta = dados['meta']
        
        # Validar meta
        if not isinstance(nova_meta, int) or nova_meta <= 0:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Meta deve ser um número inteiro positivo'
            }), 400
        
        # Atualizar meta
        db.atualizar_meta_turno(turno_ativo['id'], nova_meta)
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Meta atualizada com sucesso',
            'meta_anterior': turno_ativo['meta_producao'],
            'meta_nova': nova_meta
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao atualizar meta: {str(e)}'
        }), 500


# ============================================
# ENDPOINTS DE CONSULTA E HISTÓRICO
# ============================================

@api.route('/estatisticas', methods=['GET'])
def obter_estatisticas():
    """
    Retorna estatísticas detalhadas do turno ativo.
    
    Returns:
        JSON com estatísticas completas
    """
    try:
        turno_ativo = db.obter_turno_ativo()
        
        if not turno_ativo:
            return jsonify({
                'sucesso': False,
                'mensagem': 'Nenhum turno ativo'
            }), 404
        
        estatisticas = db.obter_estatisticas_producao(turno_ativo['id'])
        
        return jsonify({
            'sucesso': True,
            'estatisticas': estatisticas
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao obter estatísticas: {str(e)}'
        }), 500


@api.route('/historico', methods=['GET'])
def obter_historico():
    """
    Retorna histórico de turnos finalizados.
    
    Query params:
        limite: número de registros (padrão: 10)
    
    Returns:
        JSON com lista de turnos
    """
    try:
        limite = request.args.get('limite', 10, type=int)
        historico = db.listar_historico_turnos(limite)
        
        return jsonify({
            'sucesso': True,
            'total': len(historico),
            'historico': historico
        }), 200
        
    except Exception as e:
        return jsonify({
            'sucesso': False,
            'mensagem': f'Erro ao obter histórico: {str(e)}'
        }), 500


# ============================================
# ENDPOINT DE SAÚDE (HEALTH CHECK)
# ============================================

@api.route('/health', methods=['GET'])
def health_check():
    """
    Verifica se a API está funcionando.
    
    Returns:
        JSON com status da API
    """
    return jsonify({
        'status': 'ok',
        'mensagem': 'API funcionando normalmente',
        'timestamp': datetime.now().isoformat()
    }), 200
