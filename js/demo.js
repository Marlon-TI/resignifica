/* Dados de exemplo para testar o app sem precisar digitar. Marcados com demo:true e removíveis a qualquer momento. */
'use strict';
(function (RS) {
  const at = (daysBack, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() - daysBack); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const rec = (o) => Object.assign(RS.store.newRecord(), { persisted: true, demo: true, step: 7, contexto: '', sensacoes: '', comportamento: '', evidFavor: '', evidContra: '', outrasExplic: '', alguemQuerido: '', distorcoes: [], alternativo: '', notas: '' }, o, { createdAt: o.when, updatedAt: o.when });

  const RECORDS = () => [
    rec({ when: at(1, 21, 10), status: 'completo', situacao: 'Enviei uma mensagem para uma amiga e ela não respondeu o dia todo.', contexto: 'Em casa, depois do trabalho.',
      pensamentos: ['Fiz algo errado.', 'Ela está chateada comigo.'], emocoes: [{ nome: 'Ansiedade', antes: 70, depois: 40 }, { nome: 'Tristeza', antes: 40, depois: 30 }],
      sensacoes: 'Aperto no peito.', comportamento: 'Fiquei olhando o celular toda hora.', evidFavor: 'Ela visualizou e não respondeu.',
      evidContra: 'Ela costuma demorar quando está trabalhando. Ontem conversamos normalmente.', outrasExplic: 'Pode estar ocupada, cansada ou ter esquecido de responder.',
      alguemQuerido: 'Diria que uma mensagem sem resposta não é prova de nada.', distorcoes: ['leitura-mental'],
      alternativo: 'Não receber resposta não prova que fiz algo errado; existem outras explicações.' }),
    rec({ when: at(3, 9, 30), status: 'completo', situacao: 'Meu chefe marcou uma reunião sem dizer o assunto.', pensamentos: ['Vou ser demitido.'],
      emocoes: [{ nome: 'Medo', antes: 80, depois: 50 }, { nome: 'Ansiedade', antes: 75, depois: 45 }], sensacoes: 'Coração acelerado, mãos frias.',
      evidFavor: 'A empresa está cortando custos.', evidContra: 'Recebi elogio no último projeto. Reuniões sem pauta são comuns aqui.',
      outrasExplic: 'Pode ser sobre um projeto novo ou um feedback.', distorcoes: ['catastrofizacao', 'adivinhacao'],
      alternativo: 'Não sei o assunto da reunião. Estou imaginando o pior, mas há outras possibilidades mais prováveis.' }),
    rec({ when: at(5, 19, 0), status: 'breve', situacao: 'Esqueci o aniversário de um primo.', pensamentos: ['Sou uma pessoa horrível.'],
      emocoes: [{ nome: 'Culpa', antes: 65, depois: null }, { nome: 'Vergonha', antes: 50, depois: null }] }),
    rec({ when: at(8, 14, 20), status: 'completo', situacao: 'Recebi uma crítica sobre um relatório.', pensamentos: ['Nunca faço nada direito.'],
      emocoes: [{ nome: 'Frustração', antes: 70, depois: 45 }, { nome: 'Tristeza', antes: 50, depois: 35 }],
      evidFavor: 'Havia dois erros no relatório.', evidContra: 'O resto foi aprovado. Já entreguei vários relatórios elogiados.',
      alguemQuerido: 'Diria que errar em um ponto não apaga todo o trabalho.', distorcoes: ['generalizacao', 'filtro-mental'],
      alternativo: 'Errei em dois pontos e posso corrigir. Isso não significa que nunca faço nada direito.' }),
    rec({ when: at(11, 22, 40), status: 'completo', situacao: 'Não consegui dormir pensando nas contas do mês.', pensamentos: ['Não vou dar conta.'],
      emocoes: [{ nome: 'Ansiedade', antes: 85, depois: 60 }], evidFavor: 'Os gastos aumentaram este mês.',
      evidContra: 'Já passei por meses apertados e consegui me organizar.', outrasExplic: 'Estou cansado, e à noite tudo parece maior.',
      distorcoes: ['adivinhacao'], alternativo: 'Este mês está apertado, mas posso fazer uma lista amanhã e ver o que dá para ajustar.' }),
    rec({ when: at(14, 18, 15), status: 'breve', situacao: 'Um amigo cancelou o encontro em cima da hora.', pensamentos: ['Ninguém quer passar tempo comigo.'],
      emocoes: [{ nome: 'Solidão', antes: 60, depois: null }, { nome: 'Tristeza', antes: 55, depois: null }] }),
    rec({ when: at(17, 8, 45), status: 'completo', situacao: 'Cheguei atrasado em uma reunião importante.', pensamentos: ['Todo mundo achou que sou irresponsável.'],
      emocoes: [{ nome: 'Vergonha', antes: 70, depois: 40 }, { nome: 'Ansiedade', antes: 60, depois: 35 }],
      evidContra: 'Ninguém comentou nada. Avisei que ia atrasar.', distorcoes: ['leitura-mental', 'rotulacao'],
      alternativo: 'Me atrasei uma vez, avisei, e não sei o que os outros pensaram. Um atraso não define quem eu sou.' }),
  ];

  const ck = (daysBack, h, humor, emocoes, notas = '') => ({ id: RS.uid(), demo: true, when: at(daysBack, h), humor, emocoes: emocoes.map(([nome, intensidade]) => ({ nome, intensidade })), notas });
  const CHECKINS = () => [
    ck(0, 8, 4, [['Calma', 60]], 'Dormi bem.'), ck(1, 20, 2, [['Ansiedade', 65]], 'Dia corrido.'), ck(2, 12, 3, [['Desânimo', 40]]),
    ck(4, 21, 4, [['Alívio', 55], ['Gratidão', 50]], 'Resolvi a pendência do trabalho.'), ck(6, 9, 3, [['Ansiedade', 50]]),
    ck(9, 19, 2, [['Frustração', 60], ['Irritação', 45]]), ck(12, 22, 1, [['Ansiedade', 80]], 'Preocupado com as contas.'),
    ck(15, 18, 3, [['Solidão', 45]]), ck(19, 10, 4, [['Alegria', 65]], 'Almoço em família.'),
  ];

  RS.demo = {
    has: () => !!RS.store.session.data && (RS.store.records().some((r) => r.demo) || RS.store.checkins().some((c) => c.demo)),
    load() {
      const d = RS.store.session.data;
      d.records.push(...RECORDS());
      d.checkins.push(...CHECKINS());
      RS.store.saveNow();
    },
    clear() {
      const d = RS.store.session.data;
      d.records = d.records.filter((r) => !r.demo);
      d.checkins = d.checkins.filter((c) => !c.demo);
      RS.store.saveNow();
    },
  };
})(window.RS);
