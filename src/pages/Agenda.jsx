import { useEffect, useMemo, useState } from 'react';
import Campo from '../components/Campo';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STATUS = ['Pendente', 'Aprovado', 'Recusado', 'Reagendado', 'Cancelado', 'Concluído', 'Não compareceu'];

const STATUS_CLASS = {
  Pendente: 'pending',
  Aprovado: 'approved',
  Recusado: 'danger',
  Reagendado: 'rescheduled',
  Cancelado: 'danger',
  Concluído: 'done',
  'Não compareceu': 'danger',
};

const COLABORADORES_PADRAO = [
  { nome: 'Selma', whatsapp: '', iniciais: 'SE', avatarClass: 'mint' },
  { nome: 'Ellaine', whatsapp: '21980059845', iniciais: 'EL', avatarClass: 'blue' },
  { nome: 'Fabiola', whatsapp: '', iniciais: 'FA', avatarClass: 'violet' },
  { nome: 'Diana', whatsapp: '', iniciais: 'DI', avatarClass: 'amber' },
  { nome: 'Amanda', whatsapp: '', iniciais: 'AM', avatarClass: 'coral' },
  { nome: 'Equipe Massoterapia RJ', whatsapp: '', iniciais: 'MR', avatarClass: 'brown' },
];

const HORARIOS_AGENDA = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

function carregarColaboradores() {
  try {
    const salvos = JSON.parse(localStorage.getItem('mrj_colaboradores_whatsapp') || '[]');
    return COLABORADORES_PADRAO.map((item) => {
      const salvo = salvos.find((row) => row.nome === item.nome);
      return { ...item, whatsapp: salvo?.whatsapp || item.whatsapp };
    });
  } catch {
    return COLABORADORES_PADRAO;
  }
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function ajustarDataISO(valor, dias) {
  const base = valor ? new Date(`${valor}T12:00:00`) : new Date();
  base.setDate(base.getDate() + dias);
  return base.toISOString().slice(0, 10);
}

function formatarData(valor) {
  if (!valor) return '-';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(valor) {
  return valor ? String(valor).slice(0, 5) : '-';
}

function contato(row) {
  return row.whatsapp || row.telefone || row.email || row.telegram || '-';
}

function horarioChave(row) {
  return formatarHora(row.hora_agendada);
}

function statusContaComoLivre(status) {
  return ['Cancelado', 'Recusado', 'Não compareceu'].includes(status);
}

function somenteDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function normalizarWhatsApp(valor) {
  const digitos = somenteDigitos(valor);
  if (!digitos) return '';
  if (digitos.startsWith('55')) return digitos;
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

function mensagemColaborador(row, form, nomeColaborador) {
  const status = form?.status || row.status || 'Pendente';
  const data = formatarData(form?.data_agendada || row.data_agendada);
  const hora = formatarHora(form?.hora_agendada || row.hora_agendada);
  const local = form?.local || row.local || '-';
  const colaborador = nomeColaborador || form?.colaborador || row.colaborador || '-';
  const linhas = [
    '*Massoterapia RJ - Aviso de Agendamento*',
    '',
    `Ola ${colaborador}! Voce foi escalado(a) para um atendimento.`,
    '',
    `*Cliente:* ${row.nome_cliente || '-'}`,
    `*Servico:* ${row.servico || '-'}`,
    `*Data:* ${data} as ${hora}`,
    `*Local:* ${local}`,
    `*Status:* ${status}`,
  ];

  if (row.observacoes_cliente) {
    linhas.push('', `Observacoes do cliente: ${row.observacoes_cliente}`);
  }
  if (form?.observacoes_gerente) {
    linhas.push('', `Observacoes internas: ${form.observacoes_gerente}`);
  }

  linhas.push('', 'Qualquer duvida, entre em contato. Obrigado!');

  return linhas.join('\n');
}

function valorInicial(row) {
  return {
    status: row.status || 'Pendente',
    data_agendada: row.data_agendada?.slice(0, 10) || '',
    hora_agendada: row.hora_agendada?.slice(0, 5) || '',
    local: row.local || '',
    colaborador: row.colaborador || '',
    observacoes_gerente: row.observacoes_gerente || '',
  };
}

export default function Agenda() {
  const { usuario, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [agendaDia, setAgendaDia] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(hojeISO());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [colaboradores, setColaboradores] = useState(carregarColaboradores);
  const [listaWhatsAppAberta, setListaWhatsAppAberta] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('');

  const colaboradorSelecionado = useMemo(() => {
    if (!form?.colaborador) return null;
    return colaboradores.find((item) => item.nome === form.colaborador) || null;
  }, [colaboradores, form?.colaborador]);

  const resumo = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  const slotsAgenda = useMemo(() => {
    const porHorario = agendaDia.reduce((acc, row) => {
      const chave = horarioChave(row);
      if (!acc[chave]) acc[chave] = [];
      acc[chave].push(row);
      return acc;
    }, {});

    return HORARIOS_AGENDA.map((horario) => {
      const agendamentos = porHorario[horario] || [];
      const ativos = agendamentos.filter((row) => !statusContaComoLivre(row.status));
      return {
        horario,
        agendamentos,
        principal: ativos[0] || agendamentos[0] || null,
        ocupado: ativos.length > 0,
      };
    });
  }, [agendaDia]);

  const resumoAgendaDia = useMemo(() => {
    const ocupados = slotsAgenda.filter((slot) => slot.ocupado).length;
    const semProfissional = agendaDia.filter((row) => !row.colaborador && !statusContaComoLivre(row.status)).length;
    return {
      livres: slotsAgenda.length - ocupados,
      ocupados,
      semProfissional,
    };
  }, [agendaDia, slotsAgenda]);

  function carregar() {
    setLoading(true);
    setErro('');
    const params = { limit: 100 };
    if (status) params.status = status;
    if (data) params.data = data;

    api.get('/agendamentos', { params })
      .then((response) => {
        setRows(response.data.data || []);
        setTotal(response.data.total || 0);
      })
      .catch(() => setErro('Nao foi possivel carregar a agenda.'))
      .finally(() => setLoading(false));
  }

  function carregarAgendaDia() {
    const params = { limit: 200 };
    if (data) params.data = data;

    return api.get('/agendamentos', { params })
      .then((response) => {
        const dados = response.data.data || [];
        setAgendaDia(dados);
        setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => setErro('Nao foi possivel atualizar a agenda do dia.'));
  }

  useEffect(() => {
    carregar();
  }, [status, data]);

  useEffect(() => {
    carregarAgendaDia();
    const timer = window.setInterval(carregarAgendaDia, 30000);
    return () => window.clearInterval(timer);
  }, [data]);

  function abrir(row) {
    setSelecionado(row);
    setForm(valorInicial(row));
    setCopiado(false);
    setListaWhatsAppAberta(false);
    setErro('');
  }

  async function salvar(event) {
    event.preventDefault();
    setSaving(true);
    setErro('');
    try {
      const payload = {
        ...form,
        data_agendada: form.data_agendada || null,
        hora_agendada: form.hora_agendada || null,
        local: form.local || null,
      };
      await api.put(`/agendamentos/${selecionado.id}/status`, payload);
      await carregar();
      await carregarAgendaDia();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Nao foi possivel salvar o agendamento.');
    } finally {
      setSaving(false);
    }
  }

  async function copiarAviso() {
    await navigator.clipboard.writeText(mensagemColaborador(selecionado, form));
    setCopiado(true);
  }

  function abrirWhatsApp(numero, nomeColaborador = form?.colaborador) {
    const telefone = normalizarWhatsApp(numero);
    const texto = encodeURIComponent(mensagemColaborador(selecionado, form, nomeColaborador));
    const destino = telefone ? `https://wa.me/${telefone}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(destino, '_blank', 'noopener,noreferrer');
  }

  function atualizarWhatsAppColaborador(nome, whatsapp) {
    setColaboradores((atuais) => {
      const proximos = atuais.map((item) => item.nome === nome ? { ...item, whatsapp } : item);
      localStorage.setItem('mrj_colaboradores_whatsapp', JSON.stringify(proximos));
      return proximos;
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">MRJ</div>
          <h1>Massoterapia RJ</h1>
          <p>Agenda da equipe</p>
        </div>
        <nav>
          <a className="active" href="/painel/">Agenda</a>
        </nav>
        <div className="user-box">
          <span>{usuario?.nome || 'Usuario'}</span>
          <button type="button" onClick={logout}>Sair</button>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <h2>Agendamentos</h2>
            <p>Pedidos recebidos pelo site, aprovacao e aviso manual para colaboradores.</p>
          </div>
          <div className="header-actions">
            <button type="button" onClick={() => setData(ajustarDataISO(data, -1))}>Anterior</button>
            <button type="button" onClick={() => setData(hojeISO())}>Hoje</button>
            <button type="button" onClick={() => setData(ajustarDataISO(data, 1))}>Proximo</button>
            <button className="primary" type="button" onClick={carregar}>Atualizar</button>
          </div>
        </header>

        <section className="schedule-board">
          <div className="schedule-head">
            <div>
              <h3>Agenda do dia</h3>
              <p>{formatarData(data)}{ultimaAtualizacao ? ` - atualizado as ${ultimaAtualizacao}` : ''}</p>
            </div>
            <Campo label="Data">
              <input type="date" value={data} onChange={(event) => setData(event.target.value)} />
            </Campo>
          </div>
          <div className="schedule-summary">
            <span><strong>{resumoAgendaDia.livres}</strong> livres</span>
            <span><strong>{resumoAgendaDia.ocupados}</strong> agendados</span>
            <span><strong>{resumoAgendaDia.semProfissional}</strong> sem profissional</span>
          </div>
          <div className="schedule-grid">
            {slotsAgenda.map((slot) => (
              <button
                key={slot.horario}
                type="button"
                className={slot.ocupado ? 'schedule-slot booked' : 'schedule-slot free'}
                onClick={() => slot.principal && abrir(slot.principal)}
                disabled={!slot.principal}
              >
                <span>{slot.horario}</span>
                {slot.principal ? (
                  <>
                    <strong>{slot.principal.nome_cliente || 'Cliente'}</strong>
                    <small>{slot.principal.colaborador || 'Sem profissional'}</small>
                  </>
                ) : (
                  <>
                    <strong>Livre</strong>
                    <small>Sem atendimento</small>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="stats-grid">
          <Stat label="Total filtrado" value={total} />
          <Stat label="Pendentes" value={resumo.Pendente || 0} tone="pending" />
          <Stat label="Aprovados" value={resumo.Aprovado || 0} tone="approved" />
          <Stat label="Reagendados" value={resumo.Reagendado || 0} tone="rescheduled" />
        </section>

        <section className="filter-bar">
          <Campo label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              {STATUS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Campo>
          <Campo label="Data">
            <input type="date" value={data} onChange={(event) => setData(event.target.value)} />
          </Campo>
          <button type="button" onClick={() => { setStatus(''); setData(''); }}>Limpar</button>
        </section>

        {erro && <div className="alert error">{erro}</div>}

        <section className="table-card">
          <table>
            <thead>
              <tr>
                <th>Horario</th>
                <th>Cliente</th>
                <th>Servico</th>
                <th>Status</th>
                <th>Colaborador</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="empty">Carregando...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan="6" className="empty">Nenhum agendamento encontrado.</td></tr>}
              {!loading && rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{formatarHora(row.hora_agendada)}</strong>
                    <small>{formatarData(row.data_agendada)}</small>
                  </td>
                  <td>
                    <strong>{row.nome_cliente}</strong>
                    <small>{contato(row)}</small>
                  </td>
                  <td>{row.servico}</td>
                  <td><span className={`badge ${STATUS_CLASS[row.status] || ''}`}>{row.status}</span></td>
                  <td>{row.colaborador || '-'}</td>
                  <td><button type="button" onClick={() => abrir(row)}>Abrir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      {selecionado && form && (
        <Modal
          titulo={`Agendamento ${selecionado.codigo}`}
          subtitulo={`${selecionado.nome_cliente} - ${selecionado.servico}`}
          onClose={() => setSelecionado(null)}
        >
          <form onSubmit={salvar} className="modal-grid">
            <div className="info-grid">
              <Info label="Cliente" value={selecionado.nome_cliente} />
              <Info label="Contato" value={contato(selecionado)} />
              <Info label="Servico" value={selecionado.servico} />
              <Info label="Pedido" value={selecionado.observacoes_cliente || '-'} />
            </div>

            <Campo label="Status" required>
              <select required value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {STATUS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Campo>

            <div className="two-cols">
              <Campo label="Data">
                <input type="date" value={form.data_agendada} onChange={(event) => setForm((current) => ({ ...current, data_agendada: event.target.value }))} />
              </Campo>
              <Campo label="Hora">
                <input type="time" value={form.hora_agendada} onChange={(event) => setForm((current) => ({ ...current, hora_agendada: event.target.value }))} />
              </Campo>
            </div>

            <Campo label="Local">
              <input value={form.local} onChange={(event) => setForm((current) => ({ ...current, local: event.target.value }))} />
            </Campo>

            <Campo label="Colaborador">
              <select
                value={form.colaborador}
                onChange={(event) => {
                  setForm((current) => ({ ...current, colaborador: event.target.value }));
                  setListaWhatsAppAberta(false);
                }}
              >
                <option value="">Definir depois</option>
                {colaboradores.map((item) => <option key={item.nome} value={item.nome}>{item.nome}</option>)}
              </select>
            </Campo>

            <Campo label="Observacoes internas">
              <textarea rows="4" value={form.observacoes_gerente} onChange={(event) => setForm((current) => ({ ...current, observacoes_gerente: event.target.value }))} />
            </Campo>

            <div className="modal-actions">
              <button className="primary" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" onClick={copiarAviso}>{copiado ? 'Aviso copiado' : 'Copiar aviso'}</button>
            </div>
          </form>

          <section className="whatsapp-panel">
            <details>
              <summary>Avisar no WhatsApp</summary>
              <p>Abre o WhatsApp com a mensagem pronta. O envio continua manual.</p>
              {!colaboradorSelecionado ? (
                <div className="whatsapp-empty">
                  <span>!</span>
                  <p>Escolha o profissional no campo Colaborador antes de enviar o aviso.</p>
                </div>
              ) : (
                <>
                  <ColaboradorWhatsAppCard
                    item={colaboradorSelecionado}
                    onChange={atualizarWhatsAppColaborador}
                    onSend={abrirWhatsApp}
                    principal
                  />

                  <button
                    type="button"
                    className="whatsapp-expand"
                    onClick={() => setListaWhatsAppAberta((aberta) => !aberta)}
                  >
                    {listaWhatsAppAberta ? 'Ocultar contatos' : 'Adicionar outro contato'}
                  </button>

                  {listaWhatsAppAberta && (
                    <div className="whatsapp-list">
                      {colaboradores.map((item) => (
                        <ColaboradorWhatsAppCard
                          key={item.nome}
                          item={item}
                          onChange={atualizarWhatsAppColaborador}
                          onSend={abrirWhatsApp}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </details>
          </section>
        </Modal>
      )}
    </main>
  );
}

function ColaboradorWhatsAppCard({ item, onChange, onSend, principal = false }) {
  return (
    <div className={principal ? 'whatsapp-selected' : 'whatsapp-row'}>
      <div className={`whatsapp-avatar ${item.avatarClass}`}>{item.iniciais}</div>
      <label className="whatsapp-person">
        <strong>{item.nome}</strong>
        <input
          type="tel"
          placeholder="(21) 99999-9999"
          value={item.whatsapp}
          onChange={(event) => onChange(item.nome, event.target.value)}
        />
      </label>
      <button type="button" className="whatsapp-send" onClick={() => onSend(item.whatsapp, item.nome)}>
        {principal ? 'Enviar aviso' : 'Enviar'}
      </button>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
