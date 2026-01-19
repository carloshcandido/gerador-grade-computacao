import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

/**
 * Define o "peso" de importância de cada matéria para o tempo de formação.
 * Quanto maior o número, mais prioritária ela é no fluxograma.
 */
const PESOS_CAMINHO_CRITICO = {
    // Cadeia de TCC (Altíssima prioridade por ser linear e longa)
    '7P4': 100, // Metodologia (Destrava TCC 1)
    '9P2': 90,  // TCC 1 (Destrava TCC 2)
    '10P1': 80, // TCC 2 (Fim da linha)
    
    // Cadeia de Eletrônica/Controle (4 semestres)
    '5P4': 70,  // Circuitos Lineares (Destrava 6P4, 6P5)
    '6P4': 65,  // Lab Circuitos
    '6P5': 65,  // Eletrônica Analógica (Destrava 7P1, 8P5)
    '7P1': 60,  // Técnicas Digitais (Destrava 8P2)
    
    // Cadeia de Sinais (2 semestres)
    '6P1': 55,  // Sinais e Sistemas (Destrava 7P3)
    
    // Cadeias de Cálculo/Física (Iniciais)
    '2P2': 50,  // Cálculo 1 (Destrava quase tudo do ciclo básico)
    '3P2': 45,  // Cálculo Várias Var
    '4P1': 40,  // EDP (Destrava Sinais)
};

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const priorizarTempo = document.getElementById('priorizar-tempo-check')?.checked;
    const inputExtras = document.getElementById('optativas-concluidas');
    let creditosConcluidosBase = inputExtras ? parseInt(inputExtras.value) || 0 : 0;

    const materiasConcluidasSet = new Set();
    let creditosMaterias = 0;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const materiaId = chk.dataset.materiaId;
        materiasConcluidasSet.add(materiaId);
        const materia = findMateriaById(materiaId);
        if (materia) {
            creditosMaterias += materia.creditos;
        }
    });

    let currentTotalCreditos = creditosConcluidosBase + creditosMaterias;
    let materiasPendentes = getMateriasPendentes();
    const planoGerado = [];
    
    let anoAtual = 2026;
    let semestreN = 1;

    let semestreCounter = 0;
    while (materiasPendentes.length > 0) {
        semestreCounter++;
        if (semestreCounter > 25) { throw new Error("O algoritmo excedeu o limite de semestres."); }
        const semestreAtual = { nome: `${anoAtual}.${semestreN}`, materiasAlocadas: [] };
        
        // 1. ORDENAÇÃO INTELIGENTE
        materiasPendentes = materiasPendentes.sort((a, b) => {
            if (priorizarTempo) {
                const pesoA = PESOS_CAMINHO_CRITICO[a.id] || 0;
                const pesoB = PESOS_CAMINHO_CRITICO[b.id] || 0;
                // Se houver pesos diferentes, ganha o maior peso
                if (pesoA !== pesoB) return pesoB - pesoA;
            }
            // Fallback para o comportamento padrão (período original)
            return a.periodoOriginal - b.periodoOriginal;
        });

        const materiasAlocadasNestePasse = new Set();

        // 2. LÓGICA PRIORIZAR TCC (Se o botão específico estiver marcado)
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

        // 3. PREENCHIMENTO DA GRADE
        for (let pass = 0; pass < 2; pass++) {
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

        if (materiasAlocadasNestePasse.size === 0 && materiasPendentes.length > 0) {
             throw new Error(`Travamento no semestre ${anoAtual}.${semestreN}. Verifique se os pré-requisitos de créditos foram atingidos para as matérias restantes.`);
        }
        
        planoGerado.push(semestreAtual);
        semestreAtual.materiasAlocadas.forEach(m => {
            materiasConcluidasSet.add(m.id);
            currentTotalCreditos += m.creditos;
        });

        if (semestreN === 2) {
            semestreN = 1; anoAtual++;
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

export function verificarPreRequisitosCumpridos(materiaParaVerificar, materiasConcluidasIds, creditosConcluidos) {
    const preRequisitos = materiaParaVerificar.preRequisitos;
    if (preRequisitos.creditos && creditosConcluidos < preRequisitos.creditos) return false;
    if (preRequisitos.cursos && preRequisitos.cursos.length > 0) {
        for (const cursoId of preRequisitos.cursos) {
            if (!materiasConcluidasIds.has(cursoId)) return false;
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