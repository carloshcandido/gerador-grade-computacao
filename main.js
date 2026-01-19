import { DADOS_CURSO } from './materias.js';
import { CORES_DISPONIVEIS } from './config.js';
import {
    inicializarUI,
    resetarAlocacaoCreditos,
    removerAlocacaoMateria,
    gradesWrapper,
    sidebarContent,
    alocacaoCreditos,
    gerarSidebar,
    gerarGradePeriodo,
    updateAll,
    verificarConclusaoPeriodo,
    criarMateriaItemDOM,
    agendarMateriaNoSlot,
    exportarGradeParaPDF,
    exportarPlanoOtimizadoParaPDF
} from './ui.js';
import { gerarPlanoOtimizado } from './planner.js';
import { findMateriaById } from './utils.js';

let draggedItem = null;

function handleDrop(e) {
    e.preventDefault();
    const dropzone = e.target.closest('.dropzone');
    if (!dropzone || !draggedItem) return;
    draggedItem.classList.remove('dragging');
    dropzone.classList.remove('drag-over');
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const materiaInfo = findMateriaById(data.id);
    if (data.source === 'grid') {
        if (dropzone.children.length === 0) dropzone.appendChild(draggedItem);
    } else {
        const cor = draggedItem.dataset.cor;
        if (materiaInfo && cor) agendarMateriaNoSlot(materiaInfo, cor, dropzone);
    }
}

function handleSidebarClick(e) {
    const target = e.target;
    if (target.matches('.add-custom-btn')) {
        const tipo = target.dataset.tipo;
        const nome = prompt(`Nome do item para '${tipo}':`);
        if (!nome) return;
        const creditos = parseInt(prompt("Créditos:", "4"));
        const newId = `${tipo.slice(0,3)}-${Date.now()}`;
        const novoItem = { id: newId, nome: nome, creditos: creditos, preRequisitos: {} };
        DADOS_CURSO[tipo].push(novoItem);
        updateAll(); gerarSidebar();
        return;
    }
    const header = target.closest('.periodo-header');
    if (header && !target.matches('input[type="checkbox"]')) {
        const content = header.nextElementSibling;
        content.classList.toggle('hidden');
        header.querySelector('span:last-child').innerHTML = content.classList.contains('hidden') ? '&#9660;' : '&#9650;';
    }
    if (target.classList.contains('materia-checkbox')) {
        const materiaDiv = document.getElementById(target.dataset.materiaId);
        if (materiaDiv && materiaDiv.classList.contains('prereq-nao-cumprido') && target.checked) {
            target.checked = false; alert("Pré-requisitos não cumpridos."); return;
        }
        if(materiaDiv) materiaDiv.classList.toggle('concluida', target.checked);
        verificarConclusaoPeriodo(target.dataset.periodoPai);
        updateAll();
    }
    if (target.classList.contains('periodo-checkbox')) {
        const periodo = target.dataset.periodo;
        const isChecked = target.checked;
        document.querySelectorAll(`[data-periodo-pai="${periodo}"]`).forEach(chk => {
            if (chk.checked !== isChecked) chk.click();
        });
    }
}

async function handleGradeClick(e) {
    const target = e.target;
    if (target.closest('.otimizar-grade-btn')) {
        const loading = document.getElementById('loading-overlay');
        loading.classList.remove('hidden');
        setTimeout(async () => {
            try {
                const plano = await gerarPlanoOtimizado();
                if (plano && plano.length > 0) await exportarPlanoOtimizadoParaPDF(plano);
            } catch (error) { alert(error.message); }
            finally { loading.classList.add('hidden'); }
        }, 100);
        return;
    }
    if (target.closest('.limpar-grade-btn')) {
        if (confirm("Limpar toda a grade e progresso?")) {
            const optInput = document.getElementById('optativas-concluidas');
            if (optInput) optInput.value = 0;
            resetarAlocacaoCreditos(); location.reload();
        }
        return;
    }
    if (target.matches('.export-periodo-pdf-btn')) {
        exportarGradeParaPDF(target.closest('.periodo-grade-semanal'));
        return;
    }
    const removerBtn = target.closest('.remover-materia-btn');
    if (removerBtn) {
        const materiaAgendada = removerBtn.closest('.materia-agendada');
        removerAlocacaoMateria(materiaAgendada.dataset.materiaId);
        materiaAgendada.remove(); updateAll();
    }
}

function handleDragStart(e) {
    const target = e.target;
    let data = {};
    if (target.matches('.materia')) {
        const materia = findMateriaById(target.id);
        if (target.classList.contains('concluida') || target.classList.contains('prereq-nao-cumprido')) {
            e.preventDefault(); return;
        }
        data = { id: materia.id, source: 'sidebar' };
    } else if (target.matches('.materia-agendada')) {
        data = { id: target.dataset.materiaId, source: 'grid' };
    } else { e.preventDefault(); return; }
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    draggedItem = target;
    setTimeout(() => target.classList.add('dragging'), 0);
}

function init() {
    inicializarUI();
    gerarSidebar();
    gerarGradePeriodo(`2026.1`);
    updateAll();
}

gradesWrapper.addEventListener('dragover', e => { e.preventDefault(); const d = e.target.closest('.dropzone'); if (d) d.classList.add('drag-over'); });
gradesWrapper.addEventListener('dragleave', e => { const d = e.target.closest('.dropzone'); if (d) d.classList.remove('drag-over'); });
gradesWrapper.addEventListener('drop', handleDrop);
gradesWrapper.addEventListener('click', handleGradeClick);
sidebarContent.addEventListener('click', handleSidebarClick);
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragend', () => { if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; });

init();