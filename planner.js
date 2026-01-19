import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

const PESOS_CAMINHO_CRITICO = {
    '7P4': 100, '9P2': 90, '10P1': 80, 
    '5P4': 75, '6P4': 70, '6P5': 70, 
    '7P1': 65, '6P1': 60, '4P1': 55
};

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const priorizarTempo = document.getElementById('priorizar-tempo-check')?.checked;
    const optativasInput = document.getElementById('optativas-concluidas');
    const creditosIniciais = optativasInput ? parseInt(optativasInput.value) || 0 : 0;

    let materiasConcluidasSet = new Set();
    let totalCreditosAcumulados = creditosIniciais;

    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        materiasConcluidasSet.add(chk.dataset.materiaId);
        const m = findMateriaById(chk.dataset.materiaId);
        if (m) totalCreditosAcumulados += m.creditos;
    });

    let materiasPendentes = getMateriasPendentes();
    const planoGerado = [];
    let anoAtual = 2026;
    let semestreN = 1;

    let semestreCounter = 0;
    while (materiasPendentes.length > 0) {
        semestreCounter++;
        if (semestreCounter > 20) break;

        const semestreAtual = { nome: `${anoAtual}.${semestreN}`, materiasAlocadas: [] };
        
        // 1. Filtra quem pode ser cursado agora
        let candidatas = materiasPendentes.filter(m => 
            verificarPreRequisitosCumpridos(m, materiasConcluidasSet, totalCreditosAcumulados)
        );

        // 2. Ordena por peso (se priorizarTempo) ou período
        candidatas.sort((a, b) => {
            if (priorizarTempo) {
                const pA = PESOS_CAMINHO_CRITICO[a.id] || 0;
                const pB = PESOS_CAMINHO_CRITICO[b.id] || 0;
                if (pA !== pB) return pB - pA;
            }
            return a.periodoOriginal - b.periodoOriginal;
        });

        // 3. Tenta a melhor combinação (Greedy com re-check de conflitos)
        // Em vez de só iterar uma vez, tentamos preencher o máximo de slots
        for (const materia of candidatas) {
            if (!verificarConflitoDeHorario(materia, semestreAtual.materiasAlocadas)) {
                semestreAtual.materiasAlocadas.push(materia);
            }
        }

        // Se o semestre ficou muito vazio e temos matérias de períodos baixos sobrando, 
        // a lógica de conflito pode ter sido muito restritiva. 
        // Aqui o algoritmo aceita o resultado e atualiza o estado.
        if (semestreAtual.materiasAlocadas.length === 0) break;

        planoGerado.push(semestreAtual);
        semestreAtual.materiasAlocadas.forEach(m => {
            materiasConcluidasSet.add(m.id);
            totalCreditosAcumulados += m.creditos;
            materiasPendentes = materiasPendentes.filter(p => p.id !== m.id);
        });

        if (semestreN === 2) { semestreN = 1; anoAtual++; } else semestreN = 2;
    }
    
    return planoGerado;
}

export function getMateriasPendentes() {
    const pendentes = [];
    const concluidasIds = new Set();
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => concluidasIds.add(chk.dataset.materiaId));

    for (const periodo in DADOS_CURSO) {
        if (periodo === 'optativas' || periodo === 'outros') continue;
        DADOS_CURSO[periodo].forEach(m => {
            if (!concluidasIds.has(m.id)) {
                const div = document.getElementById(m.id);
                pendentes.push({ ...m, periodoOriginal: parseInt(periodo), cor: div ? div.dataset.cor : 'cor-8' });
            }
        });
    }
    return pendentes;
}

export function verificarPreRequisitosCumpridos(materia, materiasConcluidasIds, creditos) {
    const pre = materia.preRequisitos;
    if (pre.creditos && creditos < pre.creditos) return false;
    if (pre.cursos) {
        for (const id of pre.cursos) if (!materiasConcluidasIds.has(id)) return false;
    }
    return true;
}

export function verificarConflitoDeHorario(novaMateria, materiasDoSemestre) {
    if (!novaMateria.horarios) return false;
    for (const hN of novaMateria.horarios) {
        for (const mE of materiasDoSemestre) {
            if (!mE.horarios) continue;
            for (const hE of mE.horarios) {
                if (hN.dia === hE.dia && hN.slots.some(s => hE.slots.includes(s))) return true;
            }
        }
    }
    return false;
}