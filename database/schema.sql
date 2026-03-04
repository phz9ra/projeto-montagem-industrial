-- ============================================
-- SCHEMA DO BANCO DE DADOS
-- Sistema de Monitoramento Industrial
-- ============================================

-- Tabela de Turnos
CREATE TABLE IF NOT EXISTS turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    meta_producao INTEGER NOT NULL DEFAULT 0,
    producao_realizada INTEGER NOT NULL DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Postos de Trabalho
CREATE TABLE IF NOT EXISTS postos (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    ordem_sequencial INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Eventos de Produção (sensores)
CREATE TABLE IF NOT EXISTS eventos_producao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER NOT NULL,
    posto_id INTEGER NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(50) DEFAULT 'passagem',
    dados_adicionais TEXT,
    processado BOOLEAN DEFAULT 0,
    FOREIGN KEY (turno_id) REFERENCES turnos(id),
    FOREIGN KEY (posto_id) REFERENCES postos(id)
);

-- Tabela de Metas
CREATE TABLE IF NOT EXISTS metas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER,
    valor_meta INTEGER NOT NULL,
    descricao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT 1,
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);

-- Tabela de Histórico de Produção (consolidado)
CREATE TABLE IF NOT EXISTS historico_producao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER NOT NULL,
    quantidade_produzida INTEGER NOT NULL,
    meta_estabelecida INTEGER NOT NULL,
    percentual_atingido DECIMAL(5,2),
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);

-- ============================================
-- INSERÇÃO DE DADOS INICIAIS
-- ============================================

-- Inserir os 3 postos de trabalho (apenas se não existirem)
INSERT OR IGNORE INTO postos (id, nome, descricao, ordem_sequencial) VALUES
(1, 'Posto 1 - Início', 'Posto inicial do processo produtivo', 1),
(2, 'Posto 2 - Montagem', 'Posto de montagem e processamento', 2),
(3, 'Posto 3 - Finalização', 'Posto final - contabiliza produção', 3);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_eventos_turno ON eventos_producao(turno_id);
CREATE INDEX IF NOT EXISTS idx_eventos_posto ON eventos_producao(posto_id);
CREATE INDEX IF NOT EXISTS idx_eventos_timestamp ON eventos_producao(timestamp);
CREATE INDEX IF NOT EXISTS idx_turnos_status ON turnos(status);

-- ============================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ============================================

-- View de produção em tempo real
CREATE VIEW IF NOT EXISTS vw_producao_atual AS
SELECT 
    t.id as turno_id,
    t.status,
    t.meta_producao,
    t.producao_realizada,
    t.data_inicio,
    CASE 
        WHEN t.meta_producao > 0 THEN 
            ROUND((CAST(t.producao_realizada AS FLOAT) / t.meta_producao) * 100, 2)
        ELSE 0 
    END as percentual_atingido,
    CASE 
        WHEN t.producao_realizada >= t.meta_producao THEN 'Meta Atingida'
        ELSE 'Em Andamento'
    END as status_meta
FROM turnos t
WHERE t.status IN ('ativo', 'pausado')
ORDER BY t.data_inicio DESC
LIMIT 1;

-- View de eventos por posto
CREATE VIEW IF NOT EXISTS vw_eventos_por_posto AS
SELECT 
    p.nome as posto,
    COUNT(e.id) as total_eventos,
    MAX(e.timestamp) as ultimo_evento
FROM postos p
LEFT JOIN eventos_producao e ON p.id = e.posto_id
GROUP BY p.id, p.nome
ORDER BY p.ordem_sequencial;