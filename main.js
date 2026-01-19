import { DADOS_CURSO } from './materias.js';
import { CORES_DISPONIVEIS } from './config.js';
import { inicializarUI, gerarSidebar, gerarGradePeriodo, updateAll, alocacaoCreditos, removerAlocacaoMateria, agendarMateriaNoSlot, exportarGradeParaPDF, exportarPlanoOtimizadoParaPDF, verificarConclusaoPeriodo, gradesWrapper, sidebarContent } from './ui.js';
import { gerarPlanoOtimizado } from './planner.js';
import { findMateriaById } from './utils.js';

let draggedItem = null;

function handleSidebarClick(e) {
    const t = e.target;
    if (t.classList.contains('materia-checkbox')) {
        const div = document.getElementById(t.dataset.materiaId);
        if (div?.classList.contains('prereq-nao-cumprido') && t.checked) {
            t.checked = false; alert("Pré-requisitos pendentes!"); return;
        }
        div?.classList.toggle('concluida', t.checked);
        verificarConclusaoPeriodo(t.dataset.periodoPai); updateAll();
    }
    if (t.closest('.periodo-header') && !t.matches('input')) {
        const lista = t.closest('.periodo-header').nextElementSibling;
        lista.classList.toggle('hidden');
    }
}

async function handleGradeClick(e) {
    const t = e.target;
    if (t.closest('.otimizar-grade-btn')) {
        document.getElementById('loading-overlay').classList.remove('hidden');
        setTimeout(async () => {
            try {
                const p = await gerarPlanoOtimizado();
                if (p.length > 0) await exportarPlanoOtimizadoParaPDF(p);
            } catch (err) { alert(err.message); }
            finally { document.getElementById('loading-overlay').classList.add('hidden'); }
        }, 100);
    }
    if (t.closest('.remover-materia-btn')) {
        const ag = t.closest('.materia-agendada');
        removerAlocacaoMateria(ag.dataset.materiaId); ag.remove(); updateAll();
    }
    if (t.closest('.limpar-grade-btn')) { if (confirm("Limpar?")) location.reload(); }
}

function init() { inicializarUI(); gerarSidebar(); gerarGradePeriodo("2026.1"); updateAll(); }

gradesWrapper.addEventListener('click', handleGradeClick);
sidebarContent.addEventListener('click', handleSidebarClick);
document.addEventListener('dragstart', e => { if (e.target.matches('.materia, .materia-agendada')) draggedItem = e.target; });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
    const dz = e.target.closest('.dropzone');
    if (dz && draggedItem) {
        const m = findMateriaById(draggedItem.id || draggedItem.dataset.materiaId);
        if (m) agendarMateriaNoSlot(m, draggedItem.dataset.cor || 'cor-1', dz);
    }
});

init();