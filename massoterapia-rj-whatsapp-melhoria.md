# Melhoria — Seção "Avisar Colaborador no WhatsApp"

**Projeto:** Massoterapia RJ — Painel de Agendamentos  
**Arquivo afetado:** Modal de agendamento (botão "Abrir" em cada linha da agenda)  
**Prioridade:** Alta  
**Tipo:** Refatoração de UX + Lógica condicional

---

## Problema Atual

A seção "Avisar colaborador no WhatsApp" exibe todos os colaboradores simultaneamente — com nome, campo de telefone e botão "Enviar aviso" — independentemente de o agendamento já ter um colaborador definido ou não.

**Consequências:**
- Ocupa espaço desnecessário na tela (≈ 300px de altura extra)
- Induz o gerente a enviar aviso antes de definir quem vai atender
- Campos de telefone sem número ficam visíveis, gerando poluição visual
- Não há vínculo claro entre "definir colaborador" e "avisar colaborador"

---

## Solução Proposta

Tornar a seção WhatsApp **condicional e contextual**: ela reage ao campo "Colaborador" do mesmo modal. O fluxo passa a ser linear e com feedback visual claro.

---

## Fluxo Esperado

```
Campo "Colaborador" = "Definir depois"
        ↓
[Aviso âmbar]: "Defina um colaborador acima para liberar o envio"

Campo "Colaborador" = [nome selecionado]
        ↓
[Card do colaborador escalado]: avatar + nome + telefone editável + botão "Enviar aviso"
        ↓  (opcional)
[Link "Avisar outro colaborador"] → expande lista compacta com todos os profissionais
```

---

## Comportamento por Estado

### Estado 1 — Sem colaborador definido

Exibir um aviso informativo no lugar da lista de contatos:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️  Defina um colaborador acima para liberar o envio    │
│      do aviso no WhatsApp.                               │
└─────────────────────────────────────────────────────────┘
```

- Cor de fundo: âmbar suave (`#FFF3DC`)
- Borda: `1px solid rgba(184,117,10,.2)`
- Ícone: alerta (triângulo ou círculo)
- A lista de colaboradores **não aparece**

---

### Estado 2 — Colaborador definido

Exibir apenas o card do colaborador escalado:

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar]  Ellaine                                       │
│            📞 [campo editável: 21980059845]              │
│                                      [✓ Enviar aviso]   │
└─────────────────────────────────────────────────────────┘

  ↓ Avisar outro colaborador   (link expansível)
```

**Card do colaborador:**
- Avatar com iniciais e cor única por profissional
- Nome do colaborador em destaque
- Campo de telefone pré-preenchido (se cadastrado) e editável
- Botão "Enviar aviso" em verde WhatsApp (`#25D366`)

**Botão "Enviar aviso" — comportamento:**
- Se telefone preenchido: abre `https://wa.me/55{telefone}?text={mensagem}`
- Se telefone vazio: abre `https://wa.me/?text={mensagem}` (WhatsApp sem número)
- A mensagem é gerada automaticamente com os dados do agendamento (ver template abaixo)

---

### Expansão "Avisar outro colaborador"

Link discreto abaixo do card principal. Ao clicar, expande uma lista compacta com todos os profissionais:

```
  Selma    [__________]  [Enviar]
  Ellaine  [21980059845] [Enviar]
  Fabiola  [__________]  [Enviar]
  Diana    [__________]  [Enviar]
  Amanda   [__________]  [Enviar]
```

- Cada linha: avatar pequeno + nome + campo de telefone + botão "Enviar"
- Clicar novamente no link recolhe a lista
- Útil para substituições de última hora ou avisos simultâneos

---

## Template da Mensagem WhatsApp

```
*Massoterapia RJ — Aviso de Agendamento*

Olá {colaborador}! Você foi escalado(a) para um atendimento.

*Cliente:* {nome_cliente}
*Serviço:* {servico}
*Data:* {data} às {hora}
*Local:* {local}
*Status:* {status}

Qualquer dúvida, entre em contato. Obrigado!
```

Todos os campos `{variável}` são preenchidos automaticamente com os dados já presentes no modal.

---

## Implementação Técnica

### Gatilho

Adicionar listener `onchange` no `<select>` do campo Colaborador:

```javascript
document.getElementById('colaborador-select').addEventListener('change', function () {
  atualizarSecaoWhatsApp(this.value);
});
```

---

### Função principal

```javascript
function atualizarSecaoWhatsApp(colaborador) {
  const semColab = document.getElementById('wa-sem-colaborador');
  const cardColab = document.getElementById('wa-card-colaborador');

  if (!colaborador || colaborador === '') {
    semColab.style.display = 'flex';
    cardColab.style.display = 'none';
    return;
  }

  semColab.style.display = 'none';
  cardColab.style.display = 'block';

  // Preenche o card com dados do colaborador selecionado
  const dados = COLABORADORES[colaborador];
  document.getElementById('wa-nome').textContent = colaborador;
  document.getElementById('wa-avatar').textContent = dados.iniciais;
  document.getElementById('wa-avatar').style.cssText = dados.estiloAvatar;
  document.getElementById('wa-telefone').value = dados.telefone || '';
}
```

---

### Objeto de colaboradores

```javascript
const COLABORADORES = {
  'Selma':   { iniciais: 'SE', telefone: '', estiloAvatar: 'background:#9FE1CB;color:#085041' },
  'Ellaine': { iniciais: 'EL', telefone: '21980059845', estiloAvatar: 'background:#B5D4F4;color:#0C447C' },
  'Fabiola': { iniciais: 'FA', telefone: '', estiloAvatar: 'background:#CECBF6;color:#3C3489' },
  'Diana':   { iniciais: 'DI', telefone: '', estiloAvatar: 'background:#FAC775;color:#633806' },
  'Amanda':  { iniciais: 'AM', telefone: '', estiloAvatar: 'background:#F5C4B3;color:#712B13' },
};
```

> **Nota:** Os telefones podem ser carregados dinamicamente da base de dados em vez de estarem hardcoded.

---

### Função de envio

```javascript
function enviarAviso() {
  const colaborador = document.getElementById('colaborador-select').value;
  const telefone = document.getElementById('wa-telefone').value.replace(/\D/g, '');

  const mensagem = gerarMensagem(colaborador);
  const msgCodificada = encodeURIComponent(mensagem);

  const url = telefone
    ? `https://wa.me/55${telefone}?text=${msgCodificada}`
    : `https://wa.me/?text=${msgCodificada}`;

  window.open(url, '_blank');
}

function gerarMensagem(colaborador) {
  // Captura os dados do modal atual
  const cliente  = document.getElementById('m-cliente').textContent;
  const servico  = document.getElementById('m-servico').textContent;
  const data     = document.getElementById('m-data').value;
  const hora     = document.getElementById('m-hora').value;
  const local    = document.getElementById('m-local').value;
  const status   = document.getElementById('m-status').value;

  return `*Massoterapia RJ — Aviso de Agendamento*\n\nOlá ${colaborador}! Você foi escalado(a) para um atendimento.\n\n*Cliente:* ${cliente}\n*Serviço:* ${servico}\n*Data:* ${formatarData(data)} às ${hora}\n*Local:* ${local}\n*Status:* ${status}\n\nQualquer dúvida, entre em contato. Obrigado!`;
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}
```

---

### HTML — Estrutura da seção

Substituir o bloco atual de colaboradores por:

```html
<!-- SEÇÃO WHATSAPP -->
<div class="wa-section">
  <h3 class="wa-titulo">Avisar colaborador no WhatsApp</h3>
  <p class="wa-descricao">Abre o WhatsApp com a mensagem pronta. O envio continua manual.</p>

  <!-- Estado 1: sem colaborador -->
  <div id="wa-sem-colaborador" class="wa-alerta-sem-colab">
    <span class="icone-alerta">⚠️</span>
    <p>Defina um colaborador acima para liberar o envio do aviso no WhatsApp.</p>
  </div>

  <!-- Estado 2: colaborador definido -->
  <div id="wa-card-colaborador" style="display: none;">
    <div class="wa-card-principal">
      <div id="wa-avatar" class="wa-avatar">??</div>
      <div class="wa-card-info">
        <strong id="wa-nome"></strong>
        <div class="wa-telefone-row">
          <span>📞</span>
          <input type="tel" id="wa-telefone" placeholder="(21) 99999-9999">
        </div>
      </div>
      <button class="btn-wa-enviar" onclick="enviarAviso()">
        <!-- ícone WhatsApp SVG -->
        Enviar aviso
      </button>
    </div>

    <!-- Expansão: avisar outro -->
    <button class="wa-expandir-link" onclick="toggleListaCompleta()">
      ▾ Avisar outro colaborador
    </button>

    <div id="wa-lista-completa" style="display: none;">
      <!-- Lista gerada dinamicamente via JS a partir do objeto COLABORADORES -->
    </div>
  </div>
</div>
```

---

## CSS — Classes novas

```css
.wa-section {
  border-top: 1px solid #F0E8DC;
  padding-top: 1.25rem;
  margin-top: 0.5rem;
}

.wa-titulo {
  font-size: 14px;
  font-weight: 700;
  color: #2C2218;
  margin-bottom: 4px;
}

.wa-descricao {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 1rem;
}

.wa-alerta-sem-colab {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF3DC;
  border: 1px solid rgba(184, 117, 10, 0.2);
  border-radius: 10px;
  padding: 1rem;
  font-size: 13px;
  color: #B8750A;
}

.wa-card-principal {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FAF7F2;
  border: 1px solid #E8E0D4;
  border-radius: 10px;
  padding: 1rem;
}

.wa-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.wa-card-info {
  flex: 1;
}

.wa-telefone-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
}

.wa-telefone-row input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 7px;
  font-size: 13px;
}

.btn-wa-enviar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: #25D366;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-wa-enviar:hover {
  background: #128C4A;
}

.wa-expandir-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.75rem;
  font-size: 12px;
  color: #8B6B4A;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.wa-expandir-link:hover {
  color: #4A3728;
  text-decoration: underline;
}
```

---

## Versão Mobile

O gerente utiliza o painel também pelo celular. A interface deve ser **100% funcional e confortável em telas a partir de 375px** (iPhone SE) sem perda de funcionalidade.

---

### Breakpoint principal

```css
@media (max-width: 640px) { ... }
```

Todas as adaptações mobile ficam dentro deste breakpoint.

---

### Modal — ajustes gerais no mobile

O modal no desktop é uma janela flutuante centralizada. No mobile ele deve ocupar a **tela inteira de baixo para cima** (comportamento de bottom sheet), mais natural para o toque com o polegar.

```css
@media (max-width: 640px) {
  /* O overlay passa a alinhar o modal na base da tela */
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  /* Modal ocupa 100% da largura, altura máxima com scroll */
  .modal {
    width: 100%;
    max-width: 100%;
    border-radius: 20px 20px 0 0;   /* arredondado só no topo */
    max-height: 92vh;
    overflow-y: auto;
    padding: 1.25rem 1rem 2rem;     /* padding inferior extra para área de gesto */
  }

  /* Indicador visual de arrastar (opcional) */
  .modal::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    margin: 0 auto 1rem;
  }
}
```

---

### Grid de informações — empilhado no mobile

No desktop o info-grid usa 2 colunas. No mobile passa para 1 coluna:

```css
@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
```

---

### Campos Data e Hora — empilhados no mobile

No desktop ficam lado a lado. No mobile um abaixo do outro:

```css
@media (max-width: 640px) {
  .f-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
```

---

### Seção WhatsApp no mobile

#### Estado 1 — Sem colaborador (mobile)

Sem mudanças estruturais. O aviso âmbar já se adapta bem por ser flex de coluna.

```css
@media (max-width: 640px) {
  .wa-alerta-sem-colab {
    font-size: 14px;   /* levemente maior para leitura no celular */
    padding: 0.875rem;
  }
}
```

---

#### Estado 2 — Card do colaborador (mobile)

No desktop o card é horizontal (avatar + info + botão na mesma linha). No mobile o botão "Enviar aviso" desce para uma segunda linha e ocupa largura total — área de toque maior e mais confortável:

```
┌───────────────────────────────────────┐
│  [Avatar]  Ellaine                    │
│            📞  21980059845            │
├───────────────────────────────────────┤
│        [ ✓  Enviar aviso  ]           │  ← largura 100%, altura 48px
└───────────────────────────────────────┘
```

```css
@media (max-width: 640px) {
  .wa-card-principal {
    flex-wrap: wrap;      /* permite que o botão quebre para nova linha */
    gap: 10px;
  }

  .wa-card-info {
    flex: 1;
    min-width: 0;
  }

  .btn-wa-enviar {
    width: 100%;                /* ocupa linha inteira */
    justify-content: center;
    padding: 14px;              /* área de toque confortável (mínimo 44px) */
    font-size: 15px;
    border-radius: 10px;
  }
}
```

---

#### Lista expandida "Avisar outro colaborador" (mobile)

No desktop cada item é uma linha horizontal (avatar + nome + input + botão). No mobile o input e o botão empilham abaixo do nome:

```
┌───────────────────────────────────────┐
│  [EL]  Ellaine                        │
│        [ 21980059845          ]       │
│        [      Enviar          ]       │
├───────────────────────────────────────┤
│  [FA]  Fabiola                        │
│        [ ___________________ ]       │
│        [      Enviar          ]       │
└───────────────────────────────────────┘
```

```css
@media (max-width: 640px) {
  .wa-item {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }

  /* Nome ocupa linha inteira junto com avatar */
  .wa-item-name {
    flex: 1;
  }

  /* Input ocupa linha própria */
  .wa-item-phone {
    width: 100%;
    order: 3;           /* força para depois do nome */
    padding: 10px 8px;
    font-size: 15px;    /* evita zoom automático no iOS (mínimo 16px recomendado) */
  }

  /* Botão ocupa linha própria, largura total */
  .btn-wa-sm {
    width: 100%;
    order: 4;
    justify-content: center;
    padding: 12px;
    font-size: 14px;
    border-radius: 8px;
  }
}
```

> **Atenção iOS:** inputs com `font-size` menor que 16px disparam zoom automático no Safari. Garantir `font-size: 16px` em todos os campos de texto no mobile.

---

### Botões do rodapé do modal (mobile)

"Salvar" e "Copiar aviso" ficam empilhados e com largura total:

```css
@media (max-width: 640px) {
  .btn-row {
    flex-direction: column;
    gap: 10px;
  }

  .btn-salvar,
  .btn-copiar {
    width: 100%;
    padding: 14px;
    font-size: 15px;
    text-align: center;
    justify-content: center;
  }
}
```

---

### Meta tag obrigatória

Confirmar que o `<head>` do painel já contém:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Sem essa tag, nenhum breakpoint CSS funciona corretamente em dispositivos móveis.

---

### Tamanhos mínimos de área de toque

Seguindo as diretrizes de acessibilidade mobile (Apple HIG e Material Design), todos os elementos interativos devem ter área de toque mínima de **44 × 44px**:

| Elemento | Tamanho mínimo no mobile |
|---|---|
| Botão "Enviar aviso" | 100% largura × 48px altura |
| Botão "Salvar" | 100% largura × 48px altura |
| Botões da lista expandida | 100% largura × 44px altura |
| Link "Avisar outro colaborador" | padding vertical 10px |
| Select "Colaborador" | altura mínima 44px |
| Inputs de telefone | altura mínima 44px |

---

### Resumo visual — Desktop vs Mobile

| Elemento | Desktop | Mobile |
|---|---|---|
| Modal | Janela centralizada flutuante | Bottom sheet (sobe da base) |
| Info-grid | 2 colunas | 1 coluna empilhada |
| Campos Data + Hora | Lado a lado | Empilhados |
| Card do colaborador | Horizontal em uma linha | Avatar+nome em cima, botão abaixo |
| Botão "Enviar aviso" | Largura automática, à direita | 100% da largura, 48px altura |
| Lista expandida | Linha horizontal por colaborador | Empilhado por colaborador |
| Botões Salvar/Copiar | Lado a lado | Empilhados, 100% largura |
| Font-size inputs | 13px | 16px (evita zoom iOS) |

---

## O que NÃO muda

- O botão "Salvar" e "Copiar aviso" permanecem como estão
- Os dados do modal (cliente, serviço, data, hora, local, status) não são alterados
- A lógica de salvamento no banco não é afetada
- Os telefones dos colaboradores continuam sendo gerenciados da mesma forma

---

## Checklist de Entrega

- [ ] Campo `colaborador-select` dispara `atualizarSecaoWhatsApp()` ao mudar
- [ ] Estado 1 (sem colaborador): aviso âmbar visível, lista oculta
- [ ] Estado 2 (com colaborador): card visível com avatar, nome e telefone
- [ ] Telefone pré-preenchido quando cadastrado no sistema
- [ ] Botão "Enviar aviso" abre WhatsApp com mensagem completa
- [ ] Link "Avisar outro colaborador" expande/recolhe lista corretamente
- [ ] Lista expandida tem botão de envio individual por colaborador
- [ ] Testado com colaborador sem telefone cadastrado (fallback sem número)
- [ ] Testado na troca de colaborador (card atualiza corretamente)

**Mobile:**
- [ ] Meta tag `viewport` presente no `<head>`
- [ ] Modal abre como bottom sheet em telas até 640px
- [ ] Campos de texto com `font-size` mínimo de 16px (evita zoom no iOS)
- [ ] Botão "Enviar aviso" ocupa largura total no mobile
- [ ] Todos os elementos interativos com área de toque mínima de 44 × 44px
- [ ] Info-grid empilhado em 1 coluna no mobile
- [ ] Campos Data e Hora empilhados no mobile
- [ ] Lista de colaboradores expandida funciona corretamente no toque
- [ ] Testado no Chrome DevTools (375px, 390px, 414px)
- [ ] Testado em dispositivo físico iOS (Safari) e Android (Chrome)
