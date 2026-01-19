import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

const PESOS = { '7P4': 100, '9P2': 90, '10P1': 80, '5P4': 70, '6P4': 65, '6P5': 65, '7P1': 60, '6P1': 55 };

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const priorizarTempo = document.getElementById('priorizar-tempo-check')?.checked;
    const inputExtra = document.getElementById('optativas-concluidas');
    
    let concluidasIds = new Set();
    let totalCreditos = inputExtra ? parseInt(inputExtra.value) || 0 : 0;
    
    document.querySelectorAll('.materia-checkbox:checked').forEach(c => {
        concluidasIds.add(c.dataset.materiaId);
        const m = findMateriaById(c.dataset.materiaId);
        if (m) totalCreditos += m.creditos;
    });

    let pendentes = [];
    for (const p in DADOS_CURSO) {
        if (p === 'optativas' || p === 'outros') continue;
        DADOS_CURSO[p].forEach(m => {
            if (!concluidasIds.has(m.id)) pendentes.push({...m, periodoOriginal: parseInt(p)});
        });
    }

    const plano = [];
    let ano = 2026, semN = 1, limit = 0;

    while (pendentes.length > 0 && limit < 20) {
        limit++;
        const semestre = { nome: `${ano}.${semN}`, materiasAlocadas: [] };
        
        pendentes.sort((a, b) => {
            if (priorizarTempo) {
                const pA = PESOS[a.id] || 0, pB = PESOS[b.id] || 0;
                if (pA !== pB) return pB - pA;
            }
            return a.periodoOriginal - b.periodoOriginal;
        });

        const alocadasAgora = [];
        for (const m of [...pendentes]) {
            let reqOk = true;
            if (m.preRequisitos.cursos) {
                for (const r of m.preRequisitos.cursos) if (!concluidasIds.has(r)) { reqOk = false; break; }
            }
            if (reqOk && m.preRequisitos.creditos && totalCreditos < m.preRequisitos.creditos) reqOk = false;
            
            if (reqOk) {
                let conflito = false;
                for (const alocada of semestre.materiasAlocadas) {
                    for (const hM of m.horarios || []) {
                        for (const hA of alocada.horarios || []) {
                            if (hM.dia === hA.dia && hM.slots.some(s => hA.slots.includes(s))) { conflito = true; break; }
                        }
                        if (conflito) break;
                    }
                    if (conflito) break;
                }
                if (!conflito) {
                    semestre.materiasAlocadas.push(m);
                    alocadasAgora.push(m);
                }
            }
        }

        alocadasAgora.forEach(m => {
            concluidasIds.add(m.id);
            totalCreditos += m.creditos;
            pendentes = pendentes.filter(p => p.id !== m.id);
        });

        plano.push(semestre);
        if (semN === 2) { semN = 1; ano++; } else semN = 2;
    }
    return plano;
}