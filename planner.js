import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const inputExtras = document.getElementById('optativas-concluidas');
    let creditosConcluidosBase = inputExtras ? parseInt(inputExtras.value) || 0 : 0;

    const materiasConcluidasSet = new Set();
    let creditosMatérias = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const materiaId = chk.dataset.materiaId;
        materiasConcluidasSet.add(materiaId);
        const materia = findMateriaById(materiaId);
        if (materia) {
            creditosMatérias += materia.creditos;
        }
    });

    let currentTotalCreditos = creditosConcluidosBase + creditosMatérias;
    let materiasPendentes = getMateriasPendentes();
    const planoGerado = [];
    
    // Data fixada conforme solicitado
    let anoAtual = 2026;
    let semestreN = 1;

    let semestreCounter = 0;
    while (materiasPendentes.length > 0) {
        semestreCounter++;
        if (semestreCounter > 20) { throw new Error("O algoritmo excedeu 20 semestres."); }
        const semestreAtual = { nome: `${anoAtual}.${semestreN}`, materiasAlocadas: [] };
        const materiasAlocadasNestePasse = new Set();

        // LÓGICA PRIORIZAR TCC
        if (priorizarTcc) {
            const trilhaTcc = ['7P4', '9P2', '10P1'];
            for (const idTcc of trilhaTcc) {
                const index = materiasPendentes.findIndex(m => m.id === idTcc);
                if (index !== -1) {
                    const materiaTcc = materiasPendentes[index];
                    if (verificarPreRequisitosCumpridos(materiaTcc, materiasConcluidasSet, currentTotalCreditos)) {
                        if (!verificarConflitoDeHorario(materiaTcc, semestreAtual.materiasAlocadas)) {
                            semestreAtual.materiasAlocadas.push(materiaTcc);
                            materiasAlocadasNestePasse.add(materiaTcc.id);
                            materiasPendentes.splice(index, 1);
                        }
                    }
                }
            }
        }

        // PREENCHIMENTO PADRÃO
        for (let i = 0; i < 2; i++) {
            materiasPendentes = ordenarMateriasPorPrioridade(materiasPendentes);
            const listaParaIterar = [...materiasPendentes];
            for (const materia of listaParaIterar) {
                const preReqOk = verificarPreRequisitosCumpridos(materia, materiasConcluidasSet, currentTotalCreditos);
                const semConflito = !verificarConflitoDeHorario(materia, semestreAtual.materiasAlocadas);
                if (preReqOk && semConflito) {
                    semestreAtual.materiasAlocadas.push(materia);
                    materiasAlocadasNestePasse.add(materia.id);
                    materiasPendentes = materiasPendentes.filter(m => m.id !== materia.id);
                }
            }
        }

        if (materiasAlocadasNestePasse.size === 0 && materiasPendentes.length > 0) { throw new Error("O algoritmo não conseguiu progredir por conflito de pré-requisitos ou horários."); }
        
        planoGerado.push(semestreAtual);
        semestreAtual.materiasAlocadas.forEach(m => {
            materiasConcluidasSet.add(m.id);
            currentTotalCreditos += m.creditos;
        });

        if (semestreN === 2) {
            semestreN = 1;
            anoAtual++;
        } else {
            semestreN = 2;
        }
    }
    
    return planoGerado;
}

export function getMateriasPendentes() {
    const materiasPendentes = [];
    const concluidasIds = new Set();
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        concluidasIds.add(chk.dataset.materiaId);
    });

    for (const periodo in DADOS_CURSO) {
        if (periodo === 'optativas' || periodo === 'outros') continue;
        DADOS_CURSO[periodo].forEach(materia => {
            if (!concluidasIds.has(materia.id)) {
                const materiaDiv = document.getElementById(materia.id);
                materiasPendentes.push({ 
                    ...materia, 
                    periodoOriginal: parseInt(periodo),
                    cor: materiaDiv ? materiaDiv.dataset.cor : 'cor-8'
                });
            }
        });
    }
    return materiasPendentes;
}

export function ordenarMateriasPorPrioridade(materias) {
    return materias.sort((a, b) => a.periodoOriginal - b.periodoOriginal);
}

export function verificarPreRequisitosCumpridos(materiaParaVerificar, materiasConcluidasIds, creditosConcluidos) {
    const preRequisitos = materiaParaVerificar.preRequisitos;
    if (preRequisitos.creditos && creditosConcluidos < preRequisitos.creditos) {
        return false;
    }
    if (preRequisitos.cursos && preRequisitos.cursos.length > 0) {
        for (const cursoId of preRequisitos.cursos) {
            if (!materiasConcluidasIds.has(cursoId)) {
                return false;
            }
        }
    }
    return true;
}

export function verificarConflitoDeHorario(novaMateria, materiasDoSemestre) {
    if (!novaMateria.horarios) return false;
    for (const horarioNova of novaMateria.horarios) {
        for (const materiaExistente of materiasDoSemestre) {
            if (!materiaExistente.horarios) continue;
            for (const horarioExistente of materiaExistente.horarios) {
                if (horarioNova.dia === horarioExistente.dia) {
                    const temConflito = horarioNova.slots.some(slot => horarioExistente.slots.includes(slot));
                    if (temConflito) return true;
                }
            }
        }
    }
    return false;
}