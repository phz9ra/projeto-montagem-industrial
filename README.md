# 🏭 Sistema de Monitoramento Industrial

Sistema completo de monitoramento e controle de produção industrial para linha de produção por postos (sem esteira).

**Projeto Acadêmico - SENAI**

---

## 📋 Descrição do Projeto

Sistema web em tempo real que simula uma linha de produção manual dividida em 3 postos sequenciais:

- **Posto 1**: Início do processo
- **Posto 2**: Montagem
- **Posto 3**: Finalização (contabiliza a produção)

### Principais Funcionalidades

✅ Controle de turnos (iniciar, pausar, finalizar)  
✅ Definição e acompanhamento de metas de produção  
✅ Monitoramento em tempo real  
✅ Validação de sequência de postos (não permite pular etapas)  
✅ Histórico de produção  
✅ Simulação de sensores industriais  
✅ Interface web responsiva e intuitiva  

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.8+**
- **Flask** (framework web)
- **SQLite** (banco de dados)
- **Flask-CORS** (permitir requisições do frontend)

### Simulação de Sensores
- **Python**
- **Requests** (comunicação HTTP)
- **Colorama** (logs coloridos no terminal)

### Frontend
- **HTML5**
- **CSS3** (design responsivo)
- **JavaScript** (comunicação com API via Fetch)

### Banco de Dados
- **SQLite** (relacional)

---

## 📁 Estrutura do Projeto

```
projeto-monitoramento-industrial/
│
├── backend/
│   ├── app.py                 # Aplicação Flask principal
│   ├── database.py            # Gerenciamento do banco de dados
│   ├── routes.py              # Endpoints da API REST
│   └── sensors.py             # Simulador de sensores
│
├── frontend/
│   ├── index.html             # Página principal
│   ├── style.css              # Estilos
│   └── script.js              # Lógica JavaScript
│
├── database/
│   ├── schema.sql             # Script de criação do banco
│   └── producao.db            # Banco de dados (gerado automaticamente)
│
├── requirements.txt           # Dependências Python
└── README.md                  # Este arquivo
```

---

## 🚀 Como Executar o Sistema

### Pré-requisitos

1. **Python 3.8 ou superior** instalado
2. **pip** (gerenciador de pacotes Python)

Para verificar se o Python está instalado:
```bash
python --version
```

### Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
pip install -r requirements.txt
```

Isso instalará:
- Flask
- Flask-CORS
- requests
- colorama

### Passo 2: Iniciar o Backend (Servidor)

Navegue até a pasta `backend` e execute:

```bash
cd backend
python app.py
```

**Saída esperada:**
```
==================================================
SISTEMA DE MONITORAMENTO INDUSTRIAL
==================================================

Inicializando banco de dados...
✓ Banco de dados inicializado com sucesso!

Sistema pronto para uso!

Acesse o sistema em: http://localhost:5000
==================================================

 * Running on http://0.0.0.0:5000
```

✅ O servidor estará rodando em **http://localhost:5000**

### Passo 3: Acessar o Site

Abra seu navegador e acesse:

```
http://localhost:5000
```

Você verá a interface do sistema de monitoramento.

### Passo 4: Iniciar o Simulador de Sensores (Opcional)

**Em um novo terminal**, navegue até a pasta `backend` e execute:

```bash
cd backend
python sensors.py
```

**Menu do Simulador:**
```
============================================================
SIMULADOR DE SENSORES INDUSTRIAIS
============================================================

1. Simular 1 ciclo de produção (Posto 1 -> 2 -> 3)
2. Simular múltiplos ciclos (modo automático)
3. Simular erro de sequência
4. Verificar status do sistema
5. Iniciar novo turno
0. Sair

============================================================
```

---

## 📖 Instruções de Uso

### 1. Iniciar um Turno

1. Acesse o site em **http://localhost:5000**
2. Defina a **Meta de Produção** (ex: 100 peças)
3. Clique em **▶️ Iniciar Turno**
4. O status mudará para **TURNO ATIVO**

### 2. Simular Produção

**Opção A - Via Interface Web:**
- Não há controle manual dos sensores via web
- Use o simulador Python (veja passo 4 da instalação)

**Opção B - Via Simulador de Sensores:**

1. Com o simulador rodando, escolha a opção **1** ou **2**
2. O sistema simulará a passagem da peça pelos 3 postos
3. A produção será incrementada automaticamente no **Posto 3**

### 3. Acompanhar a Produção

O site atualiza automaticamente a cada **2 segundos** mostrando:

- ✅ Produção atual
- ✅ Meta estabelecida
- ✅ Percentual de progresso
- ✅ Status de cada posto
- ✅ Indicador se a meta foi atingida

### 4. Alterar a Meta Durante o Turno

1. Digite a nova meta no campo **"Nova meta"**
2. Clique em **Atualizar Meta**
3. A meta será atualizada imediatamente

### 5. Pausar o Turno

1. Clique em **⏸️ Pausar Turno**
2. A produção será suspensa temporariamente
3. Para retomar, clique em **▶️ Retomar Turno**

### 6. Finalizar o Turno

1. Clique em **⏹️ Finalizar Turno**
2. Confirme a ação
3. O sistema mostrará um resumo:
   - Quantidade produzida
   - Meta estabelecida
   - Percentual atingido

---

## 🔌 Endpoints da API REST

### Turnos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/turno/iniciar` | Inicia um novo turno |
| POST | `/api/turno/pausar` | Pausa o turno ativo |
| POST | `/api/turno/retomar` | Retoma um turno pausado |
| POST | `/api/turno/finalizar` | Finaliza o turno ativo |

### Sensores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/sensor/evento` | Registra evento de sensor |

**Exemplo de body:**
```json
{
  "posto_id": 1,
  "tipo_evento": "passagem"
}
```

### Produção e Metas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/producao/atual` | Retorna produção atual |
| GET | `/api/meta` | Retorna meta do turno ativo |
| POST | `/api/meta` | Atualiza a meta |

**Exemplo de body (POST /api/meta):**
```json
{
  "meta": 150
}
```

### Consultas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/estatisticas` | Estatísticas detalhadas |
| GET | `/api/historico` | Histórico de turnos |
| GET | `/api/health` | Status da API |

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `turnos`
Armazena informações de cada turno de produção.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| data_inicio | DATETIME | Data/hora de início |
| data_fim | DATETIME | Data/hora de finalização |
| status | VARCHAR(20) | ativo, pausado, finalizado |
| meta_producao | INTEGER | Meta de produção |
| producao_realizada | INTEGER | Quantidade produzida |

### Tabela: `postos`
Define os postos de trabalho.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária (1, 2, 3) |
| nome | VARCHAR(50) | Nome do posto |
| ordem_sequencial | INTEGER | Ordem na linha |

### Tabela: `eventos_producao`
Registra cada passagem por um posto.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| turno_id | INTEGER | FK para turnos |
| posto_id | INTEGER | FK para postos |
| timestamp | DATETIME | Data/hora do evento |
| tipo_evento | VARCHAR(50) | Tipo do evento |
| processado | BOOLEAN | Se incrementou produção |

### Tabela: `metas`
Armazena metas de produção.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER | Chave primária |
| turno_id | INTEGER | FK para turnos |
| valor_meta | INTEGER | Valor da meta |
| ativo | BOOLEAN | Se está ativa |

---

## 🎯 Regras de Negócio

### Sequência de Postos

✅ **Correto**: Posto 1 → Posto 2 → Posto 3 → Posto 1 → ...  
❌ **Incorreto**: Pular postos (ex: Posto 1 → Posto 3)

O sistema valida e bloqueia eventos fora de sequência.

### Incremento de Produção

- A produção é incrementada **apenas no Posto 3** (finalização)
- Cada passagem completa (1 → 2 → 3) = +1 peça produzida

### Status do Turno

- **Ativo**: Aceita eventos de sensores
- **Pausado**: Bloqueia novos eventos
- **Finalizado**: Não pode mais ser modificado

---

## 🧪 Testando o Sistema

### Teste 1: Ciclo Completo de Produção

1. Inicie um turno com meta de 5 peças
2. Execute o simulador com 5 ciclos
3. Verifique se a produção atingiu 5
4. Finalize o turno

### Teste 2: Validação de Sequência

1. Inicie um turno
2. No simulador, escolha a opção **3** (simular erro)
3. Verifique se o sistema bloqueou o evento incorreto

### Teste 3: Alteração de Meta

1. Inicie um turno com meta 50
2. Após 10 peças produzidas, altere para meta 100
3. Verifique se o percentual foi recalculado

### Teste 4: Pausa e Retomada

1. Inicie um turno
2. Produza 5 peças
3. Pause o turno
4. Tente enviar evento (deve ser bloqueado)
5. Retome o turno
6. Continue a produção

---

## 🐛 Solução de Problemas

### Erro: "Porta 5000 já está em uso"

**Solução:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Erro: "ModuleNotFoundError: No module named 'flask'"

**Solução:**
```bash
pip install -r requirements.txt
```

### Erro: "Failed to fetch" no site

**Verificar:**
1. Backend está rodando? (`python app.py`)
2. URL correta? (http://localhost:5000)
3. CORS habilitado? (já está no código)

### Site não atualiza automaticamente

**Solução:**
1. Verifique o console do navegador (F12)
2. Limpe o cache (Ctrl + Shift + Delete)
3. Recarregue a página (F5)

---

## 📊 Exemplo de Uso Completo

```bash
# Terminal 1 - Iniciar Backend
cd backend
python app.py

# Terminal 2 - Iniciar Simulador
cd backend
python sensors.py
```

**No navegador:**
1. Acesse http://localhost:5000
2. Inicie turno com meta 20
3. No simulador, escolha opção 2
4. Digite 20 ciclos
5. Intervalo de 1 segundo
6. Acompanhe pelo site
7. Finalize o turno

---

## 👨‍💻 Desenvolvimento

### Adicionar Novos Endpoints

1. Edite `backend/routes.py`
2. Adicione a nova rota com decorator `@api.route()`
3. Implemente a lógica
4. Retorne JSON

### Modificar o Banco

1. Edite `database/schema.sql`
2. Delete `database/producao.db`
3. Reinicie o backend (recria o banco)

### Customizar Interface

1. **HTML**: `frontend/index.html`
2. **Estilos**: `frontend/style.css`
3. **Lógica**: `frontend/script.js`

---

## 📝 Licença

Projeto acadêmico desenvolvido para fins educacionais - SENAI

---

## 🤝 Contribuições

Este é um projeto acadêmico, mas sugestões são bem-vindas!

---

## 📧 Suporte

Em caso de dúvidas, consulte:
1. Este README
2. Comentários no código-fonte
3. Logs do terminal

---

**Sistema desenvolvido com foco em aprendizado de:**
- Desenvolvimento Full Stack
- APIs REST
- Banco de Dados Relacional
- Automação Industrial
- IoT e Sensores
- Programação em Python
- Desenvolvimento Web

**Bom aprendizado! 🚀**
#   p r o j e t o - m o n t a g e m - i n d u s t r i a l  
 #   p r o j e t o - m o n t a g e m - i n d u s t r i a l  
 