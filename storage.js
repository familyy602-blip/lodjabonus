/**
 * storage.js - Camada de dados com Supabase
 * Base de dados na nuvem (substitui LocalStorage)
 */

const Storage = {
  generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  generateToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 12; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  },

  generatePrizeCode(prizeName) {
    const short = (prizeName || 'PREMIO').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() || 'PREMIO';
    return `${short}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  _db() {
    if (!window.supabaseClient) throw new Error('Supabase não inicializado');
    return window.supabaseClient;
  },

  // ----- CLIENTES -----
  async getClientes() {
    const { data, error } = await this._db().from('clientes').select('*').order('data_cadastro', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data || []).map(r => this._mapClienteFromDb(r));
  },

  async getClienteById(id) {
    const { data, error } = await this._db().from('clientes').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this._mapClienteFromDb(data);
  },

  async getClienteByToken(token) {
    const { data, error } = await this._db().from('clientes').select('*').eq('token', token).maybeSingle();
    if (error || !data) return null;
    return this._mapClienteFromDb(data);
  },

  _mapClienteFromDb(row) {
    return {
      id: row.id,
      nome: row.nome,
      telefone: row.telefone || '',
      codigoCliente: row.codigo_cliente || '',
      noGrupoWhatsapp: !!row.no_grupo_whatsapp,
      totalPecas: row.total_pecas || 0,
      totalCompras: row.total_compras || 0,
      elegivel: !!row.elegivel,
      token: row.token,
      tokenUsado: !!row.token_usado,
      dataTokenGerado: row.data_token_gerado,
      dataSorteio: row.data_sorteio,
      ultimoPremio: row.ultimo_premio,
      ultimoCodigo: row.ultimo_codigo,
      estado: row.estado || 'activo',
      dataCadastro: row.data_cadastro
    };
  },

  _mapClienteToDb(c) {
    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone || '',
      codigo_cliente: c.codigoCliente || '',
      no_grupo_whatsapp: !!c.noGrupoWhatsapp,
      total_pecas: c.totalPecas || 0,
      total_compras: c.totalCompras || 0,
      elegivel: !!c.elegivel,
      token: c.token || null,
      token_usado: !!c.tokenUsado,
      data_token_gerado: c.dataTokenGerado || null,
      data_sorteio: c.dataSorteio || null,
      ultimo_premio: c.ultimoPremio || null,
      ultimo_codigo: c.ultimoCodigo || null,
      estado: c.estado || 'activo',
      data_cadastro: c.dataCadastro || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async addCliente(cliente) {
    const id = this.generateId('cli_');
    const novo = {
      id,
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      codigoCliente: cliente.codigoCliente || '',
      noGrupoWhatsapp: !!cliente.noGrupoWhatsapp,
      totalPecas: cliente.totalPecas || 0,
      totalCompras: cliente.totalCompras || 0,
      elegivel: false,
      token: null,
      tokenUsado: false,
      estado: 'activo',
      dataCadastro: new Date().toISOString()
    };
    novo.elegivel = novo.estado === 'activo' && novo.noGrupoWhatsapp && (novo.totalPecas || 0) >= 5;

    const { error } = await this._db().from('clientes').insert(this._mapClienteToDb(novo));
    if (error) { console.error('addCliente', error); throw error; }
    return novo;
  },

  async updateCliente(id, updates) {
    const atual = await this.getClienteById(id);
    if (!atual) return null;
    const merged = { ...atual, ...updates };
    merged.elegivel = merged.estado === 'activo' && merged.noGrupoWhatsapp === true && (merged.totalPecas || 0) >= 5;

    const { error } = await this._db().from('clientes').update(this._mapClienteToDb(merged)).eq('id', id);
    if (error) { console.error('updateCliente', error); throw error; }
    return merged;
  },

  async deleteCliente(id) {
    const { error } = await this._db().from('clientes').delete().eq('id', id);
    if (error) { console.error(error); throw error; }
  },

  async getClientesElegiveis() {
    const todos = await this.getClientes();
    return todos.filter(c => c.elegivel && !c.tokenUsado);
  },

  // ----- COMPRAS -----
  async getCompras() {
    const { data, error } = await this._db().from('compras').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data || []).map(r => ({
      id: r.id,
      clienteId: r.cliente_id,
      numeroFactura: r.numero_factura,
      quantidadePecas: r.quantidade_pecas,
      valor: r.valor,
      data: r.data,
      observacao: r.observacao
    }));
  },

  async nextFacturaNumero() {
    const compras = await this.getCompras();
    let max = 0;
    compras.forEach(c => {
      const n = String(c.numeroFactura || '').replace(/\D/g, '');
      if (n) max = Math.max(max, parseInt(n, 10) || 0);
    });
    const next = max + 1;
    return String(next).padStart(3, '0');
  },

  async addCompra(compra) {
    const id = this.generateId('cmp_');
    let numero = (compra.numeroFactura || '').trim();
    if (!numero) numero = await this.nextFacturaNumero();
    const row = {
      id,
      cliente_id: compra.clienteId,
      numero_factura: numero,
      quantidade_pecas: parseInt(compra.quantidadePecas) || 1,
      valor: parseFloat(compra.valor) || 0,
      data: compra.data || new Date().toISOString().split('T')[0],
      observacao: compra.observacao || ''
    };
    const { error } = await this._db().from('compras').insert(row);
    if (error) { console.error(error); throw error; }

    const { data: comprasCliente } = await this._db().from('compras').select('quantidade_pecas').eq('cliente_id', compra.clienteId);
    const totalPecas = (comprasCliente || []).reduce((s, c) => s + (c.quantidade_pecas || 0), 0);
    const totalCompras = (comprasCliente || []).length;
    await this.updateCliente(compra.clienteId, { totalPecas, totalCompras });

    return { id, clienteId: compra.clienteId, numeroFactura: row.numero_factura, quantidadePecas: row.quantidade_pecas, valor: row.valor, data: row.data, observacao: row.observacao };
  },

  async updateCompra(id, compra) {
    const atual = (await this.getCompras()).find(c => c.id === id);
    if (!atual) throw new Error('Compra não encontrada');
    const row = {
      cliente_id: compra.clienteId || atual.clienteId,
      numero_factura: (compra.numeroFactura != null ? compra.numeroFactura : atual.numeroFactura) || '',
      quantidade_pecas: parseInt(compra.quantidadePecas != null ? compra.quantidadePecas : atual.quantidadePecas) || 1,
      valor: parseFloat(compra.valor != null ? compra.valor : atual.valor) || 0,
      data: compra.data || atual.data,
      observacao: compra.observacao != null ? compra.observacao : (atual.observacao || '')
    };
    const { error } = await this._db().from('compras').update(row).eq('id', id);
    if (error) { console.error(error); throw error; }

    // Recalcular totais do cliente antigo e do novo (se mudou)
    const ids = new Set([atual.clienteId, row.cliente_id].filter(Boolean));
    for (const cid of ids) {
      const { data: lista } = await this._db().from('compras').select('quantidade_pecas').eq('cliente_id', cid);
      const totalPecas = (lista || []).reduce((s, c) => s + (c.quantidade_pecas || 0), 0);
      await this.updateCliente(cid, { totalPecas, totalCompras: (lista || []).length });
    }
    return { id, clienteId: row.cliente_id, numeroFactura: row.numero_factura, quantidadePecas: row.quantidade_pecas, valor: row.valor, data: row.data, observacao: row.observacao };
  },

  async deleteCompra(id) {
    const { data: compra } = await this._db().from('compras').select('cliente_id').eq('id', id).maybeSingle();
    await this._db().from('compras').delete().eq('id', id);
    if (compra?.cliente_id) {
      const { data: lista } = await this._db().from('compras').select('quantidade_pecas').eq('cliente_id', compra.cliente_id);
      const totalPecas = (lista || []).reduce((s, c) => s + (c.quantidade_pecas || 0), 0);
      await this.updateCliente(compra.cliente_id, { totalPecas, totalCompras: (lista || []).length });
    }
  },

  // ----- TOKENS -----
  async gerarLink(clienteId) {
    const cliente = await this.getClienteById(clienteId);
    if (!cliente || !cliente.elegivel || cliente.tokenUsado) return null;
    const token = this.generateToken();
    await this.updateCliente(clienteId, { token, tokenUsado: false, dataTokenGerado: new Date().toISOString() });
    return token;
  },

  // ----- PREMIOS -----
  async getPremios() {
    const { data, error } = await this._db().from('premios').select('*').order('id');
    if (error) { console.error(error); return []; }
    return (data || []).map(r => ({
      id: r.id, nome: r.nome, descricao: r.descricao,
      probabilidade: parseFloat(r.probabilidade) || 0,
      activo: !!r.activo, cor: r.cor || '#6366f1'
    }));
  },

  async updatePremio(id, updates) {
    const map = {};
    if (updates.nome !== undefined) map.nome = updates.nome;
    if (updates.descricao !== undefined) map.descricao = updates.descricao;
    if (updates.probabilidade !== undefined) map.probabilidade = updates.probabilidade;
    if (updates.activo !== undefined) map.activo = updates.activo;
    if (updates.cor !== undefined) map.cor = updates.cor;
    const { error } = await this._db().from('premios').update(map).eq('id', id);
    if (error) throw error;
    return true;
  },

  async sortearPremio() {
    const premios = (await this.getPremios()).filter(p => p.activo);
    if (!premios.length) return null;
    const total = premios.reduce((s, p) => s + (parseFloat(p.probabilidade) || 0), 0);
    let random = Math.random() * total, acumulado = 0;
    for (const p of premios) {
      acumulado += parseFloat(p.probabilidade) || 0;
      if (random <= acumulado) return p;
    }
    return premios[premios.length - 1];
  },

  // ----- SORTEIOS -----
  async getSorteios() {
    const { data, error } = await this._db().from('sorteios').select('*').order('data_sorteio', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data || []).map(r => ({
      id: r.id, clienteId: r.cliente_id, clienteNome: r.cliente_nome, clienteTelefone: r.cliente_telefone,
      token: r.token, premioId: r.premio_id, premioNome: r.premio_nome, premioDescricao: r.premio_descricao,
      codigo: r.codigo, dataSorteio: r.data_sorteio, estado: r.estado, dataEntrega: r.data_entrega
    }));
  },

  async getSorteioByToken(token) {
    const { data, error } = await this._db().from('sorteios').select('*').eq('token', token).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id, clienteId: data.cliente_id, clienteNome: data.cliente_nome, clienteTelefone: data.cliente_telefone,
      token: data.token, premioId: data.premio_id, premioNome: data.premio_nome, premioDescricao: data.premio_descricao,
      codigo: data.codigo, dataSorteio: data.data_sorteio, estado: data.estado, dataEntrega: data.data_entrega
    };
  },

  async realizarSorteio(token) {
    const cliente = await this.getClienteByToken(token);
    if (!cliente) return { erro: 'Token inválido' };
    if (cliente.tokenUsado) return { erro: 'Este sorteio já foi realizado' };
    if (!cliente.elegivel) return { erro: 'Cliente não elegível' };

    const premio = await this.sortearPremio();
    if (!premio) return { erro: 'Nenhum prémio configurado' };

    const codigo = this.generatePrizeCode(premio.nome);
    const sorteioRow = {
      id: this.generateId('srt_'),
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      cliente_telefone: cliente.telefone,
      token,
      premio_id: premio.id,
      premio_nome: premio.nome,
      premio_descricao: premio.descricao,
      codigo,
      data_sorteio: new Date().toISOString(),
      estado: 'premio_pendente'
    };

    const { error } = await this._db().from('sorteios').insert(sorteioRow);
    if (error) { console.error(error); return { erro: 'Erro ao guardar sorteio' }; }

    await this.updateCliente(cliente.id, {
      tokenUsado: true,
      dataSorteio: sorteioRow.data_sorteio,
      ultimoPremio: premio.nome,
      ultimoCodigo: codigo
    });

    return {
      sucesso: true,
      sorteio: {
        id: sorteioRow.id, clienteId: cliente.id, clienteNome: cliente.nome, clienteTelefone: cliente.telefone,
        token, premioId: premio.id, premioNome: premio.nome, premioDescricao: premio.descricao,
        codigo, dataSorteio: sorteioRow.data_sorteio, estado: 'premio_pendente'
      },
      premio
    };
  },

  async marcarEntregue(sorteioId) {
    const { error } = await this._db().from('sorteios').update({
      estado: 'entregue', data_entrega: new Date().toISOString()
    }).eq('id', sorteioId);
    if (error) { console.error(error); return null; }
    return true;
  },



  // ----- BONUS ESPECIAL (tabela própria, NÃO usa "clientes") -----
  getDeviceId() {
    try {
      let id = localStorage.getItem('lodja_device_id');
      if (!id) {
        id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('lodja_device_id', id);
      }
      return id;
    } catch (e) {
      return 'dev_fallback_' + Date.now();
    }
  },

  getLinkBonusEspecial() {
    try {
      const base = (document.querySelector('base') && document.querySelector('base').href) || (location.origin + location.pathname.replace(/[^/]*$/, ''));
      return base.replace(/\/?$/, '/') + 'bonus-especial.html';
    } catch (e) {
      return 'bonus-especial.html';
    }
  },

  async arquivarBonusActualSeExistir(cfg) {
    const be = cfg.bonusEspecial || {};
    if (!be.campanhaId) return cfg;
    const hist = Array.isArray(be.historico) ? be.historico.slice() : [];
    // evita duplicar a mesma campanha
    if (!hist.some(h => h.campanhaId === be.campanhaId)) {
      hist.unshift({
        campanhaId: be.campanhaId,
        nome: be.nome || 'Bónus Especial',
        descricao: be.descricao || '',
        codigo: be.codigo || '',
        tipoAcesso: be.tipoAcesso || 'publico',
        clientesIds: Array.isArray(be.clientesIds) ? be.clientesIds : [],
        criadoEm: be.criadoEm || null,
        encerradoEm: new Date().toISOString(),
        activo: !!be.activo
      });
    }
    be.historico = hist.slice(0, 50);
    cfg.bonusEspecial = be;
    return cfg;
  },

  async getBonusCampanhaId() {
    const cfg = await this.getConfig();
    const be = cfg.bonusEspecial || {};
    return be.campanhaId || null;
  },

  async getBonusHistorico() {
    const cfg = await this.getConfig();
    return Array.isArray(cfg.bonusEspecialHistorico) ? cfg.bonusEspecialHistorico : [];
  },

  async arquivarBonusActual() {
    const cfg = await this.getConfig();
    const be = cfg.bonusEspecial || {};
    if (!be.campanhaId && !be.nome) return cfg;
    const hist = Array.isArray(cfg.bonusEspecialHistorico) ? cfg.bonusEspecialHistorico.slice() : [];
    hist.unshift({
      campanhaId: be.campanhaId,
      nome: be.nome,
      descricao: be.descricao,
      codigo: be.codigo,
      activo: false,
      modoAcesso: be.modoAcesso || 'publico',
      clientesIds: be.clientesIds || [],
      criadoEm: be.criadoEm || null,
      encerradoEm: new Date().toISOString()
    });
    cfg.bonusEspecialHistorico = hist.slice(0, 50);
    return cfg;
  },


  _mapBonusPart(r) {
    if (!r) return null;
    return {
      id: r.id,
      campanhaId: r.campanha_id,
      clienteId: r.cliente_id || null,
      nome: r.cliente_nome || '',
      telefone: r.cliente_telefone || '',
      deviceId: r.device_id,
      premioId: r.premio_id || null,
      premioNome: r.premio_nome || null,
      premioDescricao: r.premio_descricao || null,
      codigo: r.codigo || null,
      dataParticipacao: r.data_participacao,
      estado: r.estado || 'registado'
    };
  },

  async getParticipantesBonusEspecial(campanhaId) {
    let q = this._db().from('bonus_especial_participacoes').select('*').order('data_participacao', { ascending: false });
    if (campanhaId) q = q.eq('campanha_id', campanhaId);
    const { data, error } = await q;
    if (error) { console.error(error); return []; }
    return (data || []).map(r => this._mapBonusPart(r));
  },

  async jaParticipouBonusEspecial(campanhaId, deviceId, telefone) {
    if (!campanhaId) return false;
    const dev = deviceId || this.getDeviceId();
    const tel = String(telefone || '').replace(/\D/g, '');
    try {
      if (localStorage.getItem('bonus_esp_done_' + campanhaId) === '1') return true;
    } catch (e) {}
    try {
      if (!window.supabaseClient) return false;
      // Já jogou neste dispositivo (estado concluido)
      const { data: byDev, error: e1 } = await this._db()
        .from('bonus_especial_participacoes')
        .select('id, estado, premio_nome')
        .eq('campanha_id', campanhaId)
        .eq('device_id', dev)
        .limit(5);
      if (!e1 && byDev) {
        if (byDev.some(r => r.estado === 'concluido' || r.premio_nome)) return true;
      }
      // Já jogou com este telefone (outro dispositivo)
      if (tel && tel.length >= 8) {
        const { data: byTel, error: e2 } = await this._db()
          .from('bonus_especial_participacoes')
          .select('id, estado, premio_nome')
          .eq('campanha_id', campanhaId)
          .eq('cliente_telefone', tel)
          .limit(5);
        if (!e2 && byTel) {
          if (byTel.some(r => r.estado === 'concluido' || r.premio_nome)) return true;
        }
      }
      return false;
    } catch (e) {
      console.error('jaParticipouBonusEspecial', e);
      try { return localStorage.getItem('bonus_esp_done_' + campanhaId) === '1'; } catch (e2) { return false; }
    }
  },

  /** Regista participante SÓ na tabela do bónus (não cria em clientes) */
  async registarParticipanteBonusEspecial({ nome, telefone, campanhaId }) {
    const deviceId = this.getDeviceId();
    const tel = String(telefone || '').replace(/\D/g, '');
    if (!campanhaId) throw new Error('Campanha inválida');
    if (!nome || !tel) throw new Error('Nome e contacto são obrigatórios');

    const cfg = await this.getConfig();
    const be = cfg.bonusEspecial || {};
    if (!be.activo) return { erro: 'O Bónus Especial não está activo de momento.' };
    const modo = be.modoAcesso || be.tipoAcesso || 'publico';
    if (modo === 'clientes') {
      const ids = Array.isArray(be.clientesIds) ? be.clientesIds : [];
      if (!ids.length) return { erro: 'Este bónus é restrito e ainda não tem clientes seleccionados.' };
      const clientes = await this.getClientes();
      const match = clientes.find(c => ids.includes(c.id) && String(c.telefone || '').replace(/\D/g, '') === tel);
      if (!match) {
        return { erro: 'Este contacto não está na lista de clientes seleccionados para este Bónus Especial.' };
      }
      if (match.nome) nome = match.nome;
    }

    // Já concluiu roleta?
    if (await this.jaParticipouBonusEspecial(campanhaId, deviceId, tel)) {
      return { erro: 'Este contacto ou dispositivo já realizou o Bónus Especial. Aguarde pelo anúncio de um novo Bónus.' };
    }

    // Reutilizar registo pendente (mesmo telefone ou device, ainda não jogou)
    const { data: existentes } = await this._db()
      .from('bonus_especial_participacoes')
      .select('*')
      .eq('campanha_id', campanhaId)
      .or(`device_id.eq.${deviceId},cliente_telefone.eq.${tel}`)
      .limit(10);

    const pendente = (existentes || []).find(r => r.estado !== 'concluido' && !r.premio_nome);
    if (pendente) {
      // actualizar nome se necessário
      await this._db().from('bonus_especial_participacoes').update({
        cliente_nome: nome,
        cliente_telefone: tel,
        device_id: deviceId
      }).eq('id', pendente.id);
      return { sucesso: true, participante: this._mapBonusPart({ ...pendente, cliente_nome: nome, cliente_telefone: tel, device_id: deviceId }) };
    }

    const row = {
      id: this.generateId('bep_'),
      campanha_id: campanhaId,
      cliente_id: null,
      cliente_nome: nome,
      cliente_telefone: tel,
      device_id: deviceId,
      premio_id: null,
      premio_nome: null,
      premio_descricao: null,
      codigo: null,
      data_participacao: new Date().toISOString(),
      estado: 'registado'
    };
    const { error } = await this._db().from('bonus_especial_participacoes').insert(row);
    if (error) {
      console.error(error);
      if (error.code === '23505') {
        return { erro: 'Este dispositivo já está registado nesta campanha.' };
      }
      throw error;
    }
    return { sucesso: true, participante: this._mapBonusPart(row) };
  },

  async getParticipanteBonusById(id) {
    const { data, error } = await this._db().from('bonus_especial_participacoes').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this._mapBonusPart(data);
  },

  async realizarSorteioBonusEspecial(participanteId, campanhaId) {
    const deviceId = this.getDeviceId();
    if (!campanhaId) return { erro: 'Não há campanha de bónus especial activa' };

    const part = await this.getParticipanteBonusById(participanteId);
    if (!part) return { erro: 'Registo de participante não encontrado' };
    if (part.campanhaId !== campanhaId) return { erro: 'Campanha inválida' };

    if (part.estado === 'concluido' || part.premioNome) {
      try { localStorage.setItem('bonus_esp_done_' + campanhaId, '1'); } catch (e) {}
      return { erro: 'Este participante já realizou o Bónus Especial. Aguarde pelo anúncio de um novo Bónus.' };
    }

    if (await this.jaParticipouBonusEspecial(campanhaId, deviceId, part.telefone)) {
      return { erro: 'Este dispositivo ou contacto já participou no Bónus Especial. Aguarde pelo anúncio de um novo Bónus.' };
    }

    const premio = await this.sortearPremio();
    if (!premio) return { erro: 'Nenhum prémio configurado' };

    const codigo = this.generatePrizeCode(premio.nome);
    const agora = new Date().toISOString();

    const { error: errUp } = await this._db().from('bonus_especial_participacoes').update({
      device_id: deviceId,
      premio_id: premio.id,
      premio_nome: premio.nome,
      premio_descricao: premio.descricao || '',
      codigo,
      data_participacao: agora,
      estado: 'concluido'
    }).eq('id', participanteId);

    if (errUp) {
      console.error(errUp);
      return { erro: 'Erro ao guardar o resultado do sorteio.' };
    }

    // Sorteio para o admin acompanhar entregas (sem exigir cliente na tabela clientes)
    const sorteioRow = {
      id: this.generateId('srt_'),
      cliente_id: part.clienteId || null,
      cliente_nome: part.nome,
      cliente_telefone: part.telefone || '',
      token: 'bonus_esp_' + campanhaId + '_' + deviceId,
      premio_id: premio.id,
      premio_nome: premio.nome,
      premio_descricao: premio.descricao || '',
      codigo,
      data_sorteio: agora,
      estado: 'premio_pendente'
    };
    await this._db().from('sorteios').insert(sorteioRow);

    try { localStorage.setItem('bonus_esp_done_' + campanhaId, '1'); } catch (e) {}

    return {
      sucesso: true,
      sorteio: {
        id: sorteioRow.id,
        participanteId,
        clienteNome: part.nome,
        clienteTelefone: part.telefone,
        premioId: premio.id,
        premioNome: premio.nome,
        premioDescricao: premio.descricao,
        codigo,
        dataSorteio: agora,
        estado: 'premio_pendente'
      },
      premio
    };
  },

  /** Copia participante do bónus para a tabela clientes */
  async tornarClienteRegistado(participanteId) {
    const part = await this.getParticipanteBonusById(participanteId);
    if (!part) throw new Error('Participante não encontrado');
    if (part.clienteId) {
      return { sucesso: true, cliente: await this.getClienteById(part.clienteId), jaExistia: true };
    }

    const tel = String(part.telefone || '').replace(/\D/g, '');
    const existentes = await this.getClientes();
    let cliente = existentes.find(c => String(c.telefone || '').replace(/\D/g, '') === tel && tel.length >= 8);

    if (!cliente) {
      cliente = await this.addCliente({
        nome: part.nome,
        telefone: tel,
        totalPecas: 0,
        totalCompras: 0,
        noGrupoWhatsapp: false,
        estado: 'activo'
      });
    }

    await this._db().from('bonus_especial_participacoes')
      .update({ cliente_id: cliente.id })
      .eq('id', participanteId);

    return { sucesso: true, cliente, jaExistia: false };
  },

  // ----- CONFIG -----
  async getConfig() {
    const padrao = { nomeLoja: 'Bónus Lodja - Compre e ganhe', pecasNecessarias: 5, adminPassword: 'admin123' };
    const { data, error } = await this._db().from('config').select('valor').eq('chave', 'geral').maybeSingle();
    if (error || !data || !data.valor) return padrao;
    const cfg = { ...padrao, ...data.valor };
    // Migrar nome antigo automaticamente para o novo
    const nomeAntigo = (cfg.nomeLoja || '').trim();
    const nomesAntigos = [
      'Bónus da Loja',
      'Bónus da Loja - Compre e ganhe',
      'Bónus da Lodja',
      'Bónus da Lodja - Compre e ganhe',
      'Bónus Lodja',
      'Bónus Lodja '
    ];
    if (!nomeAntigo || nomesAntigos.includes(nomeAntigo) || nomeAntigo.includes('da Loja') || nomeAntigo.includes('da Lodja')) {
      cfg.nomeLoja = padrao.nomeLoja;
      try { await this.saveConfig(cfg); } catch (e) { console.warn('migração nomeLoja', e); }
    }
    return cfg;
  },

  async saveConfig(config) {
    const { error } = await this._db().from('config').upsert({
      chave: 'geral', valor: config, updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return true;
  },

  // ----- STATS -----
  async getStats() {
    const [clientes, sorteios, compras] = await Promise.all([
      this.getClientes(), this.getSorteios(), this.getCompras()
    ]);
    return {
      totalClientes: clientes.length,
      clientesElegiveis: clientes.filter(c => c.elegivel && !c.tokenUsado).length,
      sorteiosRealizados: sorteios.length,
      premiosPendentes: sorteios.filter(s => s.estado === 'premio_pendente').length,
      premiosEntregues: sorteios.filter(s => s.estado === 'entregue').length,
      totalCompras: compras.length,
      totalPecas: compras.reduce((s, c) => s + (parseInt(c.quantidadePecas) || 0), 0)
    };
  },


  // ----- IMPORTAR FICHEIRO (CSV do computador) -----
  async importFromCSV(textContent) {
    // Normalizar texto (remover BOM)
    let raw = String(textContent || '');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return { msg: 'Ficheiro vazio ou inválido', clientes: 0, elegiveis: 0 };

    const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';

    const parseLine = (line) => {
      // parse simples com aspas
      const cols = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (!inQ && ch === sep) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));

    const findCol = (...names) => {
      for (const n of names) {
        const i = headers.findIndex(h => h.includes(n));
        if (i >= 0) return i;
      }
      return -1;
    };

    const iNome = findCol('nome do cliente', 'nome', 'cliente', 'name');
    const iTel = findCol('contacto', 'contato', 'telefone', 'phone', 'celular');
    const iPecas = findCol('total peças', 'total pecas', 'peças', 'pecas', 'compras', 'quantidade');
    const iGrupo = findCol('grupo', 'whatsapp');

    // Colunas de compras com checkmarks (1ª..5ª)
    const compraCols = [];
    headers.forEach((h, idx) => {
      if (/^[1-5]/.test(h) || h.includes('compra')) compraCols.push(idx);
    });

    const IGNORAR = new Set([
      'nome do cliente', 'peças', 'pecas', 'blusas', 'calças', 'calcas', 'casacos',
      'blusoes', 'blusões', 'bodes', 'total', 'controle de peças', 'controlo de peças',
      'controle', 'controlo', 'valor total', 'valor pago', 'valor em divida', 'valor em dívida'
    ]);

    let importados = 0;
    const existentes = await this.getClientes();

    for (let li = 1; li < lines.length; li++) {
      const cols = parseLine(lines[li]);
      let nome = (iNome >= 0 ? cols[iNome] : cols[0] || '').trim();
      if (!nome) continue;

      const nomeLow = nome.toLowerCase();
      if (IGNORAR.has(nomeLow)) continue;
      // Parar quando começa secção de stock
      if (nomeLow.startsWith('peças') || nomeLow.startsWith('pecas') || nomeLow === 'blusas') break;
      // Ignorar linhas sem letras (só números)
      if (!/[a-zA-ZÀ-ú]/.test(nome)) continue;

      let telefone = (iTel >= 0 ? cols[iTel] : cols[10] || cols[1] || '').replace(/\D/g, '');
      // Telefone inválido se for valor monetário curto estranho da secção stock — só aceitar 8+ dígitos
      if (telefone.length < 8) telefone = '';

      let pecas = 0;
      if (iPecas >= 0) pecas = parseInt(cols[iPecas], 10) || 0;
      if (!pecas && compraCols.length) {
        for (const ci of compraCols) {
          const v = String(cols[ci] || '');
          if (v.includes('✅') || v.includes('✔') || v.includes('✓')) pecas++;
        }
      }
      if (!pecas) {
        for (const c of cols) {
          const v = String(c || '');
          if (v.includes('✅') || v.includes('✔') || v.includes('✓')) pecas++;
        }
      }

      const noGrupo = iGrupo >= 0
        ? ['sim', 'yes', 'true', '1'].includes(String(cols[iGrupo] || '').toLowerCase())
        : true;

      const jaExiste = existentes.find(x =>
        (telefone && (x.telefone || '').replace(/\D/g, '') === telefone) ||
        x.nome.toLowerCase() === nomeLow
      );

      if (jaExiste) {
        if (pecas > (jaExiste.totalPecas || 0)) {
          await this.addCompra({
            clienteId: jaExiste.id,
            numeroFactura: 'IMP-UPD',
            quantidadePecas: pecas - (jaExiste.totalPecas || 0),
            valor: 0,
            observacao: 'Actualizado por importação'
          });
        }
        continue;
      }

      const cliente = await this.addCliente({
        nome,
        telefone,
        codigoCliente: 'C' + String(importados + 1).padStart(3, '0'),
        noGrupoWhatsapp: noGrupo
      });

      if (pecas > 0) {
        await this.addCompra({
          clienteId: cliente.id,
          numeroFactura: 'IMP-' + (importados + 1),
          quantidadePecas: pecas,
          valor: 0,
          observacao: 'Importado da base de dados'
        });
      }
      importados++;
      existentes.push({ nome, telefone, totalPecas: pecas });
    }

    const elegiveis = (await this.getClientes()).filter(c => c.elegivel).length;
    return { msg: 'Importação concluída no Supabase!', clientes: importados, elegiveis };
  },


  async limparEReimportarLoja() {
    // Apaga tudo e carrega a lista completa e correcta do Excel da loja
    try {
      await this._db().from('sorteios').delete().neq('id', '');
    } catch (e) { console.warn('sorteios', e); }
    try {
      await this._db().from('compras').delete().neq('id', '');
    } catch (e) { console.warn('compras', e); }
    try {
      await this._db().from('clientes').delete().neq('id', '');
    } catch (e) { console.warn('clientes', e); }

    return await this.seedDemo(true);
  },

  async seedDemo(forcar = false) {
    // Lista COMPLETA conforme base de dados dos Clientes.xlsx
    const clientesReais = [
      { nome: 'Gilberto Alfazema', telefone: '865215866', pecas: 2 },
      { nome: 'Angélica Chissano', telefone: '843876868', pecas: 4 },
      { nome: 'Edinéria Parruque', telefone: '871322703', pecas: 5 },
      { nome: 'Jéssica', telefone: '842817711', pecas: 2 },
      { nome: 'Helio Banze', telefone: '874479001', pecas: 1 },
      { nome: 'Delú', telefone: '848973990', pecas: 1 },
      { nome: 'Amiga de Rui', telefone: '', pecas: 2 },
      { nome: 'Anónima 1', telefone: '', pecas: 3 },
      { nome: 'Anónima 2', telefone: '', pecas: 1 },
      { nome: 'Madamy', telefone: '860116113', pecas: 2 },
      { nome: 'Custódia', telefone: '875092828', pecas: 5 },
      { nome: 'Chicumbane', telefone: '', pecas: 2 },
      { nome: 'Stela Tivane', telefone: '875666827', pecas: 5, nota: 'leva uma peça de borla' },
      { nome: 'Cacilda Mandlaze', telefone: '879471628', pecas: 2 },
      { nome: 'Lucia puaneleque', telefone: '844036266', pecas: 3 },
      { nome: 'Onésia Parruque', telefone: '845151823', pecas: 5 },
      { nome: 'Edinércia', telefone: '846995920', pecas: 1 },
      { nome: 'Edna das Dores', telefone: '868034382', pecas: 2 }
    ];

    let importados = 0;
    let existentes = forcar ? [] : await this.getClientes();

    for (let i = 0; i < clientesReais.length; i++) {
      const c = clientesReais[i];
      if (!forcar) {
        const jaExiste = existentes.find(x =>
          (c.telefone && (x.telefone || '') === c.telefone) ||
          (x.nome || '').toLowerCase() === c.nome.toLowerCase()
        );
        if (jaExiste) continue;
      }

      const cliente = await this.addCliente({
        nome: c.nome,
        telefone: c.telefone || '',
        codigoCliente: 'CLI' + String(i + 1).padStart(3, '0'),
        noGrupoWhatsapp: true
      });

      if (c.pecas > 0) {
        await this.addCompra({
          clienteId: cliente.id,
          numeroFactura: 'LOJA-' + String(i + 1).padStart(3, '0'),
          quantidadePecas: c.pecas,
          valor: 0,
          observacao: c.nota || 'Importado da base de dados da loja'
        });
      }
      importados++;
    }

    const todos = await this.getClientes();
    const elegiveis = todos.filter(c => c.elegivel).length;
    return {
      msg: 'Base de dados da loja carregada no Supabase!',
      clientes: importados,
      total: todos.length,
      elegiveis
    };
  },

  async resetAll() {
    await this._db().from('sorteios').delete().neq('id', '___none___');
    await this._db().from('compras').delete().neq('id', '___none___');
    await this._db().from('clientes').delete().neq('id', '___none___');
  }
};

window.Storage = Storage;
