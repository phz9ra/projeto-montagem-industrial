/**
 * script.js
 * Sistema de Monitoramento Industrial
 * Lógica do Frontend
 */

// ============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ============================================

const API_URL = 'http://localhost:3000/api';
const INTERVALO_ATUALIZACAO = 2000; // 2 segundos
let intervaloAtualizacao = null;

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

/**
 * Inicializa o sistema ao carregar a página
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema iniciado');
    adicionarLog('Sistema iniciado', 'info');
    
    // Carregar dados iniciais
    atualizarDados();
    
    // Iniciar atualização automática
    iniciarAtualizacaoAutomatica();
});

/**
 * Inicia a atualização automática dos dados
 */
function iniciarAtualizacaoAutomatica() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(atualizarDados, INTERVALO_ATUALIZACAO);
    console.log('Atualização automática iniciada');
}

/**
 * Para a atualização automática
 */
function pararAtualizacaoAutomatica() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
        intervaloAtualizacao = null;
        console.log('Atualização automática parada');
    }
}

// ============================================
// FUNÇÕES DE COMUNICAÇÃO COM A API
// ============================================

/**
 * Faz uma requisição GET para a API
 */
async function fazerRequisicaoGET(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        const dados = await response.json();
        return { sucesso: response.ok, dados, status: response.status };
    } catch (erro) {
        console.error('Erro na requisição GET:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

/**
 * Faz uma requisição POST para a API
 */
async function fazerRequisicaoPOST(endpoint, corpo = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(corpo)
        });
        
        const dados = await response.json();
        return { sucesso: response.ok, dados, status: response.status };
    } catch (erro) {
        console.error('Erro na requisição POST:', erro);
        return { sucesso: false, erro: erro.message };
    }
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE
// ============================================

/**
 * Atualiza todos os dados da interface
 */
async function atualizarDados() {
    await atualizarProducao();
    await buscarMetaAtual();
}

/**
 * Busca a meta atual no backend
 */
async function buscarMetaAtual() {
    const resultado = await fazerRequisicaoGET('/meta');
    
    if (resultado.sucesso && resultado.dados.meta !== null) {
        document.getElementById('metaAtual').textContent = resultado.dados.meta;
    }
}

/**
 * Atualiza os dados de produção
 */
async function atualizarProducao() {
    const resultado = await fazerRequisicaoGET('/producao/atual');
    
    if (resultado.sucesso && resultado.dados.producao) {
        const producao = resultado.dados.producao;
        
        // Atualizar valores na tela
        document.getElementById('producaoAtual').textContent = producao.producao_realizada;
        document.getElementById('metaAtual').textContent = producao.meta_producao;
        document.getElementById('percentualProgresso').textContent = 
            `${producao.percentual_atingido}%`;
        
        // Atualizar barra de progresso
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${Math.min(producao.percentual_atingido, 100)}%`;
        
        // Atualizar status da meta
        const metaStatus = document.getElementById('metaStatus');
        if (producao.status_meta === 'Meta Atingida') {
            metaStatus.classList.add('atingida');
            metaStatus.innerHTML = `
                <span class="meta-status-icon">✅</span>
                <span class="meta-status-text">Meta Atingida!</span>
            `;
        } else {
            metaStatus.classList.remove('atingida');
            metaStatus.innerHTML = `
                <span class="meta-status-icon">⏳</span>
                <span class="meta-status-text">Em Andamento</span>
            `;
        }
        
        // Atualizar status do turno
        atualizarStatusTurno(producao.status);
        
        // Atualizar botões
        atualizarBotoes(producao.status);
        
    } else {
        // Sem turno ativo
        document.getElementById('producaoAtual').textContent = '0';
        document.getElementById('metaAtual').textContent = '0';
        document.getElementById('percentualProgresso').textContent = '0%';
        document.getElementById('progressBar').style.width = '0%';
        
        atualizarStatusTurno(null);
        atualizarBotoes(null);
        
        // Resetar indicador de meta
        const metaStatus = document.getElementById('metaStatus');
        metaStatus.classList.remove('atingida');
        metaStatus.innerHTML = `
            <span class="meta-status-icon">⏳</span>
            <span class="meta-status-text">Aguardando início</span>
        `;
    }
}

/**
 * Atualiza a meta
 */
async function atualizarMeta() {
    const resultado = await fazerRequisicaoGET('/meta');
    
    if (resultado.sucesso && resultado.dados.meta !== null) {
        document.getElementById('metaAtual').textContent = resultado.dados.meta;
    }
}

/**
 * Atualiza o status visual do turno
 */
function atualizarStatusTurno(status) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    
    // Remover todas as classes de status
    statusBadge.className = 'status-badge';
    
    if (!status) {
        statusBadge.classList.add('sem-turno');
        statusBadge.textContent = 'SEM TURNO';
        statusText.textContent = 'Nenhum turno ativo no momento';
    } else if (status === 'ativo') {
        statusBadge.classList.add('ativo');
        statusBadge.textContent = 'TURNO ATIVO';
        statusText.textContent = 'Produção em andamento';
    } else if (status === 'pausado') {
        statusBadge.classList.add('pausado');
        statusBadge.textContent = 'TURNO PAUSADO';
        statusText.textContent = 'Produção temporariamente suspensa';
    } else if (status === 'finalizado') {
        statusBadge.classList.add('finalizado');
        statusBadge.textContent = 'TURNO FINALIZADO';
        statusText.textContent = 'Turno encerrado';
    }
}

/**
 * Atualiza o estado dos botões de controle
 */
function atualizarBotoes(status) {
    const btnIniciar = document.getElementById('btnIniciar');
    const btnPausar = document.getElementById('btnPausar');
    const btnRetomar = document.getElementById('btnRetomar');
    const btnFinalizar = document.getElementById('btnFinalizar');
    
    if (!status) {
        // Sem turno
        btnIniciar.disabled = false;
        btnPausar.disabled = true;
        btnRetomar.disabled = true;
        btnRetomar.style.display = 'none';
        btnPausar.style.display = 'inline-block';
        btnFinalizar.disabled = true;
    } else if (status === 'ativo') {
        // Turno ativo
        btnIniciar.disabled = true;
        btnPausar.disabled = false;
        btnRetomar.disabled = true;
        btnRetomar.style.display = 'none';
        btnPausar.style.display = 'inline-block';
        btnFinalizar.disabled = false;
    } else if (status === 'pausado') {
        // Turno pausado
        btnIniciar.disabled = true;
        btnPausar.disabled = true;
        btnPausar.style.display = 'none';
        btnRetomar.disabled = false;
        btnRetomar.style.display = 'inline-block';
        btnFinalizar.disabled = false;
    }
}

/**
 * Destaca visualmente um posto
 */
function destacarPosto(postoId) {
    // Remover destaque de todos os postos
    for (let i = 1; i <= 3; i++) {
        const posto = document.getElementById(`posto${i}`);
        posto.classList.remove('ativo');
    }
    
    // Adicionar destaque ao posto específico
    if (postoId) {
        const posto = document.getElementById(`posto${postoId}`);
        posto.classList.add('ativo');
        
        // Remover destaque após 2 segundos
        setTimeout(() => {
            posto.classList.remove('ativo');
        }, 2000);
    }
}

// ============================================
// FUNÇÕES DE CONTROLE DO TURNO
// ============================================

/**
 * Inicia um novo turno
 */
async function iniciarTurno() {
    const metaInicial = parseInt(document.getElementById('metaInicial').value);
    
    if (!metaInicial || metaInicial <= 0) {
        mostrarAlerta('Por favor, informe uma meta válida', 'error');
        return;
    }
    
    const resultado = await fazerRequisicaoPOST('/turno/iniciar', {
        meta_producao: metaInicial
    });
    
    if (resultado.sucesso) {
        mostrarAlerta('Turno iniciado com sucesso!', 'success');
        adicionarLog(`Turno iniciado com meta de ${metaInicial} peças`, 'success');
        await atualizarDados();
    } else {
        const mensagem = resultado.dados?.mensagem || 'Erro ao iniciar turno';
        mostrarAlerta(mensagem, 'error');
        adicionarLog(mensagem, 'error');
    }
}

/**
 * Pausa o turno atual
 */
async function pausarTurno() {
    if (!confirm('Deseja pausar o turno?')) {
        return;
    }
    
    const resultado = await fazerRequisicaoPOST('/turno/pausar');
    
    if (resultado.sucesso) {
        mostrarAlerta('Turno pausado', 'warning');
        adicionarLog('Turno pausado', 'warning');
        await atualizarDados();
    } else {
        const mensagem = resultado.dados?.mensagem || 'Erro ao pausar turno';
        mostrarAlerta(mensagem, 'error');
        adicionarLog(mensagem, 'error');
    }
}

/**
 * Retoma o turno pausado
 */
async function retomarTurno() {
    const resultado = await fazerRequisicaoPOST('/turno/retomar');
    
    if (resultado.sucesso) {
        mostrarAlerta('Turno retomado', 'success');
        adicionarLog('Turno retomado', 'success');
        await atualizarDados();
    } else {
        const mensagem = resultado.dados?.mensagem || 'Erro ao retomar turno';
        mostrarAlerta(mensagem, 'error');
        adicionarLog(mensagem, 'error');
    }
}

/**
 * Finaliza o turno atual
 */
async function finalizarTurno() {
    if (!confirm('Deseja finalizar o turno? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const resultado = await fazerRequisicaoPOST('/turno/finalizar');
    
    if (resultado.sucesso) {
        const turno = resultado.dados.turno;
        const stats = resultado.dados.estatisticas;
        
        const mensagem = `Turno finalizado!\n` +
            `Produção: ${turno.producao_realizada}/${turno.meta_producao}\n` +
            `Percentual: ${stats.percentual_atingido}%`;
        
        mostrarAlerta(mensagem, 'success');
        adicionarLog(`Turno finalizado - ${turno.producao_realizada}/${turno.meta_producao} peças`, 'success');
        
        await atualizarDados();
    } else {
        const mensagem = resultado.dados?.mensagem || 'Erro ao finalizar turno';
        mostrarAlerta(mensagem, 'error');
        adicionarLog(mensagem, 'error');
    }
}

/**
 * Atualiza a meta do turno atual
 */
async function enviarNovaMeta() {
    const novaMeta = parseInt(document.getElementById('novaMeta').value);
    
    if (!novaMeta || novaMeta <= 0) {
        mostrarAlerta('Por favor, informe uma meta válida', 'error');
        return;
    }
    
    const resultado = await fazerRequisicaoPOST('/meta', {
        meta: novaMeta
    });
    
    if (resultado.sucesso) {
        mostrarAlerta(`Meta atualizada para ${novaMeta} peças`, 'success');
        adicionarLog(`Meta atualizada: ${novaMeta} peças`, 'success');
        document.getElementById('novaMeta').value = '';
        await atualizarDados();
    } else {
        const mensagem = resultado.dados?.mensagem || 'Erro ao atualizar meta';
        mostrarAlerta(mensagem, 'error');
        adicionarLog(mensagem, 'error');
    }
}

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

/**
 * Mostra um alerta na tela
 */
function mostrarAlerta(mensagem, tipo = 'info') {
    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    alerta.textContent = mensagem;
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : tipo === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${tipo === 'warning' ? '#333' : 'white'};
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 300px;
        font-weight: bold;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(alerta);
    
    // Remover após 3 segundos
    setTimeout(() => {
        alerta.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(alerta);
        }, 300);
    }, 3000);
}

/**
 * Adiciona uma entrada no log de atividades
 */
function adicionarLog(mensagem, tipo = 'info') {
    const logsContainer = document.getElementById('logsContainer');
    
    // Remover mensagem de "vazio" se existir
    const logEmpty = logsContainer.querySelector('.log-empty');
    if (logEmpty) {
        logEmpty.remove();
    }
    
    // Criar entrada de log
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${tipo}`;
    
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    logEntry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        ${mensagem}
    `;
    
    // Adicionar no topo
    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
    
    // Limitar a 50 entradas
    const entradas = logsContainer.querySelectorAll('.log-entry');
    if (entradas.length > 50) {
        logsContainer.removeChild(entradas[entradas.length - 1]);
    }
}

// ============================================
// ANIMAÇÕES CSS ADICIONAIS (via JavaScript)
// ============================================

// Adicionar estilos de animação ao documento
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// EVENTOS DE TECLADO (ATALHOS)
// ============================================

document.addEventListener('keydown', function(e) {
    // Ctrl + I = Iniciar turno
    if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        const btn = document.getElementById('btnIniciar');
        if (!btn.disabled) {
            iniciarTurno();
        }
    }
    
    // Ctrl + F = Finalizar turno
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const btn = document.getElementById('btnFinalizar');
        if (!btn.disabled) {
            finalizarTurno();
        }
    }
});

console.log('Script carregado com sucesso!');
console.log('Atalhos de teclado: Ctrl+I (Iniciar), Ctrl+F (Finalizar)');
