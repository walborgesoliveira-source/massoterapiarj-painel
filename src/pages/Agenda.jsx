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
  { nome: 'Selma', whatsapp: '' },
  { nome: 'Ellaine', whatsapp: '' },
  { nome: 'Fabiola', whatsapp: '' },
  { nome: 'Diana', whatsapp: '' },
  { nome: 'Amanda', whatsapp: '' },
  { nome: 'Equipe Massoterapia RJ', whatsapp: '' },
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

function mensagemColaborador(row, form) {
  const status = form?.status || row.status || 'Pendente';
  const data = formatarData(form?.data_agendada || row.data_agendada);
  const hora = formatarHora(form?.hora_agendada || row.hora_agendada);
  const local = form?.local || row.local || '-';
  const colaborador = form?.colaborador || row.colaborador || '-';
  const linhas = [
    `Agendamento ${status} - Massoterapia RJ`,
    '',
    `Codigo: ${row.codigo || '-'}`,
    `Cliente: ${row.nome_cliente || '-'}`,
    `Contato: ${contato(row)}`,
    `Servico: ${row.servico || '-'}`,
    `Data: ${data}`,
    `Horario: ${hora}`,
    `Local: ${local}`,
    `Colaborador: ${colaborador}`,
  ];

  if (row.observacoes_cliente) {
    linhas.push('', `Observacoes do cliente: ${row.observacoes_cliente}`);
  }
  if (form?.observacoes_gerente) {
    linhas.push('', `Observacoes internas: ${form.observacoes_gerente}`);
  }

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

  const resumo = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
  }, [rows]);

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

  useEffect(() => {
    carregar();
  }, [status, data]);

  function abrir(row) {
    setSelecionado(row);
    setForm(valorInicial(row));
    setCopiado(false);
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

  function abrirWhatsApp(numero) {
    const telefone = normalizarWhatsApp(numero);
    if (!telefone) return;
    const texto = encodeURIComponent(mensagemColaborador(selecionado, form));
    window.open(`https://wa.me/${telefone}?text=${texto}`, '_blank', 'noopener,noreferrer');
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
            <button type="button" onClick={() => setData(hojeISO())}>Hoje</button>
            <button className="primary" type="button" onClick={carregar}>Atualizar</button>
          </div>
        </header>

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
              <select value={form.colaborador} onChange={(event) => setForm((current) => ({ ...current, colaborador: event.target.value }))}>
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
            <h3>Avisar colaborador no WhatsApp</h3>
            <p>Abre o WhatsApp com a mensagem pronta. O envio continua manual.</p>
            <div className="whatsapp-grid">
              {colaboradores.map((item) => (
                <div className="whatsapp-contact" key={item.nome}>
                  <label>
                    <span>{item.nome}</span>
                    <input
                      type="tel"
                      placeholder="(21) 99999-9999"
                      value={item.whatsapp}
                      onChange={(event) => atualizarWhatsAppColaborador(item.nome, event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!item.whatsapp}
                    onClick={() => abrirWhatsApp(item.whatsapp)}
                  >
                    Enviar aviso
                  </button>
                </div>
              ))}
            </div>
          </section>
        </Modal>
      )}
    </main>
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
