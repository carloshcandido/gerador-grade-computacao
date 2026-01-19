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
    tabela.innerHTML = tableHTML + `</tbody>`;
    gradeDiv.append(gradeHeader, tabela);
    return gradeDiv;
}

export async function exportarPlanoOtimizadoParaPDF(planoGerado) {
    const container = document.createElement('div');
    container.style.width = '10.5in'; 
    planoGerado.forEach((sem, idx) => container.appendChild(criarElementoGradeParaPDF(sem, idx)));
    const opt = {
        margin: 0.25, filename: 'plano_estudos.pdf', image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: 'css' }
    };
    await html2pdf().from(container).set(opt).save();
}

export function criarMateriaItemDOM(materia, tipo, cor) {
    const item = document.createElement('div'); item.className = 'materia-item';
    if (tipo !== 'optativas' && tipo !== 'outros') {
        const chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'materia-checkbox';
        chk.dataset.materiaId = materia.id; chk.dataset.periodoPai = tipo;
        item.appendChild(chk);
    }
    const div = document.createElement('div'); div.className = `materia ${cor}`;
    div.id = materia.id; div.draggable = true; div.textContent = materia.nome; div.dataset.cor = cor;
    item.appendChild(div);
    return item;
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
    extra.style.cssText = 'padding:10px; margin-bottom:15px; background:#e9ecef; border-radius:5px; display:flex; flex-direction:column; gap:5px;';
    extra.innerHTML = `<label style="font-size:0.85em; font-weight:bold;">Créditos de Optativas/Eletivas:</label>
                       <input type="number" id="optativas-concluidas" value="0" min="0" style="padding:5px; border:1px solid #ced4da; border-radius:4px;">`;
    sidebarContent.appendChild(extra);
    extra.querySelector('input').addEventListener('input', updateAll);

    for (const p in DADOS_CURSO) {
        const acc = document.createElement('div'); acc.className = 'periodo-accordeon';
        const head = document.createElement('div'); head.className = 'periodo-header';
        let label = (p === 'optativas') ? 'Optativas' : (p === 'outros' ? 'Outros' : `${p}º Período`);
        if (p !== 'optativas' && p !== 'outros') {
            const pChk = document.createElement('input'); pChk.type = 'checkbox'; pChk.className = 'periodo-checkbox'; pChk.dataset.periodo = p;
            head.appendChild(pChk);
        }
        const span = document.createElement('span'); span.className = 'periodo-header-label'; span.textContent = label;
        head.append(span, Object.assign(document.createElement('span'), {innerHTML: '&#9660;'}));
        const list = document.createElement('div'); list.id = `lista-${p}`; list.className = 'lista-materias-container hidden';
        DADOS_CURSO[p].forEach((m, i) => list.appendChild(criarMateriaItemDOM(m, p, CORES_DISPONIVEIS[i % CORES_DISPONIVEIS.length])));
        acc.append(head, list); sidebarContent.appendChild(acc);
    }
}

export function gerarGradePeriodo(nome) {
    const div = document.createElement('div'); div.className = 'periodo-grade-semanal';
    const head = document.createElement('div'); head.className = 'grade-header';
    const h3 = document.createElement('h3'); h3.textContent = nome; h3.contentEditable = true;
    const ctrl = document.createElement('div'); ctrl.className = 'controles';
    ctrl.innerHTML = `<label style="font-size:0.8em; display:flex; align-items:center; gap:5px; font-weight:bold;">
                        <input type="checkbox" id="priorizar-tcc-check"> Priorizar TCC</label>
                      <label style="font-size:0.8em; display:flex; align-items:center; gap:5px; font-weight:bold; margin-right:10px;">
                        <input type="checkbox" id="priorizar-tempo-check"> Priorizar Tempo</label>
                      <button class="btn-acao limpar-grade-btn">&#x1F5D1;</button>
                      <button class="btn-acao export-periodo-pdf-btn">PDF</button>
                      <button class="btn-acao otimizar-grade-btn">✨ Otimizar</button>`;
    head.append(h3, ctrl);
    const tab = document.createElement('table'); tab.className = 'grade-tabela';
    let html = `<thead><tr><th>Horário</th>${["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;
    HORARIOS_PADRAO.forEach((h, i) => {
        if (h === "INTERVALO") html += `<tr class="intervalo-row"><td colspan="6">Intervalo</td></tr>`;
        else html += `<tr><td class="horario">${h}</td>${Array(5).fill('<td class="dropzone"></td>').join('')}</tr>`;
    });
    tab.innerHTML = html + `</tbody>`;
    tab.querySelectorAll('.dropzone').forEach((td, i) => { td.dataset.dia = (i % 5) + 1; td.dataset.slot = Math.floor(i / 5); });
    div.append(head, tab); gradesWrapper.appendChild(div);
}

export function agendarMateriaNoSlot(materia, cor, slot) {
    alocacaoCreditos[materia.id] = (alocacaoCreditos[materia.id] || 0) + 1;
    const agendada = document.createElement('div'); agendada.className = `materia-agendada ${cor}`;
    agendada.dataset.materiaId = materia.id;
    agendada.innerHTML = `<span class="materia-nome">${materia.nome}</span><span class="remover-materia-btn">&times;</span>`;
    slot.appendChild(agendada);
}

export function atualizarEstadoPrerequisitos() {
    const inputExtra = document.getElementById('optativas-concluidas');
    const totalConcluido = creditosConcluidos + (inputExtra ? parseInt(inputExtra.value) || 0 : 0);
    
    for (const p in DADOS_CURSO) {
        if (p === 'optativas' || p === 'outros') continue;
        DADOS_CURSO[p].forEach(m => {
            let ok = true;
            if (m.preRequisitos.cursos) {
                for (const pre of m.preRequisitos.cursos) {
                    const chk = document.querySelector(`.materia-checkbox[data-materia-id="${pre}"]`);
                    if (!chk || !chk.checked) { ok = false; break; }
                }
            }
            if (ok && m.preRequisitos.creditos && totalConcluido < m.preRequisitos.creditos) ok = false;
            const div = document.getElementById(m.id);
            if (div) div.classList.toggle('prereq-nao-cumprido', !ok);
        });
    }
}

export function atualizarContador() {
    creditosConcluidos = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(c => {
        const m = findMateriaById(c.dataset.materiaId);
        if (m) creditosConcluidos += m.creditos;
    });
    const inputExtra = document.getElementById('optativas-concluidas');
    const extra = inputExtra ? parseInt(inputExtra.value) || 0 : 0;
    const total = creditosConcluidos + extra;
    document.getElementById('contador-progresso').innerHTML = `Créditos: <strong>${total}</strong> / ${totalCreditosObrigatorios}`;
}