import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

const PESOS = { '7P4': 100, '9P2': 90, '10P1': 80, '5P4': 70, '6P4': 65, '6P5': 65, '7P1': 60, '6P1': 55, '2P2': 50, '3P2': 45, '4P1': 40 };

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const priorizarTempo = document.getElementById('priorizar-tempo-check')?.checked;
    const extras = parseInt(document.getElementById('optativas-concluidas')?.value) || 0;

    let concluidasIds = new Set();
    let somaCreditos = extras;
    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        concluidasIds.add(chk.dataset.materiaId);
        const m = findMateriaById(chk.dataset.materiaId);
        if (m) somaCreditos += m.creditos;
    });

    let pendentes = [];
    for (const p in DADOS_CURSO) {
        if (p === 'optativas' || p === 'outros') continue;
        DADOS_CURSO[p].forEach(m => {
            if (!concluidasIds.has(m.id)) pendentes.push({...m, pOrig: parseInt(p), cor: document.getElementById(m.id)?.dataset.cor || 'cor-8'});
        });
    }

    const plano = [];
    let ano = 2026, sem = 1;

    while (pendentes.length > 0) {
        if (plano.length > 20) break;
        const atual = { nome: `${ano}.${sem}`, materiasAlocadas: [] };
        
        pendentes.sort((a, b) => {
            if (priorizarTempo) {
                const pa = PESOS[a.id] || 0, pb = PESOS[b.id] || 0;
                if (pa !== pb) return pb - pa;
            }
            return a.pOrig - b.pOrig;
        });

        if (priorizarTcc) {
            ['7P4', '9P2', '10P1'].forEach(tid => {
                const idx = pendentes.findIndex(m => m.id === tid);
                if (idx !== -1 && ok(pendentes[idx], concluidasIds, somaCreditos) && !conf(pendentes[idx], atual.materiasAlocadas)) {
                    atual.materiasAlocadas.push(pendentes[idx]);
                    pendentes.splice(idx, 1);
                }
            });
        }

        let alocadasNestePasse = true;
        while(alocadasNestePasse) {
            alocadasNestePasse = false;
            for (let i = 0; i < pendentes.length; i++) {
                if (ok(pendentes[i], concluidasIds, somaCreditos) && !conf(pendentes[i], atual.materiasAlocadas)) {
                    atual.materiasAlocadas.push(pendentes[i]);
                    pendentes.splice(i, 1);
                    alocadasNestePasse = true;
                    break;
                }
            }
        }

        if (atual.materiasAlocadas.length === 0) throw new Error("Trava no planejamento.");
        
        plano.push(atual);
        atual.materiasAlocadas.forEach(m => { concluidasIds.add(m.id); somaCreditos += m.creditos; });
        if (sem === 2) { sem = 1; ano++; } else sem = 2;
    }
    return plano;
}

function ok(m, ids, cr) {
    if (m.preRequisitos.creditos && cr < m.preRequisitos.creditos) return false;
    if (m.preRequisitos.cursos) {
        for (const cid of m.preRequisitos.cursos) if (!ids.has(cid)) return false;
    }
    return true;
}

function conf(m, aloc) {
    if (!m.horarios) return false;
    for (const h of m.horarios) {
        for (const e of aloc) {
            if (!e.horarios) continue;
            for (const eh of e.horarios) {
                if (h.dia === eh.dia && h.slots.some(s => eh.slots.includes(s))) return true;
            }
        }
    }
    return false;
}