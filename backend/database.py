"""
database.py
Módulo de gerenciamento do banco de dados SQLite
Sistema de Monitoramento Industrial
"""

import sqlite3
from datetime import datetime
from contextlib import contextmanager
import os

# Configuração do caminho do banco
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'producao.db')

@contextmanager
def get_db_connection():
    """
    Context manager para conexão com o banco de dados.
    Garante que a conexão será fechada após o uso.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Permite acesso por nome de coluna
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def inicializar_banco():
    """
    Inicializa o banco de dados criando as tabelas se não existirem.
    """
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    with get_db_connection() as conn:
        conn.executescript(schema_sql)
    
    print("✓ Banco de dados inicializado com sucesso!")


# ============================================
# FUNÇÕES DE TURNO
# ============================================

def criar_turno(meta_producao=100):
    """
    Cria um novo turno de produção.
    
    Args:
        meta_producao (int): Meta de produção para o turno
        
    Returns:
        int: ID do turno criado
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO turnos (data_inicio, status, meta_producao, producao_realizada)
            VALUES (?, 'ativo', ?, 0)
        """, (datetime.now(), meta_producao))
        
        turno_id = cursor.lastrowid
        
        # Registrar meta na tabela de metas
        cursor.execute("""
            INSERT INTO metas (turno_id, valor_meta, descricao, ativo)
            VALUES (?, ?, 'Meta do turno', 1)
        """, (turno_id, meta_producao))
        
        return turno_id


def obter_turno_ativo():
    """
    Retorna o turno atualmente ativo.
    
    Returns:
        dict: Dados do turno ativo ou None
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM turnos 
            WHERE status IN ('ativo', 'pausado')
            ORDER BY data_inicio DESC 
            LIMIT 1
        """)
        
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def pausar_turno(turno_id):
    """
    Pausa um turno ativo.
    
    Args:
        turno_id (int): ID do turno
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE turnos 
            SET status = 'pausado' 
            WHERE id = ? AND status = 'ativo'
        """, (turno_id,))


def retomar_turno(turno_id):
    """
    Retoma um turno pausado.
    
    Args:
        turno_id (int): ID do turno
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE turnos 
            SET status = 'ativo' 
            WHERE id = ? AND status = 'pausado'
        """, (turno_id,))


def finalizar_turno(turno_id):
    """
    Finaliza um turno e gera histórico.
    
    Args:
        turno_id (int): ID do turno
        
    Returns:
        dict: Dados finais do turno
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Obter dados do turno
        cursor.execute("SELECT * FROM turnos WHERE id = ?", (turno_id,))
        turno = dict(cursor.fetchone())
        
        # Atualizar status
        cursor.execute("""
            UPDATE turnos 
            SET status = 'finalizado', data_fim = ?
            WHERE id = ?
        """, (datetime.now(), turno_id))
        
        # Calcular percentual
        percentual = 0
        if turno['meta_producao'] > 0:
            percentual = (turno['producao_realizada'] / turno['meta_producao']) * 100
        
        # Registrar no histórico
        cursor.execute("""
            INSERT INTO historico_producao 
            (turno_id, quantidade_produzida, meta_estabelecida, percentual_atingido, observacoes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            turno_id, 
            turno['producao_realizada'], 
            turno['meta_producao'],
            percentual,
            f"Turno finalizado em {datetime.now()}"
        ))
        
        return turno


def atualizar_meta_turno(turno_id, nova_meta):
    """
    Atualiza a meta de produção de um turno.
    
    Args:
        turno_id (int): ID do turno
        nova_meta (int): Nova meta de produção
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE turnos 
            SET meta_producao = ?
            WHERE id = ?
        """, (nova_meta, turno_id))
        
        # Atualizar também na tabela de metas
        cursor.execute("""
            UPDATE metas 
            SET valor_meta = ?
            WHERE turno_id = ? AND ativo = 1
        """, (nova_meta, turno_id))


# ============================================
# FUNÇÕES DE EVENTOS DE PRODUÇÃO
# ============================================

def registrar_evento(turno_id, posto_id, tipo_evento='passagem'):
    """
    Registra um evento de sensor (passagem por um posto).
    
    Args:
        turno_id (int): ID do turno
        posto_id (int): ID do posto (1, 2 ou 3)
        tipo_evento (str): Tipo do evento
        
    Returns:
        int: ID do evento criado
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO eventos_producao (turno_id, posto_id, timestamp, tipo_evento, processado)
            VALUES (?, ?, ?, ?, 0)
        """, (turno_id, posto_id, datetime.now(), tipo_evento))
        
        evento_id = cursor.lastrowid
        
        # Se for o posto 3 (finalização), incrementar produção
        if posto_id == 3:
            cursor.execute("""
                UPDATE turnos 
                SET producao_realizada = producao_realizada + 1
                WHERE id = ?
            """, (turno_id,))
            
            # Marcar evento como processado
            cursor.execute("""
                UPDATE eventos_producao 
                SET processado = 1
                WHERE id = ?
            """, (evento_id,))
        
        return evento_id


def obter_ultimo_evento_posto(turno_id):
    """
    Retorna o último posto por onde a peça passou no turno atual.
    
    Args:
        turno_id (int): ID do turno
        
    Returns:
        int: ID do último posto ou 0 se não houver eventos
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT posto_id 
            FROM eventos_producao 
            WHERE turno_id = ?
            ORDER BY timestamp DESC 
            LIMIT 1
        """, (turno_id,))
        
        row = cursor.fetchone()
        if row:
            return row['posto_id']
        return 0


def obter_estatisticas_producao(turno_id):
    """
    Retorna estatísticas detalhadas da produção.
    
    Args:
        turno_id (int): ID do turno
        
    Returns:
        dict: Estatísticas de produção
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Dados do turno
        cursor.execute("SELECT * FROM turnos WHERE id = ?", (turno_id,))
        turno = dict(cursor.fetchone())
        
        # Contar eventos por posto
        cursor.execute("""
            SELECT p.nome, COUNT(e.id) as total
            FROM postos p
            LEFT JOIN eventos_producao e ON p.id = e.posto_id AND e.turno_id = ?
            GROUP BY p.id, p.nome
            ORDER BY p.ordem_sequencial
        """, (turno_id,))
        
        eventos_por_posto = [dict(row) for row in cursor.fetchall()]
        
        # Calcular percentual
        percentual = 0
        if turno['meta_producao'] > 0:
            percentual = round((turno['producao_realizada'] / turno['meta_producao']) * 100, 2)
        
        return {
            'turno': turno,
            'eventos_por_posto': eventos_por_posto,
            'percentual_atingido': percentual,
            'meta_atingida': turno['producao_realizada'] >= turno['meta_producao']
        }


# ============================================
# FUNÇÕES DE CONSULTA
# ============================================

def obter_producao_atual():
    """
    Retorna dados da produção atual (turno ativo).
    
    Returns:
        dict: Dados de produção ou None
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vw_producao_atual")
        
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def listar_historico_turnos(limite=10):
    """
    Lista os últimos turnos finalizados.
    
    Args:
        limite (int): Número de turnos a retornar
        
    Returns:
        list: Lista de turnos
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM turnos 
            WHERE status = 'finalizado'
            ORDER BY data_fim DESC 
            LIMIT ?
        """, (limite,))
        
        return [dict(row) for row in cursor.fetchall()]