/* Conteúdo do app. IMPORTANTE: textos educativos e de apoio são PROVISÓRIOS e
   precisam de revisão por profissional habilitado antes do lançamento (briefing §5.5 e §7). */
'use strict';
(function (RS) {
  const EMOTIONS = [
    'Ansiedade', 'Medo', 'Tristeza', 'Raiva', 'Irritação', 'Culpa', 'Vergonha', 'Frustração',
    'Solidão', 'Ciúme', 'Desânimo', 'Insegurança', 'Alegria', 'Calma', 'Alívio', 'Gratidão', 'Esperança',
  ];

  const MOODS = [
    { v: 1, label: 'Muito difícil' }, { v: 2, label: 'Difícil' }, { v: 3, label: 'Mais ou menos' },
    { v: 4, label: 'Bem' }, { v: 5, label: 'Muito bem' },
  ];

  const STEPS = [
    { n: 1, title: 'Situação', short: 'Situação' },
    { n: 2, title: 'Pensamento automático', short: 'Pensamento' },
    { n: 3, title: 'Grau de crença', short: 'Crença' },
    { n: 4, title: 'Emoções', short: 'Emoções' },
    { n: 5, title: 'Sensações físicas', short: 'Corpo' },
    { n: 6, title: 'Comportamento', short: 'Comportamento' },
    { n: 7, title: 'Reflexão', short: 'Reflexão' },
    { n: 8, title: 'Reavaliação', short: 'Reavaliação' },
    { n: 9, title: 'Plano de ação', short: 'Plano' },
  ];
  const REVIEW_STEP = 10; // tela final de revisão e salvamento (não conta como etapa)

  /* Banco de perguntas socráticas (revisão do piloto). Mostradas poucas por vez, sempre puláveis. */
  const SOCRATIC = [
    'Estou interpretando a situação ou descrevendo um fato?',
    'Quais evidências sustentam meu pensamento? Existem evidências que não estou considerando?',
    'Estou tentando prever o futuro ou presumindo o que outra pessoa pensa?',
    'Estou confundindo uma possibilidade com uma certeza?',
    'O que eu diria a alguém querido que estivesse passando por isso?',
    'Existe uma maneira mais equilibrada de compreender o que aconteceu?',
    'O que está sob meu controle neste momento?',
  ];

  const PRINCIPLE = 'O objetivo não é pensar positivo, mas aprender a pensar de maneira mais realista, flexível e funcional. Nem todo pensamento desconfortável é distorcido: algumas situações são de fato difíceis, injustas ou ameaçadoras.';

  /* Possíveis padrões de pensamento — o app NUNCA rotula automaticamente; o usuário escolhe se algum faz sentido. */
  const DISTORTIONS = [
    { id: 'catastrofizacao', name: 'Catastrofização', desc: 'Imaginar o pior cenário como se fosse o mais provável.', ex: '“Se eu errar nessa reunião, vou ser demitido.”' },
    { id: 'leitura-mental', name: 'Leitura mental', desc: 'Concluir o que os outros estão pensando sem ter como saber.', ex: '“Ela não respondeu porque está chateada comigo.”' },
    { id: 'adivinhacao', name: 'Adivinhação do futuro', desc: 'Prever que algo vai dar errado, como se já fosse certo.', ex: '“Nem adianta tentar, não vai funcionar.”' },
    { id: 'tudo-ou-nada', name: 'Tudo ou nada', desc: 'Ver as coisas só em extremos, sem meio-termo.', ex: '“Se não ficou perfeito, foi um fracasso.”' },
    { id: 'generalizacao', name: 'Generalização', desc: 'Tirar uma conclusão ampla a partir de um único fato.', ex: '“Sempre dá errado comigo.”' },
    { id: 'filtro-mental', name: 'Filtro mental', desc: 'Dar atenção só ao que foi negativo e deixar o resto de lado.', ex: '“Recebi vários elogios, mas só penso na crítica.”' },
    { id: 'desqualificar', name: 'Desqualificar o positivo', desc: 'Achar que o que deu certo não conta.', ex: '“Só consegui porque foi sorte.”' },
    { id: 'raciocinio-emocional', name: 'Raciocínio emocional', desc: 'Tomar o que se sente como prova de que algo é verdade.', ex: '“Eu me sinto um fracasso, então eu sou.”' },
    { id: 'deveria', name: '“Deveria” e “tenho que”', desc: 'Regras rígidas sobre como eu ou os outros precisamos ser.', ex: '“Eu deveria dar conta de tudo sozinho.”' },
    { id: 'rotulacao', name: 'Rotulação', desc: 'Resumir uma pessoa (ou a si mesmo) num rótulo a partir de um comportamento.', ex: '“Sou um idiota.”' },
    { id: 'personalizacao', name: 'Personalização', desc: 'Assumir para si a responsabilidade por algo que tem várias causas.', ex: '“O passeio foi ruim por minha culpa.”' },
  ];

  const LEARN = [
    {
      id: 'pensamentos-automaticos', title: 'Pensamentos automáticos', summary: 'Ideias rápidas que surgem sozinhas e influenciam como nos sentimos.',
      body: `
<p>Pensamentos automáticos são interpretações rápidas que aparecem diante de uma situação, quase sem percebermos. Eles não são escolhidos: simplesmente surgem.</p>
<p>Na Terapia Cognitivo-Comportamental (TCC), uma ideia central é que <strong>a maneira como interpretamos uma situação influencia significativamente nossas emoções e nossos comportamentos</strong>, juntamente com outros fatores, como nossas experiências, condições físicas e contexto de vida.</p>
<h2>Um exemplo</h2>
<p>Situação: você envia uma mensagem e não recebe resposta.</p>
<ul><li>Pensamento: “Fiz algo errado.” → ansiedade.</li><li>Pensamento: “Deve estar ocupada.” → tranquilidade.</li></ul>
<p>A situação é a mesma. A interpretação muda, e com ela muda também o que sentimos.</p>
<h2>Como perceber</h2>
<ul><li>Quando notar uma mudança no que sente, pergunte: “O que passou pela minha cabeça agora?”</li><li>Escreva com as palavras exatas, mesmo que pareçam exageradas.</li><li>Lembre: ter um pensamento não significa que ele seja verdade, e também não significa que seja falso. Ele é uma interpretação a ser examinada.</li></ul>`,
    },
    {
      id: 'emocoes', title: 'Emoções', summary: 'O que são, para que servem e como nomeá-las.',
      body: `
<p>Emoções são reações naturais e têm função: o medo protege, a tristeza sinaliza perdas, a raiva aponta limites ultrapassados. <strong>Não existem emoções “erradas”.</strong></p>
<h2>Por que nomear ajuda</h2>
<p>Dar nome ao que sentimos ajuda a organizar a experiência e a perceber padrões. Em vez de “estou mal”, tente: “estou com ansiedade, intensidade 60”.</p>
<h2>Emoção, pensamento e corpo</h2>
<ul><li><strong>Pensamento:</strong> “Vou ser julgado.”</li><li><strong>Emoção:</strong> vergonha, ansiedade.</li><li><strong>Corpo:</strong> coração acelerado, rosto quente.</li><li><strong>Comportamento:</strong> evitar falar.</li></ul>
<p>Esses elementos se influenciam. Observar cada um ajuda a entender o todo.</p>`,
    },
    {
      id: 'crencas', title: 'Crenças', summary: 'Ideias mais profundas sobre nós, os outros e o mundo.',
      body: `
<p>Por trás de muitos pensamentos automáticos existem <strong>crenças</strong>: ideias mais profundas e duradouras, geralmente formadas ao longo da vida.</p>
<ul><li><strong>Crenças centrais:</strong> ideias amplas, como “não sou capaz” ou “as pessoas não são confiáveis”.</li><li><strong>Regras e pressupostos:</strong> “se eu não agradar a todos, serei rejeitado”.</li></ul>
<p>Crenças podem ter feito sentido em algum momento da história de alguém. Revisá-las é um trabalho gradual, que costuma ser feito com apoio profissional.</p>
<p>Ao registrar pensamentos com frequência, você pode notar temas que se repetem. Isso pode ser um bom assunto para conversar em terapia.</p>`,
    },
    {
      id: 'distorcoes', title: 'Distorções cognitivas', summary: 'Padrões comuns de pensamento que podem distorcer a leitura das situações.',
      body: `
<p>Distorções cognitivas são formas comuns de interpretar as situações que podem deixar a leitura mais rígida ou mais negativa do que os fatos sustentam. <strong>Todo mundo tem esses padrões às vezes.</strong> Identificá-los não é se culpar, é ganhar clareza.</p>
${'{DISTORTIONS}'}
<p>Use esta lista como apoio, não como diagnóstico. Um mesmo pensamento pode ter vários padrões, ou nenhum.</p>`,
    },
    {
      id: 'autocompaixao', title: 'Autocompaixão', summary: 'Tratar a si mesmo com a gentileza que daria a alguém querido.',
      body: `
<p>Autocompaixão é tratar a si mesmo com a mesma gentileza que ofereceríamos a uma pessoa querida num momento difícil. Não é ter pena de si nem se acomodar.</p>
<h2>Três elementos</h2>
<ul><li><strong>Atenção ao momento:</strong> reconhecer “isso está difícil para mim agora”.</li><li><strong>Humanidade compartilhada:</strong> outras pessoas também passam por isso.</li><li><strong>Gentileza:</strong> perguntar “do que eu preciso agora?” em vez de se criticar.</li></ul>
<h2>Na prática</h2>
<p>Na reflexão guiada, a pergunta “O que você diria a alguém querido?” é um exercício de autocompaixão. Muitas vezes somos muito mais duros com nós mesmos do que com os outros.</p>`,
    },
    {
      id: 'tcc', title: 'Fundamentos da TCC', summary: 'O que é a Terapia Cognitivo-Comportamental e como este app se relaciona com ela.',
      body: `
<p>A Terapia Cognitivo-Comportamental (TCC) é uma abordagem de psicoterapia com ampla base de pesquisa. Ela trabalha a relação entre <strong>situações, pensamentos, emoções, sensações e comportamentos</strong>.</p>
<h2>O registro de pensamentos</h2>
<p>Uma das ferramentas mais conhecidas da TCC é o registro de pensamentos: anotar a situação, o pensamento, o quanto se acredita nele, as emoções, as reações do corpo e o comportamento; depois, examinar o pensamento com calma, reavaliar e pensar em possíveis ações. O fluxo “Registrar pensamento” deste app segue essa lógica.</p>
<h2>O que este app é, e o que não é</h2>
<ul><li>É uma ferramenta educativa e de autoconhecimento.</li><li><strong>Não</strong> faz diagnóstico, <strong>não</strong> é atendimento psicológico e <strong>não</strong> substitui terapia.</li><li>O objetivo não é “pensar positivo”, mas aprender a pensar de maneira mais realista, flexível e funcional.</li><li>Nem todo pensamento desconfortável é distorcido: algumas situações são de fato difíceis, injustas ou ameaçadoras.</li></ul>
<p>Se você faz terapia, pode levar seus registros para a sessão usando “Compartilhar com meu terapeuta”.</p>`,
    },
  ];

  const CRISIS = `
<p><strong>Se você corre risco agora, priorize ajuda de emergência.</strong> Você não precisa passar por isso sozinho(a).</p>
<h3>Risco imediato à vida ou emergência médica</h3>
<ul class="notice-list">
  <li><a href="tel:192"><strong>SAMU: ligue 192</strong></a>, ou vá ao <strong>pronto-socorro ou UPA</strong> mais próximo.</li>
</ul>
<h3>Ameaça à sua segurança</h3>
<ul class="notice-list">
  <li><a href="tel:190"><strong>Polícia: ligue 190</strong></a>.</li>
</ul>
<h3>Apoio emocional</h3>
<ul class="notice-list">
  <li><a href="tel:188"><strong>CVV (Centro de Valorização da Vida): ligue 188</strong></a>. Gratuito, 24 horas, com sigilo. Também atende por chat em <a href="https://cvv.org.br" target="_blank" rel="noopener noreferrer">cvv.org.br</a>.</li>
</ul>
<h3>Acompanhamento</h3>
<ul class="notice-list">
  <li>Procure um <strong>CAPS</strong> (Centro de Atenção Psicossocial) ou uma <strong>UBS</strong> (Unidade Básica de Saúde) da sua cidade.</li>
</ul>
<p>Se possível, avise uma pessoa de confiança e não fique sozinho(a).</p>
<p class="muted">O ReSignifica não monitora o que você escreve e não oferece atendimento ou resposta em tempo real.</p>`;

  /* Boas-vindas (revisão do piloto, texto de Rosália Moreira) */
  const WELCOME = `
<p>Nem sempre podemos mudar o que acontece, mas podemos aprender a ampliar nossa maneira de compreender o que vivemos.</p>
<p>O ReSignifica é um espaço para você compreender seus pensamentos, reconhecer suas emoções, identificar padrões e descobrir novas perspectivas.</p>
<p>Por meio de registros e reflexões guiadas, você poderá desenvolver um olhar mais consciente, realista e acolhedor sobre suas experiências.</p>
<p>Você pode utilizar este espaço fazendo terapia ou não. Se desejar, também poderá compartilhar seus registros com um terapeuta de sua escolha.</p>
<p><strong>No seu tempo. No seu ritmo. Um pensamento de cada vez.</strong></p>`;

  const NOTICE_BLOCKS = [
    { title: 'Conhecimento que transforma', text: 'Ferramenta educativa e de autoconhecimento baseada nos princípios da Terapia Cognitivo-Comportamental.' },
    { title: 'Cuidado com responsabilidade', text: 'Não realiza diagnósticos, não oferece atendimento psicológico e não substitui psicoterapia.' },
    { title: 'Sua privacidade importa', text: 'Você decide quais registros deseja compartilhar. Nada é enviado sem uma ação sua.' },
    { title: 'Quando precisar de ajuda', text: 'O aplicativo não monitora seus registros nem oferece atendimento em tempo real. Para apoio emocional, procure o CVV (188). Em emergência, ligue para o SAMU (192).' },
  ];
  const NOTICES = NOTICE_BLOCKS.map((n) => `<strong>${n.title}:</strong> ${n.text}`);

  const TERMS = `
<p class="card warn">Versão provisória para o piloto. Os Termos de Uso definitivos devem ser elaborados com assessoria jurídica.</p>
<h2>Finalidade</h2>
<p>O ReSignifica é uma ferramenta educativa e de autoconhecimento baseada nos princípios da Terapia Cognitivo-Comportamental, destinada a pessoas com 18 anos ou mais.</p>
<h2>Limites</h2>
<ul><li>Não realiza diagnósticos, não oferece atendimento psicológico e não substitui psicoterapia.</li>
<li>Não monitora os registros e não oferece atendimento em tempo real. Em crise, procure o CVV (188) ou, em emergência, o SAMU (192).</li>
<li>Padrões e gráficos são descritivos. Não são avaliação clínica.</li></ul>
<h2>Responsabilidades do usuário</h2>
<ul><li>Guardar a própria senha. Nesta versão de teste, ela não pode ser recuperada.</li>
<li>Decidir o que registrar, exportar e compartilhar, e com quem.</li></ul>
<h2>Versão de teste</h2>
<p>Durante o piloto, recomenda-se usar dados fictícios até a validação de segurança.</p>`;

  const ABOUT = `
<h2>Propósito</h2>
<p>Oferecer um espaço acolhedor para que adultos, fazendo terapia ou não, compreendam seus pensamentos, reconheçam suas emoções, identifiquem padrões e descubram novas perspectivas.</p>
<p><em>Acolher sem invadir. Orientar sem impor. Estimular a reflexão sem julgar. Proteger sem retirar a autonomia.</em></p>
<h2>Idealização e conteúdo psicológico</h2>
<p><strong>Rosália Moreira</strong>, psicóloga clínica, Terapia Cognitivo-Comportamental. CRP 04/37430.</p>
<h2>Equipe</h2>
<p>Desenvolvimento: Marlon.</p>
<h2>Fundamentação</h2>
<p>O ReSignifica se baseia em princípios da Terapia Cognitivo-Comportamental, como o registro de pensamentos, o questionamento socrático e a psicoeducação sobre emoções e padrões de pensamento.</p>
<h2>Referências</h2>
<ul><li>Beck, J. S. <em>Terapia Cognitivo-Comportamental: teoria e prática</em>. Artmed.</li>
<li>Greenberger, D.; Padesky, C. A. <em>A mente vencendo o humor</em>. Artmed.</li></ul>
<p class="muted">Lista provisória, a ser revisada pela responsável pelo conteúdo psicológico.</p>
<h2>Limites</h2>
<p>Ferramenta educativa e de autoconhecimento. Não realiza diagnósticos, não oferece atendimento psicológico e não substitui psicoterapia. Não monitora registros nem oferece atendimento em tempo real.</p>`;

  RS.content = { WELCOME, NOTICE_BLOCKS, TERMS, ABOUT, EMOTIONS, MOODS, STEPS, REVIEW_STEP, PRINCIPLE, SOCRATIC, DISTORTIONS, LEARN, CRISIS, NOTICES };
})(window.RS);
