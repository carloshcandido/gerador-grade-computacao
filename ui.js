import { DADOS_CURSO } from './materias.js';
import { HORARIOS_PADRAO, CORES_DISPONIVEIS } from './config.js';
import { findMateriaById } from './utils.js';

export const sidebarContent = document.getElementById('sidebar-content');
export const gradesWrapper = document.getElementById('grades-wrapper');

export let creditosConcluidos = 0;
let totalCreditosObrigatorios = 0;
export let alocacaoCreditos = {};

export function resetarAlocacaoCreditos() { alocacaoCreditos = {}; }
export function removerAlocacaoMateria(materiaId) {
    if (alocacaoCreditos[materiaId]) alocacaoCreditos[materiaId]--;
    return alocacaoCreditos[materiaId] || 0;
}

/**
 * Orquestra a atualização da interface.
 */
export function updateAll() {
    atualizarContador();
    atualizarEstadoPrerequisitos();
}

export function criarElementoGradeParaPDF(semestre, index) {
    const gradeDiv = document.createElement('div');
    gradeDiv.className = 'periodo-grade-semanal';
    if (index > 0) gradeDiv.style.pageBreakBefore = 'always';

    const gradeHeader = document.createElement('div');
    gradeHeader.className = 'grade-header';
    const titulo = document.createElement('h3');
    titulo.textContent = semestre.nome;
    gradeHeader.appendChild(titulo);

    const numSlots = HORARIOS_PADRAO.length;
    const numDias = 5;
    const gradeMatrix = Array(numSlots).fill(null).map(() => Array(numDias).fill(null));

    semestre.materiasAlocadas.forEach(materia => {
        if (!materia.horarios) return;
        materia.horarios.forEach(horario => {
            const diaIndex = horario.dia - 1;
            horario.slots.forEach(slot => {
                if (gradeMatrix[slot] && gradeMatrix[slot][diaIndex] === null) gradeMatrix[slot][diaIndex] = materia;
            });
        });
    });

    const tabela = document.createElement('table');
    tabela.className = 'grade-tabela';
    const diasSemana = ["Horários", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    let tableHTML = `<thead><tr>${diasSemana.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;

    for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
        const horario = HORARIOS_PADRAO[slotIndex];
        if (horario === "INTERVALO") {
            tableHTML += `<tr class="intervalo-row"><td colspan="6">Intervalo</td></tr>`;
            continue;
        }
        tableHTML += `<tr><td class="horario">${horario}</td>`;
        for (let diaIndex = 0; diaIndex < numDias; diaIndex++) {
            const materia = gradeMatrix[slotIndex][diaIndex];
            if (materia === null) {
                tableHTML += '<td></td>';
            } else {
                tableHTML += `<td>
                                <div class="materia-agendada ${materia.cor}" style="height: calc(100% - 2px); margin: 1px; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                                    <span class="materia-nome" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; text-align: center; font-size: 0.95em; line-height: 1.2; max-height: 2.4em;">${materia.nome}</span>
                                </div>
                            </td>`;
            }
        }
        tableHTML += `</tr>`;
    }

    tableHTML += `</tbody>`;
    tabela.innerHTML = tableHTML;
    gradeDiv.append(gradeHeader, tabela);
    return gradeDiv;
}

export async function exportarPlanoOtimizadoParaPDF(planoGerado) {
    const longPageContainer = document.createElement('div');
    longPageContainer.style.width = '10.5in'; 
    planoGerado.forEach((semestre, index) => longPageContainer.appendChild(criarElementoGradeParaPDF(semestre, index)));

    const opt = {
        margin: 0.25,
        filename: `plano_de_estudos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: 'css' }
    };
    await html2pdf().from(longPageContainer).set(opt).save();
}

export function criarMateriaItemDOM(materia, tipo, cor) {
    const materiaItem = document.createElement('div'); materiaItem.className = 'materia-item';
    if (tipo !== 'optativas' && tipo !== 'outros') {
        const materiaCheckbox = document.createElement('input');
        materiaCheckbox.type = 'checkbox'; materiaCheckbox.className = 'materia-checkbox';
        materiaCheckbox.dataset.materiaId = materia.id; materiaCheckbox.dataset.periodoPai = tipo;
        materiaItem.appendChild(materiaCheckbox);
    } else {
        const btn = document.createElement('span'); btn.className = 'remover-custom-btn'; btn.innerHTML = '&times;';
        btn.dataset.materiaId = materia.id; btn.dataset.tipo = tipo;
        materiaItem.appendChild(btn);
    }
    const materiaDiv = document.createElement('div'); materiaDiv.className = `materia ${cor}`;
    materiaDiv.id = materia.id; materiaDiv.draggable = true; materiaDiv.textContent = materia.nome; materiaDiv.dataset.cor = cor;
    materiaItem.appendChild(materiaDiv);
    return materiaItem;
}

export function inicializarUI() {
    totalCreditosObrigatorios = 0;
    for (const p in DADOS_CURSO) {
        if (p !== 'optativas' && p !== 'outros') DADOS_CURSO[p].forEach(m => totalCreditosObrigatorios += m.creditos);
    }
}

export function gerarSidebar() {
    sidebarContent.innerHTML = '';
    const extra = document.createElement('div');
    extra.style.cssText = 'padding: 10px; margin-bottom: 15px; background: #e9ecef; border-radius: 5px; display: flex; flex-direction: column; gap: 5px;';
    extra.innerHTML = `<label for="optativas-concluidas" style="font-size: 0.85em; font-weight: bold; color: #495057;">Créditos de Optativas/Eletivas:</label>
                      <input type="number" id="optativas-concluidas" value="0" min="0" style="padding: 5px; border: 1px solid #ced4da; border-radius: 4px;">`;
    sidebarContent.appendChild(extra);
    extra.querySelector('input').addEventListener('input', updateAll);

    for (const periodo in DADOS_CURSO) {
        const accordeon = document.createElement('div'); accordeon.className = 'periodo-accordeon';
        const header = document.createElement('div'); header.className = 'periodo-header'; header.dataset.target = `lista-${periodo}`;
        let labelText = (periodo === 'optativas') ? 'Optativas' : (periodo === 'outros' ? 'Outros Compromissos' : `${periodo}º Período`);
        
        if (periodo !== 'optativas' && periodo !== 'outros') {
            const chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'periodo-checkbox';
            chk.dataset.periodo = periodo; header.appendChild(chk);
        }
        const label = document.createElement('span'); label.className = 'periodo-header-label'; label.textContent = labelText;
        header.append(label, Object.assign(document.createElement('span'), {innerHTML: '&#9660;'}));
        
        const lista = document.createElement('div'); lista.id = `lista-${periodo}`; lista.className = 'lista-materias-container hidden';
        let corIdx = 0;
        DADOS_CURSO[periodo].forEach(m => lista.appendChild(criarMateriaItemDOM(m, periodo, CORES_DISPONIVEIS[corIdx++ % CORES_DISPONIVEIS.length])));
        
        if (periodo === 'optativas' || periodo === 'outros') {
            const btn = document.createElement('button'); btn.className = 'btn-acao add-custom-btn'; btn.dataset.tipo = periodo;
            btn.textContent = (periodo === 'optativas') ? '+ Adicionar Optativa' : '+ Adicionar Outro';
            lista.appendChild(btn);
        }
        accordeon.append(header, lista); sidebarContent.appendChild(accordeon);
    }
}

export function gerarGradePeriodo(nome) {
    const gradeDiv = document.createElement('div'); gradeDiv.className = 'periodo-grade-semanal';
    const header = document.createElement('div'); header.className = 'grade-header';
    const titulo = Object.assign(document.createElement('h3'), {textContent: nome, contentEditable: true});
    const controles = document.createElement('div'); controles.className = 'controles';
    
    controles.innerHTML = `<label style="font-size: 0.8em; display: flex; align-items: center; gap: 5px; cursor: pointer; color: #495057; font-weight: bold;"><input type="checkbox" id="priorizar-tcc-check"> Priorizar TCC</label>
                          <label style="font-size: 0.8em; display: flex; align-items: center; gap: 5px; cursor: pointer; color: #495057; font-weight: bold; margin-right: 10px;"><input type="checkbox" id="priorizar-tempo-check"> Priorizar Tempo</label>
                          <button class="btn-acao limpar-grade-btn" title="Limpar grade">&#x1F5D1;</button>
                          <button class="btn-acao export-periodo-pdf-btn">Exportar PDF</button>
                          <button class="btn-acao otimizar-grade-btn">✨ Gerar Grade Otimizada</button>`;
    
    header.append(titulo, controles);
    const tabela = document.createElement('table'); tabela.className = 'grade-tabela';
    tabela.innerHTML = `<thead><tr>${["Horários", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody></tbody>`;
    const tbody = tabela.querySelector('tbody');
    HORARIOS_PADRAO.forEach((h, i) => {
        if (h === "INTERVALO") tbody.innerHTML += `<tr class="intervalo-row"><td colspan="6">Intervalo</td></tr>`;
        else tbody.innerHTML += `<tr><td class="horario" data-slot-index="${i}">${h}</td>${Array(5).fill('<td class="dropzone"></td>').join('')}</tr>`;
    });
    tbody.querySelectorAll('.dropzone').forEach((td, i) => { td.dataset.dia = (i % 5) + 1; td.dataset.slot = Math.floor(i / 5); });
    gradeDiv.append(header, tabela); gradesWrapper.appendChild(gradeDiv);
}

export function agendarMateriaNoSlot(materia, cor, slot) {
    alocacaoCreditos[materia.id] = (alocacaoCreditos[materia.id] || 0) + 1;
    const agendada = Object.assign(document.createElement('div'), {className: `materia-agendada ${cor}`, draggable: true});
    agendada.dataset.materiaId = materia.id;
    agendada.innerHTML = `<span class="materia-nome">${materia.nome} (${alocacaoCreditos[materia.id]}/${materia.creditos})</span><span class="remover-materia-btn">&times;</span>`;
    
    document.querySelectorAll(`.materia-agendada[data-materia-id="${materia.id}"]`).forEach(inst => {
        inst.querySelector('.materia-nome').textContent = `${materia.nome} (${alocacaoCreditos[materia.id]}/${materia.creditos})`;
    });
    if (alocacaoCreditos[materia.id] >= materia.creditos) {
        const chk = document.querySelector(`.materia-checkbox[data-materia-id="${materia.id}"]`);
        if (chk && !chk.checked) chk.click();
    }
    slot.appendChild(agendada);
}

export function atualizarEstadoPrerequisitos() {
    const inputExtras = document.getElementById('optativas-concluidas');
    const totalParaPrereq = creditosConcluidos + (inputExtras ? parseInt(inputExtras.value) || 0 : 0);

    for (const p in DADOS_CURSO) {
        if (p === 'optativas' || p === 'outros') continue;
        DADOS_CURSO[p].forEach(m => {
            const pre = m.preRequisitos;
            let ok = true;
            if (pre.cursos) {
                for (const cid of pre.cursos) {
                    const chk = document.querySelector(`.materia-checkbox[data-materia-id="${cid}"]`);
                    if (!chk || !chk.checked || document.querySelector(`.materia-agendada[data-materia-id="${cid}"]`)) { ok = false; break; }
                }
            }
            if (ok && pre.creditos && totalParaPrereq < pre.creditos) ok = false;
            const div = document.getElementById(m.id);
            if (div) div.classList.toggle('prereq-nao-cumprido', !ok);
        });
    }
}

export function atualizarContador() {
    let soma = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const m = findMateriaById(chk.dataset.materiaId);
        if (m) soma += m.creditos;
    });
    creditosConcluidos = soma;

    const extras = parseInt(document.getElementById('optativas-concluidas')?.value) || 0;
    const total = creditosConcluidos + extras;
    const faltamMat = document.querySelectorAll('.materia-checkbox').length - document.querySelectorAll('.materia-checkbox:checked').length;

    document.getElementById('contador-progresso').innerHTML = 
        `Matérias Cursadas: <strong>${document.querySelectorAll('.materia-checkbox:checked').length}</strong> | Faltam: <strong>${faltamMat}</strong><br>
         Créditos Concluídos: <strong>${total}</strong> | Faltam (Obrig.): <strong>${Math.max(0, totalCreditosObrigatorios - creditosConcluidos)}</strong>`;
}

export function exportarGradeParaPDF(gradeElement) {
    const opt = { margin: 0.25, filename: 'grade.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { orientation: 'landscape' } };
    html2pdf().from(gradeElement).set(opt).save();
}

export function verificarConclusaoPeriodo(pid) {
    const chks = document.querySelectorAll(`.materia-checkbox[data-periodo-pai="${pid}"]`);
    if (chks.length === 0) return;
    const todas = Array.from(chks).every(c => c.checked);
    const pchk = document.querySelector(`.periodo-checkbox[data-periodo="${pid}"]`);
    if (pchk) {
        pchk.checked = todas;
        pchk.closest('.periodo-header').querySelector('.periodo-header-label').classList.toggle('concluido', todas);
    }
}