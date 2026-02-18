# ☣️ Spriters Bot (Discord)

O Spriters Bot é uma IA de administração com personalidade forte, projetada para manter seu servidor limpo e organizado enquanto julga silenciosamente (ou não) a incompetência humana. Focado em eficiência, segurança e automação, ele oferece ferramentas robustas de limpeza, anti-spam e gerenciamento de eventos.

---

## 🚀 Funcionalidades

*   **Sistema de Auto Limpeza**: Configuração avançada para limpeza automática de mensagens com filtros (bots, links, arquivos, etc.).
*   **Janela de Operação**: Defina intervalos de limpeza ou horários fixos.
*   **Agendamento Diário**: Execute tarefas de manutenção todos os dias em horários específicos.
*   **Sistema de Datas**: Gerencie datas comemorativas globais e personalizadas com mensagens automáticas.
*   **Sistema de Logs**: Auditoria completa de todas as ações administrativas e eventos do sistema.
*   **Sistema de Permissões**: Controle granular sobre quem pode configurar o bot.
*   **Multi-idioma**: Suporte completo para Português (Brasil) e Inglês (US).
*   **Timezone por Servidor**: Respeita o fuso horário local de cada comunidade.
*   **Arquitetura Modular**: Serviços independentes para escalabilidade e manutenção.

---

## 🏗 Estrutura do Projeto

Abaixo, a organização dos diretórios principais:

```
src/
  commands/       # Comandos Slash (Admin e General)
  services/       # Lógica de negócio e serviços principais
  handlers/       # Gerenciadores de interação (botões, menus, modais)
  events/         # Listeners de eventos do Discord (ready, interactionCreate)
  config/         # Constantes e configurações estáticas
  locales/        # Arquivos de tradução (JSON)
frontend/         # Interface Web para documentação e landing page
```

*   **commands/**: Contém a definição e execução de cada comando (`/start`, `/clear`, `/dates`, etc.).
*   **services/**: Onde a mágica acontece. Serviços como `CleaningService` e `DateService` encapsulam a lógica complexa.
*   **handlers/**: `CentralInteractionHandler` centraliza a resposta a interações complexas como menus e modais.
*   **locales/**: Armazena todas as strings de texto usadas pelo bot, facilitando a internacionalização.

---

## ⚙ Configuração

### Pré-requisitos
*   Node.js v16.9+
*   Token de Bot do Discord

### 1. Configurar .env
Crie um arquivo `.env` na raiz do projeto:
```env
TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
```

### 2. Iniciar o Bot
Instale as dependências e inicie o bot:
```bash
npm install
npm start
```
*(Para desenvolver o frontend de documentação, use `npm run dev`)*

### 3. Registrar Comandos
Sempre que adicionar ou modificar comandos, atualize o registro no Discord:
```bash
npm run deploy-commands
```

### 4. Configurar Timezone
O bot detecta o fuso horário configurado no servidor (via comando `/status` e `/start` > Configuração). Por padrão usa UTC, mas pode ser ajustado para `America/Sao_Paulo` ou outros.

---

## 🧠 Arquitetura

O bot opera com base em Serviços Singleton:

*   **ConfigService**: Gerencia leitura e escrita de configurações JSON por servidor (`guildConfigs.json`).
*   **CleaningService**: Responsável pela lógica de varredura e exclusão de mensagens, suportando filtros e agendamentos.
*   **DateService**: Monitora datas comemorativas e envia mensagens programadas. Verifica diariamente canais configurados.
*   **LogService**: Registra eventos (erros, ações manuais, triggers automáticos) em memória e arquivo para auditoria.
*   **PermissionService**: Abstração para verificação de permissões (Admins, Dono do Servidor, Cargos Autorizados).
*   **LocaleService**: Carrega e formata strings de tradução com suporte a placeholders.
*   **CentralInteractionHandler**: Roteador central para interações de componentes (Botões, Select Menus, Modais), mantendo o código dos comandos limpo.

---

## 🔐 Permissões

O acesso às funções administrativas (`/clear`, configurações de `/start`, `/dates`) é restrito:
1.  **Administradores**: Têm acesso total por padrão.
2.  **Dono do Servidor**: Tem acesso total.
3.  **Cargos Autorizados**: Podem ser configurados via menu de segurança para permitir que moderadores usem o bot sem dar permissão de Admin.

---

## 🌍 Idiomas

O bot suporta `pt-BR` e `en-US`. A linguagem é salva por servidor.
*   **Tradução**: Todos os textos visíveis estão em `src/locales/`.
*   **Comandos**: Nomes de comandos são globais (em inglês), mas descrições e respostas adaptam-se ao idioma configurado.

---

## 📆 Sistema de Datas

O módulo de datas (`/dates`) permite:
*   **Datas Globais**: Eventos pré-definidos (ex: Natal, Ano Novo) que podem ser ativados/desativados.
*   **Datas Personalizadas**: Adicione aniversários ou eventos do servidor com mensagem, data (DD/MM) e canal de destino.
*   **Verificação**: O bot checa diariamente (por volta das 10h locais) se há eventos para disparar.

---

## 📝 Logs

O sistema de logs (`/logs`) mantém os últimos 10 eventos críticos por servidor, incluindo:
*   Limpezas manuais e automáticas.
*   Alterações de configuração.
*   Disparos de datas comemorativas.
*   Erros de permissão ou sistema.

Os logs podem ser visualizados via comando `/logs` (Embed interativo) ou limpos manualmente.

---
*Desenvolvido por AllvesMatteus.*
