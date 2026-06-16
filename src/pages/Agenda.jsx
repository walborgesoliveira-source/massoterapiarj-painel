import { useEffect, useMemo, useState } from 'react';
import Campo from '../components/Campo';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STATUS = ['Pendente', 'Aprovado', 'Recusado', 'Reagendado', 'Cancelado', 'Concluído', 'Não compareceu', 'Excluído'];
const SESSION_MIN = 50;
const SEM_ATENDIMENTO_MSG = '❌ Sem Atendimento! Agenda em atualização! 📱 Entre em contato pelo nosso WhatsApp para agendar.';
const ESCALA_OFICIAL_VIGENCIA = '15/06/2026 a 20/06/2026';

const TURNOS_PADRAO = [
  { id: 'segunda_diana', label: 'Segunda · Diana', inicio: '09:00', fim: '12:00' },
  { id: 'segunda_equipe', label: 'Segunda · Amanda e Fabíola', inicio: '12:00', fim: '20:30' },
  { id: 'terca_diana', label: 'Terça · Diana', inicio: '09:00', fim: '15:30' },
  { id: 'terca_ellaine', label: 'Terça · Ellaine', inicio: '11:00', fim: '19:00' },
  { id: 'terca_selma', label: 'Terça · Selma', inicio: '11:30', fim: '20:30' },
  { id: 'quarta_diana', label: 'Quarta · Diana', inicio: '09:00', fim: '20:30' },
  { id: 'quarta_selma', label: 'Quarta · Selma', inicio: '12:00', fim: '20:30' },
  { id: 'quinta_selma', label: 'Quinta · Selma', inicio: '10:00', fim: '20:30' },
  { id: 'quinta_ellaine', label: 'Quinta · Ellaine', inicio: '11:00', fim: '19:00' },
  { id: 'sexta_diana', label: 'Sexta · Diana', inicio: '09:00', fim: '15:30' },
  { id: 'sexta_fabiola', label: 'Sexta · Fabíola', inicio: '10:00', fim: '20:30' },
  { id: 'sexta_amanda', label: 'Sexta · Amanda', inicio: '15:30', fim: '20:30' },
  { id: 'sabado_diana', label: 'Sábado · Diana', inicio: '09:00', fim: '19:00' },
];

const PROFS_TURNOS_PADRAO = [
  { nome: 'Diana', turno: 'segunda_diana', cargo: 'Massoterapeuta clínica' },
  { nome: 'Amanda', turno: 'segunda_equipe', cargo: 'Massoterapeuta clínica' },
  { nome: 'Fabíola', turno: 'segunda_equipe', cargo: 'Massoterapeuta clínica' },
  { nome: 'Diana', turno: 'terca_diana', cargo: 'Massoterapeuta clínica' },
  { nome: 'Ellaine', turno: 'terca_ellaine', cargo: 'Massoterapeuta clínica' },
  { nome: 'Selma', turno: 'terca_selma', cargo: 'Massoterapeuta clínica' },
  { nome: 'Diana', turno: 'quarta_diana', cargo: 'Massoterapeuta clínica' },
  { nome: 'Selma', turno: 'quarta_selma', cargo: 'Massoterapeuta clínica' },
  { nome: 'Selma', turno: 'quinta_selma', cargo: 'Massoterapeuta clínica' },
  { nome: 'Ellaine', turno: 'quinta_ellaine', cargo: 'Massoterapeuta clínica' },
  { nome: 'Diana', turno: 'sexta_diana', cargo: 'Massoterapeuta clínica' },
  { nome: 'Fabíola', turno: 'sexta_fabiola', cargo: 'Massoterapeuta clínica' },
  { nome: 'Amanda', turno: 'sexta_amanda', cargo: 'Massoterapeuta clínica' },
  { nome: 'Diana', turno: 'sabado_diana', cargo: 'Massoterapeuta clínica' },
];

const STORAGE_PROFS_TURNOS = 'mrj_profissionais_turnos';
const ESCALA_OFICIAL = {
  '2026-06-15': [
    { inicio: '09:00', fim: '12:00', profissionais: ['Diana'] },
    { inicio: '12:00', fim: '20:30', profissionais: ['Amanda', 'Fabíola'] },
  ],
  '2026-06-16': [
    { inicio: '09:00', fim: '15:30', profissionais: ['Diana'] },
    { inicio: '11:00', fim: '19:00', profissionais: ['Ellaine'] },
    { inicio: '11:30', fim: '20:30', profissionais: ['Selma'] },
  ],
  '2026-06-17': [
    { inicio: '09:00', fim: '20:30', profissionais: ['Diana'] },
    { inicio: '12:00', fim: '20:30', profissionais: ['Selma'] },
  ],
  '2026-06-18': [
    { inicio: '10:00', fim: '20:30', profissionais: ['Selma'] },
    { inicio: '11:00', fim: '19:00', profissionais: ['Ellaine'] },
  ],
  '2026-06-19': [
    { inicio: '09:00', fim: '15:30', profissionais: ['Diana'] },
    { inicio: '10:00', fim: '20:30', profissionais: ['Fabíola'] },
    { inicio: '15:30', fim: '20:30', profissionais: ['Amanda'] },
  ],
  '2026-06-20': [
    { inicio: '09:00', fim: '19:00', profissionais: ['Diana'] },
  ],
};
const DISPONIBILIDADE_INICIAL = {
  data: hojeISO(),
  hora_inicio: '12:00',
  hora_fim: '20:30',
  funcionario: 'Amanda',
  disponivel: false,
  substituto: '',
  motivo: '',
  observacoes: '',
};

const STATUS_CLASS = {
  Pendente: 'pending',
  Aprovado: 'approved',
  Recusado: 'danger',
  Reagendado: 'rescheduled',
  Cancelado: 'danger',
  Concluído: 'done',
  'Não compareceu': 'danger',
  Excluído: 'danger',
};

const COLABORADORES_PADRAO = [
  { nome: 'Selma', whatsapp: '', iniciais: 'SE', avatarClass: 'mint' },
  { nome: 'Ellaine', whatsapp: '21980059845', iniciais: 'EL', avatarClass: 'blue' },
  { nome: 'Fabíola', whatsapp: '', iniciais: 'FA', avatarClass: 'violet' },
  { nome: 'Diana', whatsapp: '', iniciais: 'DI', avatarClass: 'amber' },
  { nome: 'Amanda', whatsapp: '', iniciais: 'AM', avatarClass: 'coral' },
  { nome: 'Equipe Massoterapia RJ', whatsapp: '', iniciais: 'MR', avatarClass: 'brown' },
];

const HORARIOS_AGENDA = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
];

function carregarColaboradores() {
  try {
    const salvos = JSON.parse(localStorage.getItem('mrj_colaboradores_whatsapp') || '[]');
    return COLABORADORES_PADRAO.map((item) => {
      const salvo = salvos.find((row) => row.nome === item.nome || (item.nome === 'Fabíola' && row.nome === 'Fabiola'));
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
  return ['Cancelado', 'Recusado', 'Não compareceu', 'Excluído'].includes(status);
}

function horarioDentroIntervalo(horario, inicio, fim) {
  const inicioMin = minutosDoDia(inicio);
  const fimMin = minutosDoDia(fim);
  const horarioMin = minutosDoDia(horario);
  if (inicioMin === null || fimMin === null || horarioMin === null) return false;
  return horarioMin >= inicioMin && horarioMin + SESSION_MIN <= fimMin;
}

function profissionaisDaEscala(data, horario) {
  const blocos = ESCALA_OFICIAL[data] || [];
  const nomes = blocos
    .filter((bloco) => horarioDentroIntervalo(horario, bloco.inicio, bloco.fim))
    .flatMap((bloco) => bloco.profissionais);
  return [...new Set(nomes)];
}

function profissionaisDisponiveis(data, horario, regras = []) {
  const mapa = new Map(profissionaisDaEscala(data, horario).map((nome) => [nome, nome]));
  regras
    .filter((regra) => horarioDentroIntervalo(horario, regra.hora_inicio, regra.hora_fim))
    .forEach((regra) => {
      if (regra.disponivel === false) {
        mapa.delete(regra.funcionario);
        if (regra.substituto) mapa.set(regra.substituto, regra.substituto);
      } else {
        mapa.set(regra.funcionario, regra.funcionario);
      }
    });
  return Array.from(mapa.values());
}

function normalizarHoraCampo(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

function minutosDoDia(valor) {
  const [hora, minuto] = normalizarHoraCampo(valor).split(':').map(Number);
  return Number.isFinite(hora) && Number.isFinite(minuto) ? hora * 60 + minuto : null;
}

function duracaoAgendamento(valor) {
  const duracao = Number(valor || SESSION_MIN);
  return Number.isFinite(duracao) && duracao > 0 ? duracao : SESSION_MIN;
}

function atendimentoAfetaHorario(row, horario) {
  if (statusContaComoLivre(row.status)) return false;
  const inicio = minutosDoDia(row.hora_agendada);
  const slot = minutosDoDia(horario);
  if (inicio === null || slot === null) return false;
  const blocoAtendimento = duracaoAgendamento(row.duracao_media);
  const blocoSlot = SESSION_MIN;
  return inicio < slot + blocoSlot && slot < inicio + blocoAtendimento;
}

function profissionaisOcupadasNoHorario(rows, horario) {
  return new Set(
    rows
      .filter((row) => row.colaborador && atendimentoAfetaHorario(row, horario))
      .map((row) => row.colaborador)
  );
}

function compararHorarios(a, b) {
  return (minutosDoDia(a) ?? 0) - (minutosDoDia(b) ?? 0);
}

function formatarAtualizacaoBrasilia() {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
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
  const { usuario, logout, atualizarUsuario } = useAuth();
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
  const [turnosAberto, setTurnosAberto] = useState(false);
  const [disponibilidade, setDisponibilidade] = useState([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [dispLoading, setDispLoading] = useState(false);
  const [dispSaving, setDispSaving] = useState(false);
  const [dispForm, setDispForm] = useState(() => ({ ...DISPONIBILIDADE_INICIAL, data: hojeISO() }));
  const [profsTurnos] = useState(PROFS_TURNOS_PADRAO);
  const escalaDia = ESCALA_OFICIAL[data] || [];
  const semEscalaOficial = escalaDia.length === 0;

  const [contaAberta, setContaAberta] = useState(false);
  const [contaForm, setContaForm] = useState({
    nome: usuario?.nome || '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
  });
  const [contaSaving, setContaSaving] = useState(false);
  const [contaErro, setContaErro] = useState('');
  const [contaSucesso, setContaSucesso] = useState('');

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

    const horarios = [...new Set([
      ...HORARIOS_AGENDA,
      ...horariosDisponiveis.map((slot) => slot.hora).filter(Boolean),
      ...agendaDia
        .filter((row) => !statusContaComoLivre(row.status))
        .map(horarioChave)
        .filter((horario) => horario && horario !== '-'),
    ])].sort(compararHorarios);

    return horarios.map((horario) => {
      const agendamentos = porHorario[horario] || [];
      const ativos = agendamentos.filter((row) => !statusContaComoLivre(row.status));
      const disponibilidadeFinal = horariosDisponiveis.find((slot) => slot.hora === horario);
      const profissionais = disponibilidadeFinal?.profissionais || profissionaisDisponiveis(data, horario, disponibilidade);
      const ocupadas = disponibilidadeFinal
        ? new Set(disponibilidadeFinal.profissionais_ocupados || [])
        : profissionaisOcupadasNoHorario(agendaDia, horario);
      const profissionaisLivres = disponibilidadeFinal?.profissionais_livres || profissionais.filter((nome) => !ocupadas.has(nome));
      const principal = ativos[0] || null;
      return {
        horario,
        agendamentos,
        principal,
        ocupado: Boolean(principal),
        profissionais: profissionaisLivres,
        semAtendimento: disponibilidadeFinal ? !disponibilidadeFinal.disponivel : profissionaisLivres.length === 0,
      };
    });
  }, [agendaDia, data, disponibilidade, horariosDisponiveis]);

  const resumoAgendaDia = useMemo(() => {
    const ocupados = slotsAgenda.filter((slot) => slot.ocupado).length;
    const semAtendimento = slotsAgenda.filter((slot) => slot.semAtendimento).length;
    const semProfissional = agendaDia.filter((row) => !row.colaborador && !statusContaComoLivre(row.status)).length;
    return {
      livres: slotsAgenda.length - ocupados - semAtendimento,
      ocupados,
      semAtendimento,
      semProfissional,
    };
  }, [agendaDia, slotsAgenda]);

  const disponibilidadePorHorario = useMemo(() => {
    return HORARIOS_AGENDA.map((horario) => {
      const regras = disponibilidade.filter((regra) => horarioDentroIntervalo(horario, regra.hora_inicio, regra.hora_fim));
      return { horario, regras };
    }).filter((item) => item.regras.length > 0);
  }, [disponibilidade]);

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
        setUltimaAtualizacao(formatarAtualizacaoBrasilia());
      })
      .catch(() => setErro('Nao foi possivel atualizar a agenda do dia.'));
  }

  function carregarDisponibilidade() {
    if (!data) return Promise.resolve();
    setDispLoading(true);
    return api.get('/agendamentos/colaboradores-disponibilidade', { params: { data } })
      .then((response) => {
        setDisponibilidade(response.data.registros || []);
      })
      .catch(() => setErro('Nao foi possivel carregar a disponibilidade dos colaboradores.'))
      .finally(() => setDispLoading(false));
  }

  function carregarHorariosDisponiveis() {
    if (!data) return Promise.resolve();
    return api.get('/agendamentos/horarios-disponiveis', { params: { data, duracao: SESSION_MIN } })
      .then((response) => {
        setHorariosDisponiveis(response.data.horarios || []);
      })
      .catch(() => setErro('Nao foi possivel carregar os horarios disponiveis.'))
  }

  useEffect(() => {
    carregar();
  }, [status, data]);

  useEffect(() => {
    carregarAgendaDia();
    carregarDisponibilidade();
    carregarHorariosDisponiveis();
    const timer = window.setInterval(carregarAgendaDia, 30000);
    return () => window.clearInterval(timer);
  }, [data]);

  useEffect(() => {
    setContaForm((current) => ({ ...current, nome: usuario?.nome || '' }));
  }, [usuario?.nome]);

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

  function salvarTurnos(event) {
    event.preventDefault();
    localStorage.setItem(STORAGE_PROFS_TURNOS, JSON.stringify(PROFS_TURNOS_PADRAO));
    setTurnosAberto(false);
  }

  async function salvarDisponibilidade(event) {
    event.preventDefault();
    setDispSaving(true);
    setErro('');
    try {
      await api.post('/agendamentos/colaboradores-disponibilidade', {
        ...dispForm,
        substituto: dispForm.disponivel ? null : dispForm.substituto || null,
      });
      setDispForm((current) => ({
        ...DISPONIBILIDADE_INICIAL,
        data: current.data,
        hora_inicio: current.hora_inicio,
        hora_fim: current.hora_fim,
      }));
      await carregarDisponibilidade();
      await carregarHorariosDisponiveis();
    } catch (error) {
      setErro(error.response?.data?.erros?.join(' ') || error.response?.data?.erro || 'Nao foi possivel salvar a disponibilidade.');
    } finally {
      setDispSaving(false);
    }
  }

  async function removerDisponibilidade(id) {
    setErro('');
    try {
      await api.delete(`/agendamentos/colaboradores-disponibilidade/${id}`);
      await carregarDisponibilidade();
      await carregarHorariosDisponiveis();
    } catch (error) {
      setErro(error.response?.data?.erro || 'Nao foi possivel remover a disponibilidade.');
    }
  }

  function abrirConta() {
    setContaForm({
      nome: usuario?.nome || '',
      senha_atual: '',
      nova_senha: '',
      confirmar_senha: '',
    });
    setContaErro('');
    setContaSucesso('');
    setContaAberta(true);
  }

  async function salvarConta(event) {
    event.preventDefault();
    setContaSaving(true);
    setContaErro('');
    setContaSucesso('');

    if (contaForm.nova_senha || contaForm.confirmar_senha || contaForm.senha_atual) {
      if (contaForm.nova_senha.length < 8) {
        setContaErro('A nova senha deve ter ao menos 8 caracteres.');
        setContaSaving(false);
        return;
      }
      if (contaForm.nova_senha !== contaForm.confirmar_senha) {
        setContaErro('A confirmação da senha não confere.');
        setContaSaving(false);
        return;
      }
    }

    try {
      const payload = {
        nome: contaForm.nome,
        senha_atual: contaForm.senha_atual || undefined,
        nova_senha: contaForm.nova_senha || undefined,
      };
      const { data: usuarioAtualizado } = await api.put('/usuarios/me', payload);
      atualizarUsuario(usuarioAtualizado);
      setContaForm((current) => ({
        ...current,
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: '',
      }));
      setContaSucesso('Dados atualizados com sucesso.');
    } catch (error) {
      setContaErro(error.response?.data?.erro || 'Nao foi possivel atualizar seus dados.');
    } finally {
      setContaSaving(false);
    }
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
          <a href="#disponibilidade-colaboradores">Disponibilidade</a>
          <button type="button" onClick={() => setTurnosAberto(true)}>Turnos</button>
        </nav>
        <div className="user-box">
          <span>{usuario?.nome || 'Usuario'}</span>
          <small>{usuario?.email}</small>
          <button type="button" onClick={abrirConta}>Minha conta</button>
          <a href="/" style={{
            display: 'block', textAlign: 'center', fontSize: 13,
            color: '#cfbca6', textDecoration: 'none', marginTop: 4,
          }}>← Voltar para o Site</a>
          <button type="button" onClick={logout}>Sair</button>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <h2>Agendamentos</h2>
            <p>Pedidos recebidos pelo site, aprovacao e aviso manual para colaboradores.</p>
            <p className="page-update">Escala oficial: {ESCALA_OFICIAL_VIGENCIA} · America/Sao_Paulo</p>
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
              <p>{formatarData(data)}{ultimaAtualizacao ? ` - agenda atualizada em ${ultimaAtualizacao} - horário de Brasília` : ''}</p>
            </div>
            <Campo label="Data">
              <input type="date" value={data} onChange={(event) => setData(event.target.value)} />
            </Campo>
          </div>
          <div className="schedule-summary">
            <span><strong>{resumoAgendaDia.livres}</strong> livres</span>
            <span><strong>{resumoAgendaDia.ocupados}</strong> agendados</span>
            <span><strong>{resumoAgendaDia.semAtendimento}</strong> sem atendimento</span>
            <span><strong>{resumoAgendaDia.semProfissional}</strong> sem profissional</span>
          </div>
          {semEscalaOficial && (
            <div className="no-attendance-message">
              {SEM_ATENDIMENTO_MSG}
            </div>
          )}
          <div className="schedule-grid">
            {slotsAgenda.map((slot) => (
              <button
                key={slot.horario}
                type="button"
                className={slot.semAtendimento ? 'schedule-slot blocked' : slot.ocupado ? 'schedule-slot booked' : 'schedule-slot free'}
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
                    <strong>{slot.semAtendimento ? '❌ Sem Atendimento' : 'Livre'}</strong>
                    <small>{slot.semAtendimento ? 'Fora da escala oficial' : slot.profissionais.join(', ')}</small>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <section id="disponibilidade-colaboradores" className="availability-board">
          <div className="availability-head">
            <div>
              <h3>Disponibilidade dos Colaboradores</h3>
              <p>Controle exceções do dia, substituições e indisponibilidades temporárias.</p>
            </div>
            <span>{formatarData(data)}</span>
          </div>

          <form className="availability-form" onSubmit={salvarDisponibilidade}>
            <Campo label="Data">
              <input
                type="date"
                value={dispForm.data}
                onChange={(event) => {
                  setDispForm((current) => ({ ...current, data: event.target.value }));
                  setData(event.target.value);
                }}
              />
            </Campo>
            <Campo label="Horário inicial">
              <input type="time" value={dispForm.hora_inicio} onChange={(event) => setDispForm((current) => ({ ...current, hora_inicio: event.target.value }))} />
            </Campo>
            <Campo label="Horário final">
              <input type="time" value={dispForm.hora_fim} onChange={(event) => setDispForm((current) => ({ ...current, hora_fim: event.target.value }))} />
            </Campo>
            <Campo label="Funcionário">
              <select value={dispForm.funcionario} onChange={(event) => setDispForm((current) => ({ ...current, funcionario: event.target.value }))}>
                {COLABORADORES_PADRAO.filter((item) => item.nome !== 'Equipe Massoterapia RJ').map((item) => (
                  <option key={item.nome} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Disponível hoje">
              <select
                value={dispForm.disponivel ? 'sim' : 'nao'}
                onChange={(event) => setDispForm((current) => ({ ...current, disponivel: event.target.value === 'sim' }))}
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </Campo>
            <Campo label="Substituir por">
              <select
                value={dispForm.substituto}
                disabled={dispForm.disponivel}
                onChange={(event) => setDispForm((current) => ({ ...current, substituto: event.target.value }))}
              >
                <option value="">Sem substituta</option>
                {COLABORADORES_PADRAO.filter((item) => item.nome !== 'Equipe Massoterapia RJ' && item.nome !== dispForm.funcionario).map((item) => (
                  <option key={item.nome} value={item.nome}>{item.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Motivo">
              <input value={dispForm.motivo} onChange={(event) => setDispForm((current) => ({ ...current, motivo: event.target.value }))} placeholder="Atendimento externo" />
            </Campo>
            <Campo label="Observações">
              <input value={dispForm.observacoes} onChange={(event) => setDispForm((current) => ({ ...current, observacoes: event.target.value }))} />
            </Campo>
            <button className="primary" type="submit" disabled={dispSaving}>{dispSaving ? 'Salvando...' : 'Registrar alteração'}</button>
          </form>

          <div className="availability-grid">
            <div>
              <h4>Controle visual na agenda</h4>
              {disponibilidadePorHorario.length === 0 && <p className="muted">Nenhuma exceção registrada para esta data.</p>}
              {disponibilidadePorHorario.map((item) => (
                <div className="availability-slot" key={item.horario}>
                  <strong>{item.horario}</strong>
                  {item.regras.map((regra) => (
                    <span key={regra.id} className={regra.disponivel ? 'ok' : 'blocked'}>
                      {regra.disponivel ? '✓' : '✕'} {regra.funcionario}
                      {!regra.disponivel && regra.substituto ? ` → substituída por ${regra.substituto}` : ''}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <h4>Histórico de alterações</h4>
              <div className="availability-history">
                {dispLoading && <p className="muted">Carregando...</p>}
                {!dispLoading && disponibilidade.length === 0 && <p className="muted">Sem alterações registradas.</p>}
                {disponibilidade.map((regra) => (
                  <div className="history-row" key={regra.id}>
                    <div>
                      <strong>{regra.funcionario}</strong>
                      <span>{formatarData(regra.data)} · {formatarHora(regra.hora_inicio)}-{formatarHora(regra.hora_fim)}</span>
                      <small>{regra.disponivel ? 'Disponível' : `Indisponível${regra.substituto ? ` · substituta: ${regra.substituto}` : ''}`}</small>
                      {(regra.motivo || regra.observacoes) && <em>{[regra.motivo, regra.observacoes].filter(Boolean).join(' · ')}</em>}
                    </div>
                    <button type="button" onClick={() => removerDisponibilidade(regra.id)}>Remover</button>
                  </div>
                ))}
              </div>
            </div>
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
                  <td data-label="Horario">
                    <strong>{formatarHora(row.hora_agendada)}</strong>
                    <small>{formatarData(row.data_agendada)}</small>
                  </td>
                  <td data-label="Cliente">
                    <strong>{row.nome_cliente}</strong>
                    <small>{contato(row)}</small>
                  </td>
                  <td data-label="Servico">{row.servico}</td>
                  <td data-label="Status"><span className={`badge ${STATUS_CLASS[row.status] || ''}`}>{row.status}</span></td>
                  <td data-label="Colaborador">{row.colaborador || '-'}</td>
                  <td data-label="Acoes"><button type="button" onClick={() => abrir(row)}>Abrir</button></td>
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

      {turnosAberto && (
        <Modal
          titulo="Gerenciar Turnos"
          subtitulo="Turno fixo por profissional · afeta horários do site imediatamente"
          onClose={() => setTurnosAberto(false)}
        >
          <form onSubmit={salvarTurnos} className="modal-grid">
            <p style={{ color: '#8c7b6a', fontSize: 13, margin: 0 }}>
              Escala fixa da agenda oficial. Horários sem profissional aparecem como Sem Atendimento no site e no painel.
            </p>
            {profsTurnos.map((prof) => (
              <div key={`${prof.nome}-${prof.turno}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(184,137,90,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#946b40', flex: '0 0 auto',
                }}>{prof.nome[0]}</div>
                <div style={{ flex: 1 }}>
                  <label className="field">
                    <span>{prof.nome}</span>
                    <select value={prof.turno} disabled>
                      {TURNOS_PADRAO.map((t) => (
                        <option key={t.id} value={t.id}>{t.label} ({t.inicio}–{t.fim})</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="primary" type="submit">Salvar turnos</button>
              <button type="button" onClick={() => setTurnosAberto(false)}>Fechar</button>
            </div>
          </form>
        </Modal>
      )}

      {contaAberta && (
        <Modal
          titulo="Minha conta"
          subtitulo={usuario?.email}
          onClose={() => setContaAberta(false)}
        >
          <form onSubmit={salvarConta} className="modal-grid account-form">
            {contaErro && <div className="alert error">{contaErro}</div>}
            {contaSucesso && <div className="alert success">{contaSucesso}</div>}

            <Campo label="Nome" required>
              <input
                required
                value={contaForm.nome}
                onChange={(event) => setContaForm((current) => ({ ...current, nome: event.target.value }))}
              />
            </Campo>

            <div className="password-panel">
              <h3>Trocar senha</h3>
              <Campo label="Senha atual">
                <input
                  type="password"
                  value={contaForm.senha_atual}
                  onChange={(event) => setContaForm((current) => ({ ...current, senha_atual: event.target.value }))}
                />
              </Campo>
              <div className="two-cols">
                <Campo label="Nova senha">
                  <input
                    type="password"
                    minLength="8"
                    value={contaForm.nova_senha}
                    onChange={(event) => setContaForm((current) => ({ ...current, nova_senha: event.target.value }))}
                  />
                </Campo>
                <Campo label="Confirmar nova senha">
                  <input
                    type="password"
                    minLength="8"
                    value={contaForm.confirmar_senha}
                    onChange={(event) => setContaForm((current) => ({ ...current, confirmar_senha: event.target.value }))}
                  />
                </Campo>
              </div>
            </div>

            <div className="modal-actions">
              <button className="primary" type="submit" disabled={contaSaving}>
                {contaSaving ? 'Salvando...' : 'Salvar dados'}
              </button>
              <button type="button" onClick={() => setContaAberta(false)}>Fechar</button>
            </div>
          </form>
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
