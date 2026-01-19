import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

// Pesos baseados no Caminho Crítico discutido (Cadeias mais longas primeiro)
const PESOS_CAMINHO_CRITICO = {
    '7P4': 100, // Metodologia Científica
    '9P2': 90,  // TCC I
    '10P1': 80, // TCC II
    '5P4': 75,  // Circuitos Lineares (Gargalo de Eletrônica)
    '6P4': 70,  // Lab Circuitos
    '6P5': 70,  // Eletrônica Analógica
    '7P1': 65,  // Técnicas Digitais
    '6P1': 60,  // Sinais e Sistemas
    '4P1': 55,  // EDP (Destrava Sinais)
};

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const priorizarTempo = document.getElementById('priorizar-tempo-check')?.checked;
    const optativasInput = document.getElementById('optativas-concluidas');
    const creditosIniciais = optativasInput ? parseInt(optativasInput.value) || 0 : 0;

    const materiasConcluidasSet = new Set();
    let totalCreditosAcumulados = creditosIniciais;

    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        const materiaId = chk.dataset.materiaId;
        materiasConcluidasSet.add(materiaId);
        const materia = findMateriaById(materiaId);
        if (materia) {
            totalCreditosAcumulados += materia.creditos;
        }
    });

    let materiasPendentes = getMateriasPendentes();
    const planoGerado = [];
    
    let anoAtual = 2026;
    let semestreN = 1;

    let semestreCounter = 0;
    while (materiasPendentes.length > 0) {
        semestreCounter++;
        if (semestreCounter > 20) { throw new Error("O algoritmo excedeu 20 semestres."); }
        const semestreAtual = { nome: `${anoAtual}.${semestreN}`, materiasAlocadas: [] };
        
        // ORDENAÇÃO POR PRIORIDADE
        materiasPendentes = materiasPendentes.sort((a, b) => {
            if (priorizarTempo) {
                const pesoA = PESOS_CAMINHO_CRITICO[a.id] || 0;
                const pesoB = PESOS_CAMINHO_CRITICO[b.id] || 0;
                if (pesoA !== pesoB) return pesoB - pesoA;
            }
            return a.periodoOriginal - b.periodoOriginal;
        });

        const materiasAlocadasNestePasse = new Set();

        // LÓGICA ESPECÍFICA DE TCC (Se o botão de priorizar TCC estiver on)
        if (priorizarTcc) {
            const trilhaTcc = ['7P4', '9P2', '10P1'];
            for (const idTcc of trilhaTcc) {
                const idx = materiasPendentes.findIndex(m => m.id === idTcc);
                if (idx !== -1) {
                    const materiaTcc = materiasPendentes[idx];
                    if (verificarPreRequisitosCumpridos(materiaTcc, materiasConcluidasSet, totalCreditosAcumulados)) {
                        if (!verificarConflitoDeHorario(materiaTcc, semestreAtual.materiasAlocadas)) {
                            semestreAtual.materiasAlocadas.push(materiaTcc);
                            materiasAlocadasNestePasse.add(idTcc);
                            materiasPendentes.splice(idx, 1);
                        }
                    }
                }
            }
        }

        // PREENCHIMENTO PADRÃO
        for (let pass = 0; pass < 2; pass++) {
            const listaParaIterar = [...materiasPendentes];
            for (const materia of listaParaIterar) {
                const preReqOk = verificarPreRequisitosCumpridos(materia, materiasConcluidasSet, totalCreditosAcumulados);
                const semConflito = !verificarConflitoDeHorario(materia, semestreAtual.materiasAlocadas);
                if (preReqOk && semConflito) {
                    semestreAtual.materiasAlocadas.push(materia);
                    materiasAlocadasNestePasse.add(materia.id);
                    materiasPendentes = materiasPendentes.filter(m => m.id !== materia.id);
                }
            }
        }

        if (materiasAlocadasNestePasse.size === 0 && materiasPendentes.length > 0) { 
            throw new Error(`Travamento no semestre ${anoAtual}.${semestreN}. Verifique dependências.`); 
        }

        planoGerado.push(semestreAtual);
        
        semestreAtual.materiasAlocadas.forEach(m => {
            materiasConcluidasSet.add(m.id);
            totalCreditosAcumulados += m.creditos;
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

export function verificarPreRequisitosCumpridos(materia, materiasConcluidasIds, creditos) {
    const pre = materia.preRequisitos;
    if (pre.creditos && creditos < pre.creditos) return false;
    if (pre.cursos) {
        for (const cursoId of pre.cursos) {
            if (!materiasConcluidasIds.has(cursoId)) return false;
        }
    }
    return true;
}

export function verificarConflitoDeHorario(novaMateria, materiasDoSemestre) {
    if (!novaMateria.horarios) return false;
    for (const hNova of novaMateria.horarios) {
        for (const mExistente of materiasDoSemestre) {
            if (!mExistente.horarios) continue;
            for (const hExistente of mExistente.horarios) {
                if (hNova.dia === hExistente.dia) {
                    if (hNova.slots.some(s => hExistente.slots.includes(s))) return true;
                }
            }
        }
    }
    return false;
}