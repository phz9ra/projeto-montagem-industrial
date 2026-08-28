<div align="center">

# Projeto de Montagem Industrial

Aplicação full stack voltada ao acompanhamento de processos de montagem industrial, com backend em Flask, interface web e integração com comunicação serial.

![Python](https://img.shields.io/badge/Python-0D1117?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-0D1117?style=for-the-badge&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-0D1117?style=for-the-badge&logo=javascript&logoColor=white)

</div>

---

## `> sobre_o_projeto`

Projeto desenvolvido para organizar e monitorar etapas de um fluxo de montagem industrial. A aplicação separa responsabilidades em **frontend**, **backend** e **database**, além de possuir uma camada para leitura serial.

## `> principais_componentes`

- API web em **Flask**
- Rotas organizadas em módulo próprio
- Camada de acesso a dados
- Comunicação serial com dispositivos externos
- Frontend separado do backend
- Estrutura preparada para integração com sensores ou microcontroladores

## `> stack`

- **Python 3**
- **Flask**
- **Flask-CORS**
- **Requests**
- **PySerial**
- **HTML / CSS / JavaScript**

## `> estrutura`

```text
.
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── routes.py
│   └── serial_reader.py
├── database/
├── frontend/
├── requirements.txt
└── README.md
```

## `> executando_localmente`

Crie e ative um ambiente virtual e instale as dependências:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Depois, inicie o backend a partir do diretório do projeto:

```bash
python backend/app.py
```

> Caso o projeto esteja utilizando uma porta serial real, confirme a porta correta e a disponibilidade do dispositivo antes de iniciar a integração.

## `> objetivo`

Aplicar conceitos de desenvolvimento web, organização em camadas, persistência de dados e integração software/hardware em um cenário inspirado em processos industriais.

---

<div align="center">

Desenvolvido por **Pedro Henrique** · [@phz9ra](https://github.com/phz9ra)

</div>
