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
    { n: 3, title: 'Emoções e reações', short: 'Emoções' },
    { n: 4, title: 'Reflexão guiada', short: 'Reflexão' },
    { n: 5, title: 'Pensamento alternativo', short: 'Alternativo' },
    { n: 6, title: 'Reavaliação', short: 'Reavaliação' },
    { n: 7, title: 'Salvar e revisar', short: 'Revisar' },
  ];

  /* Perguntas socráticas progressivas, em linguagem cotidiana */
  const SOCRATIC = [
    { level: 'Entender o pensamento', qs: [
      'O que exatamente esse pensamento está dizendo sobre você, sobre os outros ou sobre o futuro?',
      'Quanto você acredita nele agora, de 0 a 100?',
    ] },
    { level: 'Olhar para os fatos', qs: [
      'O que aconteceu de fato, e o que foi interpretação minha?',
      'Que fatos apoiam esse pensamento?',
      'Que fatos não se encaixam nele?',
    ] },
    { level: 'Abrir outras possibilidades', qs: [
      'Que outras explicações poderiam existir para o que aconteceu?',
      'Se eu estivesse num dia mais tranquilo, como veria essa situação?',
      'Já passei por algo parecido? O que aconteceu daquela vez?',
    ] },
    { level: 'Pensar nas consequências', qs: [
      'Se o pior acontecesse, como eu poderia lidar com isso?',
      'O que é mais provável que aconteça?',
      'Acreditar nesse pensamento me ajuda ou me atrapalha agora?',
    ] },
    { level: 'Olhar com gentileza', qs: [
      'O que eu diria a uma pessoa querida que estivesse pensando isso?',
      'O que essa pessoa querida me diria se soubesse o que estou pensando?',
      'Daqui a um ano, como talvez eu veja essa situação?',
    ] },
  ];

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
<p>Na Terapia Cognitivo-Comportamental (TCC), a ideia central é que <strong>não é só a situação que gera o que sentimos, mas também a forma como a interpretamos</strong>.</p>
<h2>Um exemplo</h2>
<p>Situação: você envia uma mensagem e não recebe resposta.</p>
<ul><li>Pensamento: “Fiz algo errado.” → ansiedade.</li><li>Pensamento: “Deve estar ocupada.” → tranquilidade.</li></ul>
<p>A situação é a mesma. O que muda é a interpretação.</p>
<h2>Como perceber</h2>
<ul><li>Quando notar uma mudança no que sente, pergunte: “O que passou pela minha cabeça agora?”</li><li>Escreva com as palavras exatas, mesmo que pareçam exageradas.</li><li>Lembre: ter um pensamento não significa que ele seja verdade.</li></ul>`,
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
<p>Uma das ferramentas mais conhecidas da TCC é o registro de pensamentos: anotar a situação, o pensamento, a emoção e, depois, examinar o pensamento com calma para construir uma visão mais equilibrada. O fluxo “Registrar pensamento” deste app segue essa lógica.</p>
<h2>O que este app é, e o que não é</h2>
<ul><li>É uma ferramenta educativa e de autoconhecimento.</li><li><strong>Não</strong> faz diagnóstico, <strong>não</strong> é atendimento psicológico e <strong>não</strong> substitui terapia.</li><li>Pensar de forma mais equilibrada não é “pensar positivo”. É olhar a situação de forma mais completa.</li></ul>
<p>Se você faz terapia, pode levar seus registros para a sessão usando “Compartilhar com meu terapeuta”.</p>`,
    },
  ];

  const CRISIS = `
<p><strong>Se você está pensando em tirar a própria vida, se machucar ou corre perigo agora, procure ajuda imediatamente.</strong> Você não precisa passar por isso sozinho(a).</p>
<ul class="notice-list">
  <li><strong>CVV — Centro de Valorização da Vida: ligue 188.</strong> Gratuito, 24 horas, sigilo. Também atende por chat em cvv.org.br.</li>
  <li><strong>SAMU: 192</strong>, em emergências médicas.</li>
  <li><strong>Polícia: 190</strong>, se você estiver em perigo.</li>
  <li>Vá ao <strong>pronto-socorro ou UPA</strong> mais próximo.</li>
  <li>Procure um <strong>CAPS</strong> (Centro de Atenção Psicossocial) ou uma Unidade Básica de Saúde da sua cidade para acompanhamento.</li>
  <li>Avise alguém de confiança e, se possível, não fique sozinho(a).</li>
</ul>
<p class="muted">O ReSignifica não monitora o que você escreve e não oferece atendimento em tempo real.</p>`;

  const NOTICES = [
    'O ReSignifica é uma ferramenta <strong>educativa e de autoconhecimento</strong> baseada em princípios da Terapia Cognitivo-Comportamental.',
    'Ele <strong>não faz diagnóstico</strong>, não oferece atendimento psicológico e <strong>não substitui terapia</strong>.',
    'O app não monitora o que você escreve nem oferece atendimento em tempo real. Em crise, ligue para o <strong>CVV (188)</strong> ou o <strong>SAMU (192)</strong>.',
    'Seus registros são privados e ficam protegidos por senha. Nada é compartilhado sem uma ação sua.',
    'Seus registros não são usados para publicidade nem para treinar inteligência artificial.',
  ];

  RS.content = { EMOTIONS, MOODS, STEPS, SOCRATIC, DISTORTIONS, LEARN, CRISIS, NOTICES };
})(window.RS);
