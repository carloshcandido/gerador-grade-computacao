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
    if (target.classList.contains('periodo-checkbox')) {
        const periodo = target.dataset.periodo;
        const isChecked = target.checked;
        let podeMarcar = true;
        if(isChecked){
            DADOS_CURSO[periodo].forEach(materia => {
                const materiaDiv = document.getElementById(materia.id);
                if(materiaDiv && materiaDiv.classList.contains('prereq-nao-cumprido')) podeMarcar = false;
            });
        }
        if(!podeMarcar){
            target.checked = false;
            alert("Não é possível concluir o período pois ele contém matérias com pré-requisitos pendentes.");
            return;
        }
        target.closest('.periodo-header').querySelector('.periodo-header-label').classList.toggle('concluido', isChecked);
        document.querySelectorAll(`[data-periodo-pai="${periodo}"]`).forEach(chk => {
            if (chk.checked !== isChecked) chk.click();
        });
    }
}

function handleDragStart(e) {
    const target = e.target;
    let data = {};
    if (target.matches('.materia')) {
        const materia = findMateriaById(target.id);
        if (!materia) { e.preventDefault(); return; }
        if ((alocacaoCreditos[materia.id] || 0) >= materia.creditos) {
            alert(`A matéria "${materia.nome}" já foi totalmente alocada na grade.`);
            e.preventDefault(); return;
        }
        if (target.classList.contains('concluida') || target.classList.contains('prereq-nao-cumprido')) {
            e.preventDefault();
            if (target.classList.contains('prereq-nao-cumprido')) {
                let erros = [];
                if (materia.preRequisitos.cursos) {
                    materia.preRequisitos.cursos.forEach(preReqId => {
                        const chk = document.querySelector(`.materia-checkbox[data-materia-id="${preReqId}"]`);
                        if (!chk || !chk.checked) erros.push(findMateriaById(preReqId).nome + " (não concluída)");
                        if (document.querySelector(`.materia-agendada[data-materia-id="${preReqId}"]`)) erros.push(findMateriaById(preReqId).nome + " (não pode cursar com pré-requisito no mesmo período)");
                    });
                }
                if (materia.preRequisitos.creditos) {
                    const inputExtras = document.getElementById('optativas-concluidas');
                    const creditosExtras = inputExtras ? parseInt(inputExtras.value) || 0 : 0;
                    const totalGeral = creditosConcluidos + creditosExtras;
                    if (totalGeral < materia.preRequisitos.creditos) {
                        erros.push(`${materia.preRequisitos.creditos} créditos concluídos (você tem ${totalGeral})`);
                    }
                }
                if (erros.length > 0) alert(`Pré-requisitos não cumpridos para ${materia.nome}:\n\n- ${[...new Set(erros)].join('\n- ')}`);
            }
            return;
        }
        data = { id: materia.id, source: 'sidebar' };
    } else if (target.matches('.materia-agendada')) {
            data = { id: target.dataset.materiaId, source: 'grid' };
    } else {
        e.preventDefault(); return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    draggedItem = target;
    setTimeout(() => target.classList.add('dragging'), 0);
}

async function handleGradeClick(e) {
    const target = e.target;
    
    if (target.closest('.otimizar-grade-btn')) {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        
        setTimeout(async () => {
            try {
                const plano = await gerarPlanoOtimizado();
                if (plano && plano.length > 0) {
                    await exportarPlanoOtimizadoParaPDF(plano);
                } else {
                    alert("Parabéns! Todas as matérias obrigatórias já foram concluídas.");
                }
            } catch (error) {
                console.error("Erro ao gerar o plano otimizado:", error);
                alert("Ocorreu um erro ao gerar o plano: " + error.message);
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        }, 100);
        return;
    }

    if (target.closest('.limpar-grade-btn')) {
        if (confirm("Você tem certeza que deseja limpar toda a grade e o progresso? Esta ação não pode ser desfeita.")) {
            const gradeContainer = target.closest('.periodo-grade-semanal');
            gradeContainer.querySelectorAll('.materia-agendada').forEach(el => el.remove());
            document.querySelectorAll('.materia-checkbox:checked').forEach(chk => chk.click());
            document.querySelectorAll('.remover-custom-btn').forEach(btn => btn.click());
            const extraInput = document.getElementById('optativas-concluidas');
            if (extraInput) extraInput.value = 0;
            
            resetarAlocacaoCreditos();
            updateAll();
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
        const materiaOriginal = findMateriaById(materiaId);

        const creditosAlocados = removerAlocacaoMateria(materiaId); 
        
        document.querySelectorAll(`.materia-agendada[data-materia-id="${materiaId}"]`).forEach(instancia => {
            if (instancia !== materiaAgendada && materiaOriginal.creditos > 1) {
                instancia.querySelector('.materia-nome').textContent = `${materiaOriginal.nome} (${creditosAlocados}/${materiaOriginal.creditos})`;
            }
        });

        if (!materiaId.startsWith('opt-') && !materiaId.startsWith('out-') && creditosAlocados < materiaOriginal.creditos) {
            const sidebarCheckbox = document.querySelector(`.materia-checkbox[data-materia-id="${materiaId}"]`);
            if (sidebarCheckbox && sidebarCheckbox.checked) {
                sidebarCheckbox.click();
            }
        }
        materiaAgendada.remove();
    }
}

function init() {
    inicializarUI();
    gerarSidebar();
    
    // Data inicial fixada em 2026.1
    gerarGradePeriodo(`2026.1`);
    
    updateAll();
}

gradesWrapper.addEventListener('dragover', e => { e.preventDefault(); const d = e.target.closest('.dropzone'); if (d) d.classList.add('drag-over'); });
gradesWrapper.addEventListener('dragleave', e => { const d = e.target.closest('.dropzone'); if (d) d.classList.remove('drag-over'); });
gradesWrapper.addEventListener('drop', handleDrop);
gradesWrapper.addEventListener('click', handleGradeClick);
sidebarContent.addEventListener('click', handleSidebarClick);
document.addEventListener('dragstart', handleDragStart);
document.addEventListener('dragend', e => { if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; });

init();