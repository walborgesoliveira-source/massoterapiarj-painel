# 📋 Nova Funcionalidade — Controle Dinâmico de Disponibilidade dos Colaboradores

## Objetivo

Criar dentro do painel administrativo uma nova área chamada:

> **Painel → Agenda → Disponibilidade dos Colaboradores**

Esta funcionalidade terá o objetivo de controlar, em tempo real, a disponibilidade dos profissionais, permitindo substituições rápidas sem alterar a agenda fixa principal.

---

# 🎯 Necessidade

Atualmente existe uma agenda fixa contendo:

* Dia da semana
* Horário inicial
* Horário final
* Profissionais escalados
* Disponibilidade padrão

Porém podem ocorrer situações como:

* faltas
* folgas
* férias
* atrasos
* saídas antecipadas
* atendimentos externos
* substituições
* troca entre profissionais
* indisponibilidade temporária

Essas alterações não devem exigir mudanças na agenda principal.

---

# 📌 Criar Nova Área no Painel

## Caminho:

```txt
Painel
 └── Agenda
      └── Disponibilidade dos Colaboradores
```

---

# Campos da nova tela

| Campo           | Tipo       |
| --------------- | ---------- |
| Data            | Calendário |
| Horário Inicial | Hora       |
| Horário Final   | Hora       |
| Funcionário     | Lista      |
| Disponível Hoje | Sim/Não    |
| Substituir por  | Lista      |
| Motivo          | Texto      |
| Observações     | Texto      |

---

# Funcionamento esperado

## Exemplo

**Data:**

```txt
26/05/2026
```

**Horário:**

```txt
09:00 às 15:30
```

**Funcionária:**

```txt
Amanda
```

**Disponível Hoje:**

```txt
Não
```

**Substituir por:**

```txt
Selma
```

**Motivo:**

```txt
Atendimento externo
```

---

# ⚙️ Regras do sistema

## Quando:

```txt
Disponível Hoje = NÃO
```

O sistema deverá:

1. Remover automaticamente a profissional da agenda naquele horário.

2. Verificar se existe uma profissional substituta cadastrada.

3. Inserir automaticamente a profissional substituta.

4. Registrar a alteração.

5. Atualizar a agenda principal.

6. Atualizar o site de agendamento.

---

# 📅 Controle visual na agenda principal do painel

Exemplo:

```txt
09:00–10:00

Disponíveis:

✅ Ellaine
✅ Selma
❌ Amanda → Substituída por Diana
✅ Fabíola
```

---

# 📑 Histórico de alterações

Criar histórico para auditoria:

| Data       | Horário     | Funcionário Original | Substituto | Motivo              |
| ---------- | ----------- | -------------------- | ---------- | ------------------- |
| 26/05/2026 | 09:00–15:30 | Amanda               | Diana      | Atendimento externo |

---

# 🌐 Integração automática com o site

Todas as alterações realizadas dentro do painel deverão atualizar automaticamente o sistema público de agendamento.

Não será necessário atualizar manualmente o site.

---

# 🔄 Fluxo do cliente no site

```txt
Cliente acessa o site

↓
Seleciona técnica

↓
Seleciona dia

↓
Seleciona horário

↓
Sistema consulta agenda fixa

↓
Sistema consulta disponibilidade dinâmica

↓
Sistema remove profissionais indisponíveis

↓
Sistema aplica substituições

↓
Sistema exibe apenas profissionais disponíveis

↓
Cliente realiza o agendamento
```

---

# Exemplo de exibição no site

```txt
Profissionais disponíveis para este horário:

✅ Ellaine
✅ Selma
✅ Diana
✅ Fabíola

(Amanda indisponível hoje)
```

---

# 🚀 Benefícios

* Não altera a agenda fixa
* Permite troca rápida de profissionais
* Atualização em tempo real
* Reduz erros de agendamento
* Cliente visualiza apenas profissionais realmente disponíveis
* Mantém histórico das alterações
* Facilita controle operacional
* Estrutura preparada para múltiplas agendas futuras
* Escalável para crescimento da equipe

```
```
