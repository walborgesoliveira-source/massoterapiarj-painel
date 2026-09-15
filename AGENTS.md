# Regras do painel Massoterapia RJ

## Alterações de agenda

- A API/banco do CORE PS é a fonte oficial da escala, indisponibilidades e agendamentos.
- A escala local do painel é apenas fallback e deve permanecer coerente com as exceções por data da API.
- Nunca sobrescrever uma resposta válida da API com escala hardcoded ou dados salvos no navegador.
- Antes de alterar a escala, consultar bloqueios e agendamentos existentes. Nunca cancelar, excluir ou reagendar clientes automaticamente.
- Validar todas as datas e profissionais afetados com durações de 50, 90 e 120 minutos.
- Depois do build e da publicação, comparar a rota do painel com a rota pública do site e testar o domínio público real.
- Confirmar que outras datas, profissionais, serviços e preços não foram alterados.
- Não incluir no commit alterações preexistentes ou não relacionadas.
