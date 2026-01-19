import { DADOS_CURSO } from './materias.js';
import { inicializarUI, gerarSidebar, gerarGradePeriodo, updateAll, gradesWrapper, sidebarContent } from './ui.js';
import { gerarPlanoOtimizado } from './planner.js';
import { exportarPlanoOtimizadoParaPDF } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarUI();
    gerarSidebar();
    gerarGradePeriodo("2026.1");
    updateAll();

    sidebarContent.addEventListener('click', e => {
        if (e.target.classList.contains('materia-checkbox')) updateAll();
        if (e.target.classList.contains('periodo-checkbox')) {
            const p = e.target.dataset.periodo;
            document.querySelectorAll(`.materia-checkbox[data-periodo-pai="${p}"]`).forEach(c => c.checked = e.target.checked);
            updateAll();
        }
        if (e.target.closest('.periodo-header')) {
            const list = e.target.closest('.periodo-accordeon').querySelector('.lista-materias-container');
            list.classList.toggle('hidden');
        }
    });

    gradesWrapper.addEventListener('click', async e => {
        if (e.target.classList.contains('otimizar-grade-btn')) {
            const p = await gerarPlanoOtimizado();
            await exportarPlanoOtimizadoParaPDF(p);
        }
    });
});