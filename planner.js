import { DADOS_CURSO } from './materias.js';
import { findMateriaById } from './utils.js';

export async function gerarPlanoOtimizado() {
    const priorizarTcc = document.getElementById('priorizar-tcc-check')?.checked;
    const optativasInput = document.getElementById('optativas-concluidas');
    const creditosIniciais = optativasInput ? parseInt(optativasInput.value) || 0 : 0;

    let materiasIniciaisSet = new Set();
    let creditosIniciaisAcumulados = creditosIniciais;

    document.querySelectorAll('.materia-checkbox:checked').forEach(chk => {
        materiasIniciaisSet.add(chk.dataset.materiaId);
        const m = findMateriaById(chk.dataset.materiaId);
        if (m) creditosIniciaisAcumulados += m.creditos;
    });

    let materiasPendentesGlobais = getMateriasPendentes();
    
    let melhorPlano = null;
    let menorTempo = Infinity;

    // Função de recursão para testar combinações
    function simular(materiasRestantes, concluidasSet, totalCreditos, planoAtual, ano, semN) {
        if (materiasRestantes.length === 0) {
            if (planoAtual.length < menorTempo) {
                menorTempo = planoAtual.length;
                melhorPlano = JSON.parse(JSON.stringify(planoAtual));
            }
            return;
        }

        if (planoAtual.length >= menorTempo || planoAtual.length > 15) return;

        // 1. Identifica todas as matérias que PODEM ser feitas agora
        let disponiveis = materiasRestantes.filter(m => 
            verificarPreRequisitosCumpridos(m, concluidasSet, totalCreditos)
        );

        // 2. TCC check: Se priorizar TCC, removemos candidatas que não sejam TCC se o TCC estiver disponível
        if (priorizarTcc) {
            const tccDisponivel = disponiveis.find(m => ['7P4', '9P2', '10P1'].includes(m.id));
            if (tccDisponivel) {
                // Forçamos o TCC na lista, mas mantemos as outras para preencher horário
                disponiveis = [tccDisponivel, ...disponiveis.filter(m => m.id !== tccDisponivel.id)];
            }
        }

        // 3. Gera a melhor combinação de matérias para este semestre (Greedy dentro da recursão)
        const semestreAtual = { nome: `${ano}.${semN}`, materiasAlocadas: [] };
        const alocadasAgora = [];

        for (const m of disponiveis) {
            if (!verificarConflitoDeHorario(m, semestreAtual.materiasAlocadas)) {
                semestreAtual.materiasAlocadas.push(m);
                alocadasAgora.push(m);
            }
        }

        if (alocadasAgora.length === 0) return; // Travamento

        // 4. Avança para o próximo nível (próximo semestre)
        const novoConcluidas = new Set(concluidasSet);
        let novoTotalCreditos = totalCreditos;
        alocadasAgora.forEach(m => {
            novoConcluidas.add(m.id);
            novoTotalCreditos += m.creditos;
        });

        planoAtual.push(semestreAtual);
        const novoAno = (semN === 2) ? ano + 1 : ano;
        const novoSem = (semN === 2) ? 1 : 2;

        simular(
            materiasRestantes.filter(m => !alocadasAgora.includes(m)),
            novoConcluidas,
            novoTotalCreditos,
            planoAtual,
            novoAno,
            novoSem
        );

        planoAtual.pop(); // Backtrack
    }

    // Inicia a busca a partir de 2026.1
    simular(materiasPendentesGlobais, materiasIniciaisSet, creditosIniciaisAcumulados, [], 2026, 1);

    if (!melhorPlano) throw new Error("Não foi possível encontrar uma combinação válida até o fim do curso.");
    
    return melhorPlano;
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
    if (!novaMateria.horarios || novaMateria.horarios.length === 0) return false;
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