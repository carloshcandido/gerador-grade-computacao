export const DADOS_CURSO = {
    "1": [
        { id: '1P1', nome: 'Introdução a Engenharia', creditos: 2, preRequisitos: {}, horarios: [{ dia: 4, slots: [2, 4] }] },
        { id: '1P2', nome: 'Administração e Organização Empresarial', creditos: 2, preRequisitos: {}, horarios: [{ dia: 1, slots: [4, 5] }] },
        { id: '1P3', nome: 'Geometria Analítica', creditos: 3, preRequisitos: {}, horarios: [{ dia: 2, slots: [1, 2, 4] }] },
        { id: '1P4', nome: 'Pré-Cálculo', creditos: 3, preRequisitos: {}, horarios: [{ dia: 3, slots: [0, 1, 2] }] },
        { id: '1P5', nome: 'Introdução a Ciência da Computação', creditos: 3, preRequisitos: {}, horarios: [{ dia: 3, slots: [4, 5, 6] }] },
        { id: '1P6', nome: 'Lógica para Computação', creditos: 3, preRequisitos: {}, horarios: [{ dia: 2, slots: [4, 5, 8] }] },
        { id: '1P7', nome: 'Projeto de Interação', creditos: 2, preRequisitos: {}, horarios: [{ dia: 1, slots: [1, 2] }] },
        { id: '1P8', nome: 'Leitura e Produção de Textos', creditos: 2, preRequisitos: {}, horarios: [{ dia: 5, slots: [4, 5] }] }
    ],
    "2": [
        { id: '2P1', nome: 'Ética Profissional', creditos: 2, preRequisitos: {}, horarios: [{ dia: 1, slots: [2, 4] }] },
        { id: '2P2', nome: 'Cálculo a uma Variável', creditos: 5, preRequisitos: { cursos: ['1P3', '1P4'] }, horarios: [{ dia: 4, slots: [0, 1] }, { dia: 5, slots: [0, 1, 2] }] },
        { id: '2P3', nome: 'Álgebra Linear', creditos: 4, preRequisitos: { cursos: ['1P1', '1P3', '1P4'] }, horarios: [{ dia: 1, slots: [4, 5] }, { dia: 2, slots: [4, 5] }] },
        { id: '2P4', nome: 'Mecânica Clássica', creditos: 5, preRequisitos: { cursos: ['1P4'] }, horarios: [{ dia: 4, slots: [4, 5] }, { dia: 5, slots: [4, 5, 6] }] },
        { id: '2P5', nome: 'Estruturas Discretas', creditos: 4, preRequisitos: { cursos: ['1P4', '1P5'] }, horarios: [{ dia: 3, slots: [2, 4, 5, 6] }] },
        { id: '2P6', nome: 'Introdução a Programação', creditos: 4, preRequisitos: { cursos: ['1P5', '1P6'] }, horarios: [{ dia: 2, slots: [0, 1, 2] }] },
        { id: '2P7', nome: 'Introdução a Economia', creditos: 2, preRequisitos: { cursos: ['1P1'] }, horarios: [{ dia: 1, slots: [0, 1] }] }
    ],
    "3": [
        { id: '3P1', nome: 'Introdução a Engenharia Ambiental', creditos: 2, preRequisitos: { cursos: ['1P1'] }, horarios: [{ dia: 1, slots: [2, 4] }] },
        { id: '3P2', nome: 'Cálculo a várias Variáveis', creditos: 5, preRequisitos: { cursos: ['2P2'] }, horarios: [{ dia: 4, slots: [4, 5] }, { dia: 5, slots: [4, 5, 6] }] },
        { id: '3P3', nome: 'Termodinâmica', creditos: 4, preRequisitos: { cursos: ['2P2', '2P4'] }, horarios: [{ dia: 4, slots: [2, 4] }, { dia: 5, slots: [1, 2] }] },
        { id: '3P4', nome: 'Software Básico', creditos: 4, preRequisitos: { cursos: ['2P6'] }, horarios: [{ dia: 2, slots: [2, 4] }, { dia: 3, slots: [1, 2] }] },
        { id: '3P5', nome: 'Algoritmos e Estruturas de Dados I', creditos: 6, preRequisitos: { cursos: ['2P5', '2P6'] }, horarios: [{ dia: 3, slots: [8, 9, 10, 11, 12, 13] }] },
        { id: '3P6', nome: 'Modelagem de Dados', creditos: 2, preRequisitos: { cursos: ['1P5'] }, horarios: [{ dia: 2, slots: [4, 5] }] },
        { id: '3P7', nome: 'Humanidades e Ciências Sociais', creditos: 2, preRequisitos: { cursos: ['2P1'] }, horarios: [{ dia: 3, slots: [2, 4] }] }
    ],
    "4": [
        { id: '4P1', nome: 'Equações Diferenciais Ordinárias I', creditos: 4, preRequisitos: { cursos: ['2P3', '3P2'] }, horarios: [{ dia: 3, slots: [4, 5, 6, 8] }] },
        { id: '4P2', nome: 'Eletromagnetismo', creditos: 5, preRequisitos: { cursos: ['2P4', '3P2'] }, horarios: [{ dia: 1, slots: [7, 8, 9, 10, 11] }] },
        { id: '4P3', nome: 'Redes de Computadores I', creditos: 4, preRequisitos: { cursos: ['1P4', '2P6'] }, horarios: [{ dia: 3, slots: [0, 1] }, { dia: 4, slots: [0, 1] }] },
        { id: '4P4', nome: 'Arquitetura de Computadores', creditos: 6, preRequisitos: { cursos: ['3P4'] }, horarios: [{ dia: 2, slots: [4, 5] }, { dia: 5, slots: [2, 4, 5, 6] }] },
        { id: '4P5', nome: 'Algoritmos e Estruturas de Dados II', creditos: 6, preRequisitos: { cursos: ['3P5'] }, horarios: [{ dia: 1, slots: [2, 4, 5, 6] }, { dia: 2, slots: [2, 4] }] },
        { id: '4P6', nome: 'Banco de Dados', creditos: 4, preRequisitos: { cursos: ['2P6', '3P6'] }, horarios: [{ dia: 1, slots: [0, 1] }, { dia: 2, slots: [0, 1] }] }
    ],
    "5": [
        { id: '5P1', nome: 'Probabilidade e Estatística', creditos: 3, preRequisitos: { cursos: ['2P2'] }, horarios: [{ dia: 1, slots: [1, 2, 4] }] },
        { id: '5P2', nome: 'Sistemas Operacionais', creditos: 4, preRequisitos: { cursos: ['4P4'] }, horarios: [{ dia: 3, slots: [0] }, { dia: 4, slots: [4, 5] }] },
        { id: '5P3', nome: 'Redes de Computadores II', creditos: 6, preRequisitos: { cursos: ['4P3'] }, horarios: [{ dia: 4, slots: [0, 1, 2, 4] }, { dia: 5, slots: [4, 5] }] },
        { id: '5P4', nome: 'Circuitos Lineares', creditos: 4, preRequisitos: { cursos: ['4P1', '4P2'] }, horarios: [{ dia: 1, slots: [4, 5] }, { dia: 2, slots: [4, 5] }] },
        { id: '5P5', nome: 'Cálculo Numérico', creditos: 4, preRequisitos: { cursos: ['2P3', '2P6', '3P2'] }, horarios: [{ dia: 2, slots: [0, 1] }, { dia: 3, slots: [2, 4] }] },
        { id: '5P6', nome: 'Engenharia de Software', creditos: 2, preRequisitos: { cursos: ['2P6'] }, horarios: [{ dia: 2, slots: [2, 4] }] },
        { id: '5P7', nome: 'Programação Orientada a Objetos', creditos: 6, preRequisitos: { cursos: ['3P5'] }, horarios: [{ dia: 2, slots: [8, 9, 10] }, { dia: 4, slots: [8, 9, 10] }] }
    ],
    "6": [
        { id: '6P1', nome: 'Sinais e Sistemas', creditos: 4, preRequisitos: { cursos: ['2P3', '4P1'] }, horarios: [{ dia: 2, slots: [4, 5] }, { dia: 4, slots: [2, 4] }] },
        { id: '6P2', nome: 'Ondulatória e Física Moderna', creditos: 4, preRequisitos: { cursos: ['2P4', '3P2'] }, horarios: [{ dia: 1, slots: [4, 5] }, { dia: 3, slots: [4, 5] }] },
        { id: '6P3', nome: 'Servidores de Redes', creditos: 6, preRequisitos: { cursos: ['5P3'] }, horarios: [{ dia: 4, slots: [4, 5] }, { dia: 5, slots: [8, 9, 10, 11] }] },
        { id: '6P4', nome: 'Lab. de Circuitos Elétricos e Eletrônicos', creditos: 2, preRequisitos: { cursos: ['5P4'] }, horarios: [{ dia: 5, slots: [4, 5] }] },
        { id: '6P5', nome: 'Eletrônica Analógica', creditos: 4, preRequisitos: { cursos: ['5P4'] }, horarios: [{ dia: 1, slots: [2, 4] }, { dia: 2, slots: [0] }] },
        { id: '6P6', nome: 'Linguagens Formais e Autômatos', creditos: 3, preRequisitos: { cursos: ['4P5'] }, horarios: [{ dia: 3, slots: [8, 9, 10] }] },
        { id: '6P7', nome: 'Análise de Algoritmos', creditos: 4, preRequisitos: { cursos: ['4P5'] }, horarios: [{ dia: 2, slots: [2, 4] }, { dia: 5, slots: [0, 1] }] }
    ],
    "7": [
        { id: '7P1', nome: 'Técnicas Digitais', creditos: 6, preRequisitos: { cursos: ['6P4', '6P5'] }, horarios: [{ dia: 3, slots: [1, 2, 4] }, { dia: 4, slots: [1, 2, 4] }] },
        { id: '7P2', nome: 'Programação Linear', creditos: 4, preRequisitos: { cursos: ['5P5'] }, horarios: [{ dia: 1, slots: [0, 1] }, { dia: 2, slots: [0, 1] }] },
        { id: '7P3', nome: 'Processamento Digital de Sinais', creditos: 4, preRequisitos: { cursos: ['6P1'] }, horarios: [{ dia: 1, slots: [4, 5] }, { dia: 2, slots: [4, 5] }] },
        { id: '7P4', nome: 'Metodologia Científica', creditos: 2, preRequisitos: { creditos: 162 }, horarios: [{ dia: 4, slots: [11, 12] }] }
    ],
    "8": [
        { id: '8P1', nome: 'Sistemas Distribuídos', creditos: 4, preRequisitos: { cursos: ['3P5', '5P2', '5P3'] }, horarios: [{ dia: 4, slots: [0, 1, 2, 4] }] },
        { id: '8P2', nome: 'Microcontroladores e Sistemas Embarcados', creditos: 4, preRequisitos: { cursos: ['3P4', '7P1'] }, horarios: [{ dia: 2, slots: [4, 5] }, { dia: 4, slots: [4, 5] }] },
        { id: '8P3', nome: 'Sistemas Inteligentes', creditos: 3, preRequisitos: { cursos: ['3P2', '5P1', '6P6'] }, horarios: [{ dia: 4, slots: [8, 9, 10] }] },
        { id: '8P4', nome: 'Computação Gráfica', creditos: 3, preRequisitos: { cursos: ['2P3', '5P7'] }, horarios: [{ dia: 1, slots: [3, 4, 5] }] },
        { id: '8P5', nome: 'Sistemas de Controle', creditos: 4, preRequisitos: { cursos: ['6P5'] }, horarios: [{ dia: 1, slots: [1, 2] }, { dia: 2, slots: [2, 4] }] }
    ],
    "9": [
        { id: '9P1', nome: 'Computação de Alto Desempenho', creditos: 4, preRequisitos: { cursos: ['4P5', '8P1'] }, horarios: [{ dia: 2, slots: [4, 5] }, { dia: 3, slots: [4, 5] }] },
        { id: '9P2', nome: 'Trabalho de Conclusão de Curso I', creditos: 2, preRequisitos: { cursos: ['7P4'] }, horarios: [{ dia: 1, slots: [8, 9] }] },
        { id: '9S1', nome: 'Estágio Supervisionado', creditos: 2, preRequisitos: {}, horarios: [{ dia: 2, slots: [2, 4] }] }
    ],
    "10": [
        { id: '10P1', nome: 'Trabalho de Conclusão de Curso II', creditos: 2, preRequisitos: { cursos: ['9P2'] }, horarios: [{ dia: 2, slots: [4, 5] }] }
    ],
    "optativas": [],
    "outros": []
};