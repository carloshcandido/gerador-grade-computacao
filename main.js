import { DADOS_CURSO } from './materias.js';
import { CORES_DISPONIVEIS } from './config.js';
import {
    inicializarUI,
    resetarAlocacaoCreditos,
    removerAlocacaoMateria,
    gradesWrapper,
    sidebarContent,
    alocacaoCreditos,
    creditosConcluidos,
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
    if (dropzone.children.length > 0 && dropzone !== draggedItem.parentElement) { return; }
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
        const nome = prompt(`Digite o nome do novo item para '${tipo}':`);
        if (!nome) return;
        const creditos = parseInt(prompt("Digite a quantidade de créditos:", "4"));
        if (isNaN(creditos) || creditos <= 0) { alert("Quantidade de créditos inválida."); return; }
        const newId = `${tipo.slice(0,3)}-${Date.now()}`;
        const novoItem = { id: newId, nome: nome, creditos: creditos, preRequisitos: {} };
        DADOS_CURSO[tipo].push(novoItem);
        const listaContainer = document.getElementById(`lista-${tipo}`);
        const cor = CORES_DISPONIVEIS[Math.floor(Math.random() * CORES_DISPONIVEIS.length)];
        const novoItemDOM = criarMateriaItemDOM(novoItem, tipo, cor);
        listaContainer.insertBefore(novoItemDOM, target);
        updateAll();
        return;
    }
    if (target.matches('.remover-custom-btn')) {
        const materiaId = target.dataset.materiaId;
        const tipo = target.dataset.tipo;
        if (!materiaId || !tipo) return;
        DADOS_CURSO[tipo] = DADOS_CURSO[tipo].filter(m => m.id !== materiaId);
        target.closest('.materia-item').remove();
        document.querySelectorAll(`.materia-agendada[data-materia-id="${materiaId}"]`).forEach(el => el.remove());
        delete alocacaoCreditos[materiaId];
        updateAll();
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
            target.checked = false;
            alert("Você não pode marcar esta matéria como concluída pois os pré-requisitos não foram cumpridos.");
            return;
        }
        if(materiaDiv) materiaDiv.classList.toggle('concluida', target.checked);
        verificarConclusaoPeriodo(target.dataset.periodoPai);
        updateAll();
    }
}

async function handleGradeClick(e) {
    const target = e.target;
    if (target.closest('.otimizar-grade-btn')) {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        setTimeout(async () => {
            try {
                const plano = await gerarPlanoOtimizado();
                if (plano && plano.length > 0) await exportarPlanoOtimizadoParaPDF(plano);
            } catch (error) {
                alert(error.message);
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        }, 100);
        return;
    }

    if (target.closest('.limpar-grade-btn')) {
        if (confirm("Limpar tudo?")) {
            const extraInput = document.getElementById('optativas-concluidas');
            if (extraInput) extraInput.value = 0;
            resetarAlocacaoCreditos();
            location.reload(); // Forma mais segura de limpar estados complexos
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
        const materiaId = materiaAgendada.dataset.materiaId;
        removerAlocacaoMateria(materiaId);
        materiaAgendada.remove();
        updateAll();
    }
}

function handleDragStart(e) {
    const target = e.target;
    let data = {};
    if (target.matches('.materia')) {
        data = { id: target.id, source: 'sidebar' };
    } else if (target.matches('.materia-agendada')) {
        data = { id: target.dataset.materiaId, source: 'grid' };
    } else return;
    
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