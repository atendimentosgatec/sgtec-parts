// SGATEC PARTS MANAGER - app.js
// Toda a lógica do sistema

// ========== Configuração Inicial ==========
const STORAGE_KEY = 'sgtec_parts';

// Dados iniciais (exemplo)
const initialParts = [
    {
        id: '1',
        nome: 'Placa WiFi',
        categoria: 'Placa Mãe',
        tipoEquip: 'impressora',
        marca: 'HP',
        modelo: 'X',
        descTecnica: 'Placa WiFi para impressora HP',
        condicao: 'usado testado',
        origem: 'manutenção',
        ncm: '84439933',
        precoCusto: 25.00,
        precoVenda: 65.00,
        marketplace: 'Mercado Livre',
        status: 'estoque',
        dataCadastro: new Date().toISOString(),
        imagem: ''
    }
];

// Mapeamento NCM por categoria
const ncmMap = {
    'Placa Mãe': '84733049',
    'Processador': '84733049',
    'Memória': '84733049',
    'HD/SSD': '84717012',
    'Fonte': '85044090',
    'Teclado': '84716052',
    'Mouse': '84716053',
    'Monitor': '85299020',
    'Impressora': '84439933',
    'Placa de Vídeo': '84733049',
    'Outros': '84733049'
};

// ========== Gerenciamento de Dados ==========
function carregarParts() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) {
        return JSON.parse(dados);
    } else {
        // Inicializa com dados de exemplo
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialParts));
        return initialParts;
    }
}

function salvarParts(parts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
    atualizarTudo();
}

// ========== Variáveis Globais ==========
let parts = carregarParts();
let chartCategoria, chartLucroMensal, chartTipoEquip, chartMarketplace;
let editandoId = null;

// ========== Elementos DOM ==========
const sections = document.querySelectorAll('.section');
const menuItems = document.querySelectorAll('.sidebar nav ul li');
const form = document.getElementById('partForm');
const cancelEditBtn = document.getElementById('cancelEdit');
const gerarDescBtn = document.getElementById('gerarDescricaoBtn');
const descGeradaDiv = document.getElementById('descricaoGerada');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterCategoria = document.getElementById('filterCategoria');

// ========== Navegação ==========
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.dataset.section;
        // Atualiza menu ativo
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // Mostra seção correspondente
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
    });
});

// ========== Atualizar Tudo (renderização) ==========
function atualizarTudo() {
    atualizarCards();
    atualizarGraficos();
    popularTabela();
    popularFiltros();
}

// ========== Cards ==========
function atualizarCards() {
    const totalPecas = parts.length;
    const valorEstoque = parts
        .filter(p => p.status === 'estoque')
        .reduce((acc, p) => acc + (p.precoVenda || 0), 0);
    const pecasVendidas = parts.filter(p => p.status === 'vendido').length;
    const pecasDisponiveis = parts.filter(p => p.status === 'estoque').length;
    const lucroEstimado = parts
        .filter(p => p.status === 'vendido')
        .reduce((acc, p) => acc + ((p.precoVenda || 0) - (p.precoCusto || 0)), 0);
    const valorMedio = totalPecas > 0 
        ? parts.reduce((acc, p) => acc + (p.precoVenda || 0), 0) / totalPecas 
        : 0;

    document.getElementById('totalPecas').innerText = totalPecas;
    document.getElementById('valorEstoque').innerText = `R$ ${valorEstoque.toFixed(2)}`;
    document.getElementById('pecasVendidas').innerText = pecasVendidas;
    document.getElementById('pecasDisponiveis').innerText = pecasDisponiveis;
    document.getElementById('lucroEstimado').innerText = `R$ ${lucroEstimado.toFixed(2)}`;
    document.getElementById('valorMedio').innerText = `R$ ${valorMedio.toFixed(2)}`;
}

// ========== Gráficos ==========
function atualizarGraficos() {
    // Destruir gráficos antigos se existirem
    if (chartCategoria) chartCategoria.destroy();
    if (chartLucroMensal) chartLucroMensal.destroy();
    if (chartTipoEquip) chartTipoEquip.destroy();
    if (chartMarketplace) chartMarketplace.destroy();

    // Gráfico de Categoria
    const catCount = {};
    parts.forEach(p => catCount[p.categoria] = (catCount[p.categoria] || 0) + 1);
    const ctxCat = document.getElementById('chartCategoria').getContext('2d');
    chartCategoria = new Chart(ctxCat, {
        type: 'bar',
        data: {
            labels: Object.keys(catCount),
            datasets: [{
                label: 'Quantidade por Categoria',
                data: Object.values(catCount),
                backgroundColor: '#00bcd4'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
    });

    // Gráfico de Lucro Mensal (últimos 6 meses)
    const lucroPorMes = {};
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        lucroPorMes[chave] = 0;
    }
    parts.filter(p => p.status === 'vendido').forEach(p => {
        const data = new Date(p.dataCadastro);
        const chave = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}`;
        if (lucroPorMes.hasOwnProperty(chave)) {
            lucroPorMes[chave] += (p.precoVenda - p.precoCusto);
        }
    });
    const ctxLucro = document.getElementById('chartLucroMensal').getContext('2d');
    chartLucroMensal = new Chart(ctxLucro, {
        type: 'line',
        data: {
            labels: Object.keys(lucroPorMes),
            datasets: [{
                label: 'Lucro (R$)',
                data: Object.values(lucroPorMes),
                borderColor: '#00bcd4',
                tension: 0.1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
    });

    // Gráfico por Tipo de Equipamento
    const tipoCount = {};
    parts.forEach(p => tipoCount[p.tipoEquip] = (tipoCount[p.tipoEquip] || 0) + 1);
    const ctxTipo = document.getElementById('chartTipoEquip').getContext('2d');
    chartTipoEquip = new Chart(ctxTipo, {
        type: 'doughnut',
        data: {
            labels: Object.keys(tipoCount),
            datasets: [{
                data: Object.values(tipoCount),
                backgroundColor: ['#00bcd4', '#ff9800', '#4caf50', '#f44336']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
    });

    // Gráfico por Marketplace
    const mkCount = {};
    parts.forEach(p => {
        const mk = p.marketplace || 'Não informado';
        mkCount[mk] = (mkCount[mk] || 0) + 1;
    });
    const ctxMk = document.getElementById('chartMarketplace').getContext('2d');
    chartMarketplace = new Chart(ctxMk, {
        type: 'pie',
        data: {
            labels: Object.keys(mkCount),
            datasets: [{
                data: Object.values(mkCount),
                backgroundColor: ['#00bcd4', '#ff9800', '#4caf50', '#f44336', '#9c27b0']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0e0e0' } } } }
    });
}

// ========== Tabela ==========
function popularTabela(filtroTexto = '', filtroStatus = '', filtroCat = '') {
    const tbody = document.querySelector('#partsTable tbody');
    tbody.innerHTML = '';

    let dadosFiltrados = parts.filter(p => {
        const matchTexto = p.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                           p.marca?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                           p.modelo?.toLowerCase().includes(filtroTexto.toLowerCase());
        const matchStatus = filtroStatus ? p.status === filtroStatus : true;
        const matchCat = filtroCat ? p.categoria === filtroCat : true;
        return matchTexto && matchStatus && matchCat;
    });

    dadosFiltrados.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.imagem ? `<img src="${p.imagem}" style="width:40px;height:40px;object-fit:cover;">` : '-'}</td>
            <td>${p.nome}</td>
            <td>${p.categoria}</td>
            <td>${p.tipoEquip}</td>
            <td>${p.marca || '-'}</td>
            <td>${p.modelo || '-'}</td>
            <td>${p.condicao}</td>
            <td>R$ ${(p.precoCusto || 0).toFixed(2)}</td>
            <td>R$ ${(p.precoVenda || 0).toFixed(2)}</td>
            <td><span class="status ${p.status}">${p.status}</span></td>
            <td>
                <button class="action-btn" onclick="editarPeca('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn" onclick="marcarVendido('${p.id}')"><i class="fas fa-check-circle"></i></button>
                <button class="action-btn delete" onclick="excluirPeca('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========== Filtros ==========
function popularFiltros() {
    const categorias = [...new Set(parts.map(p => p.categoria))];
    filterCategoria.innerHTML = '<option value="">Todas Categorias</option>' + 
        categorias.map(c => `<option value="${c}">${c}</option>`).join('');
}

searchInput.addEventListener('input', () => {
    popularTabela(searchInput.value, filterStatus.value, filterCategoria.value);
});
filterStatus.addEventListener('change', () => {
    popularTabela(searchInput.value, filterStatus.value, filterCategoria.value);
});
filterCategoria.addEventListener('change', () => {
    popularTabela(searchInput.value, filterStatus.value, filterCategoria.value);
});

// ========== Ações da Tabela ==========
window.editarPeca = function(id) {
    const part = parts.find(p => p.id === id);
    if (!part) return;
    editandoId = id;
    document.getElementById('partId').value = part.id;
    document.getElementById('nome').value = part.nome;
    document.getElementById('categoria').value = part.categoria;
    document.getElementById('tipoEquip').value = part.tipoEquip;
    document.getElementById('marca').value = part.marca || '';
    document.getElementById('modelo').value = part.modelo || '';
    document.getElementById('descTecnica').value = part.descTecnica || '';
    document.getElementById('condicao').value = part.condicao;
    document.getElementById('origem').value = part.origem || '';
    document.getElementById('ncm').value = part.ncm;
    document.getElementById('precoCusto').value = part.precoCusto;
    document.getElementById('precoVenda').value = part.precoVenda;
    document.getElementById('marketplace').value = part.marketplace || '';
    document.getElementById('status').value = part.status;
    // imagem não pré-carregada por segurança
    document.getElementById('imagePreview').innerHTML = part.imagem ? `<img src="${part.imagem}" style="max-width:100px;">` : '';
    
    // Muda para a seção de formulário
    document.querySelector(`[data-section="form"]`).click();
};

window.marcarVendido = function(id) {
    const index = parts.findIndex(p => p.id === id);
    if (index !== -1 && parts[index].status !== 'vendido') {
        parts[index].status = 'vendido';
        salvarParts(parts);
    }
};

window.excluirPeca = function(id) {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
        parts = parts.filter(p => p.id !== id);
        salvarParts(parts);
    }
};

// ========== Sugestão de NCM ==========
document.getElementById('categoria').addEventListener('change', function() {
    const cat = this.value;
    const ncmInput = document.getElementById('ncm');
    if (cat && ncmMap[cat]) {
        ncmInput.value = ncmMap[cat];
    } else {
        ncmInput.value = '';
    }
});

// ========== Gerador de Descrição ==========
gerarDescBtn.addEventListener('click', function() {
    const nome = document.getElementById('nome').value;
    const tipo = document.getElementById('tipoEquip').value;
    const marca = document.getElementById('marca').value;
    const modelo = document.getElementById('modelo').value;
    const condicao = document.getElementById('condicao').value;
    const origem = document.getElementById('origem').value;
    const descTec = document.getElementById('descTecnica').value;

    let descricao = `${nome} `;
    if (marca || modelo) descricao += `${marca} ${modelo} `.trim();
    descricao += `retirada de ${tipo}. `;
    if (origem) descricao += `Origem: ${origem}. `;
    descricao += `Condição: ${condicao}. `;
    if (descTec) descricao += `Detalhes: ${descTec}. `;
    descricao += `Ideal para reposição técnica.`;

    descGeradaDiv.innerText = descricao;
});

// ========== Upload de Imagem ==========
document.getElementById('imagem').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${ev.target.result}" style="max-width:150px;">`;
            // Armazenar base64 temporariamente para ser salvo no submit
            window.tempImageBase64 = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// ========== Submissão do Formulário ==========
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const novaPeca = {
        id: editandoId || Date.now().toString(),
        nome: document.getElementById('nome').value,
        categoria: document.getElementById('categoria').value,
        tipoEquip: document.getElementById('tipoEquip').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        descTecnica: document.getElementById('descTecnica').value,
        condicao: document.getElementById('condicao').value,
        origem: document.getElementById('origem').value,
        ncm: document.getElementById('ncm').value,
        precoCusto: parseFloat(document.getElementById('precoCusto').value),
        precoVenda: parseFloat(document.getElementById('precoVenda').value),
        marketplace: document.getElementById('marketplace').value,
        status: document.getElementById('status').value,
        dataCadastro: new Date().toISOString(),
        imagem: window.tempImageBase64 || (editandoId ? parts.find(p => p.id === editandoId)?.imagem : '')
    };

    if (editandoId) {
        const index = parts.findIndex(p => p.id === editandoId);
        if (index !== -1) {
            parts[index] = novaPeca;
        }
    } else {
        parts.push(novaPeca);
    }

    salvarParts(parts);
    form.reset();
    document.getElementById('imagePreview').innerHTML = '';
    editandoId = null;
    window.tempImageBase64 = null;
    // Volta para listagem
    document.querySelector(`[data-section="list"]`).click();
});

cancelEditBtn.addEventListener('click', function() {
    form.reset();
    editandoId = null;
    document.getElementById('imagePreview').innerHTML = '';
    document.querySelector(`[data-section="list"]`).click();
});

// ========== Exportação ==========
document.getElementById('exportJSON').addEventListener('click', function() {
    const dataStr = JSON.stringify(parts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sgtec_parts_backup.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('exportCSV').addEventListener('click', function() {
    if (parts.length === 0) return;
    const headers = Object.keys(parts[0]).join(',');
    const rows = parts.map(p => Object.values(p).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sgtec_parts.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// ========== Importação ==========
document.getElementById('importJSON').addEventListener('click', function() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                parts = imported;
                salvarParts(parts);
                alert('Importação concluída!');
                fileInput.value = '';
            } else {
                alert('Arquivo inválido.');
            }
        } catch (err) {
            alert('Erro ao ler arquivo.');
        }
    };
    reader.readAsText(file);
});

// ========== Inicialização ==========
atualizarTudo();