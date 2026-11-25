# ReSignifica · Versão piloto v0.3.1

> *Um pensamento de cada vez.*
> Implementação do **Briefing de produto v1.0** (23/11/2026), seguindo o escopo de MVP da §9.
> É um app web responsivo e instalável (PWA), sem servidor. Os dados ficam no aparelho do usuário, criptografados.
>
> **Versão de teste online:** https://marlon-ti.github.io/resignifica/ · Guia rápido: [COMO-TESTAR.md](COMO-TESTAR.md)

---

## Versão 0.3.1 (25/11/2026)

- **Relatório para terapeuta:** o formato padrão agora é **Completo**, que inclui tudo o que a pessoa escreveu em cada registro e as respostas abertas dos check-ins (check-ins incluídos por padrão). O Resumido continua disponível e avisa que não leva nenhum texto. Teste conferiu os 14 campos abertos no PDF.
- **Rosália em destaque:** cartão com nome, CRP e link para o Instagram (@rosaliamoreira_psicologa) nas Boas-vindas, no Início e no Sobre; crédito na tela Aprender.

## Novidades da versão 0.3 (25/11/2026)

| Item | O que mudou |
|---|---|
| **Backup restaurável** | Perfil → Backup. Gera um arquivo `.json` cifrado (AES-GCM 256, chave derivada da *senha do backup* com PBKDF2-SHA256 310 mil iterações). Restaurar mescla: itens novos entram, item repetido fica com a versão mais recente, nada é apagado. Dados de exemplo não entram no backup |
| **Nova emoção na reavaliação** | Na etapa 8 dá para adicionar uma emoção que surgiu depois da reflexão. Ela aparece como "surgiu após a reflexão" na revisão, no detalhe e no relatório, e não entra na comparação antes/depois |

```
 Aparelho A                                     Aparelho B (ou o mesmo, após reinstalar)
 ┌───────────────┐   Criar backup   ┌──────────────────────┐   Restaurar   ┌───────────────┐
 │ cofre cifrado │ ───────────────▶ │ ReSignifica-backup-  │ ────────────▶ │ conta nova ou │
 │ (senha do app)│  + senha backup  │ AAAA-MM-DD.json      │ + senha backup│ existente     │
 └───────────────┘                  │ cabeçalho legível +  │               │ (mescla)      │
                                    │ conteúdo cifrado     │               └───────────────┘
                                    └──────────────────────┘
```

**Tradeoff:** a senha do backup não é recuperável. Perdeu a senha, o arquivo vira lixo. É o preço de ninguém além do usuário conseguir ler o arquivo, nem quem o encontrar no e-mail ou na nuvem.

## Versão 0.2.1 (avaliação consolidada, 25/11/2026)

CRP 04/37430 na área Sobre; ajustes de texto; ajuda em crises por situação com telefones clicáveis; grau de crença sem resposta fica vazio; revisão final com edição direta por etapa; dados de exemplo fora da jornada e do relatório quando há registros reais.

---

## Novidades da versão 0.2 (revisão do piloto, 24/11/2026)

Aplicadas as recomendações de *ReSignifica – Revisão do projeto piloto* (conteúdo psicológico: Rosália Moreira):

| Revisão | O que mudou |
|---|---|
| Boas-vindas | Novo texto de abertura e 4 blocos ("Conhecimento que transforma", "Cuidado com responsabilidade", "Sua privacidade importa", "Quando precisar de ajuda") |
| Confirmações | 3 confirmações separadas (18+, finalidade e limites, Política de Privacidade e Termos de Uso); botão só libera com as três. Termos de Uso provisórios |
| Identificação livre | Nome de preferência **opcional** (nome, apelido, fictício ou nenhum); saudação neutra sem nome; editável no perfil |
| Privacidade | Removidas promessas sobre publicidade/IA até confirmação técnica e contratual; aviso de que privacidade não é anonimato |
| Meu momento | "Não consigo identificar o que estou sentindo", emoção personalizada, escala 0–100 explicada, pergunta "O que contribuiu…" |
| Registro | **9 etapas**: situação, pensamento, **grau de crença**, emoções, sensações, comportamento, reflexão, **reavaliação da crença e das emoções**, **plano de ação**, mais revisão final. Breve, rascunho e pular etapas mantidos |
| Outras perspectivas | Princípio clínico (realista, flexível e funcional; nem todo pensamento desconfortável é distorcido) e novo banco de 7 perguntas socráticas, 2 por vez |
| Aprender | Correção conceitual sobre interpretação e outros fatores (experiências, condições físicas, contexto) |
| Minha jornada | Grau de crença antes/depois; aviso de que intensidade igual ou maior não é fracasso |
| Relatório | Formatos **resumido** e **completo**; nome: nenhum, de preferência ou outro só para o relatório; remover itens na prévia; metadados do PDF neutros; pergunta de fechamento nova |
| Sobre | Nova área "Sobre o ReSignifica": propósito, idealização, fundamentação, referências e limites (CRP a confirmar) |
| Acessibilidade | Fonte base maior, bordas de campos com mais contraste, mais espaçamento |

**Fica para a equipe** (não é código): validação clínica de todos os textos, parecer jurídico/LGPD, definição de armazenamento definitivo e o teste piloto com 15 pessoas.

---

## Como rodar

**Opção 1: abrir direto.** Dê dois cliques em `index.html`. Funciona no Chrome e no Edge. Nesse modo não há instalação nem modo offline.

**Opção 2: servidor local**, que habilita PWA, modo offline e instalação:

```bash
cd resignifica
python -m http.server 8080
# abrir http://localhost:8080
```

**Para publicar**, basta qualquer hospedagem estática com HTTPS. Este repositório publica no GitHub Pages a partir da branch `main`, sem etapa de build.

---

## O que foi implementado (mapa do briefing)

| Briefing | Status | Onde |
|---|---|---|
| §3 Identidade (sálvia `#6AB692`, fundo `#F3FAF3`, verde-escuro no texto) | ✅ | `css/styles.css` |
| §3 Navegação: Início / Meu momento / Meus pensamentos / Outras perspectivas / Minha jornada / Aprender / Perfil e privacidade | ✅ Menu lateral no desktop; 4 abas + "Mais" no celular | `js/app.js` |
| §4 Fluxo de 7 etapas (situação → pensamento → emoções → reflexão → alternativo → reavaliação → salvar) | ✅ | `js/views-record.js` |
| §4 Registrar sem completar a reestruturação | ✅ "Salvar sem reflexão" na etapa 3 | |
| §4 Múltiplos pensamentos ("futuramente") | ✅ Já incluído | |
| §5.1 Check-in com emoções e intensidade 0–100, notas, sem culpa | ✅ | `js/views-main.js` |
| §5.1 Lembretes opcionais e desativáveis | ⚠️ Parcial (ver limitações) | `js/app.js` |
| §5.2 Criar/editar/rascunho/excluir; filtros por data, emoção e palavra-chave; breve vs completo | ✅ | `js/views-record.js` |
| §5.3 Perguntas socráticas progressivas; distorções sem rótulo automático; pular e retomar | ✅ | `js/views-main.js` |
| §5.4 Calendário, emoções frequentes, temas recorrentes, antes/depois, resumo semanal/mensal, com avisos de cautela | ✅ | `js/views-journey.js` |
| §5.5 Conteúdos educativos (6 temas) | ✅ Texto provisório | `js/content.js` |
| §6 Relatório para terapeuta: período, seleção de registros e campos, campo em destaque, prévia, PDF, compartilhamento com confirmação, ocultar nome | ✅ | `js/report.js` |
| §7 Criptografia em repouso, sessão com bloqueio por inatividade, exportação e exclusão de dados, avisos, apoio em crise | ✅ | `js/crypto.js`, `js/store.js`, `js/views-profile.js` |
| §8 Telas sugeridas | ✅ Todas | |
| §10 Critérios de aceite | ✅ Testados (ver abaixo) | |

---

## Arquitetura

```
 ┌──────────────────────────── Navegador / celular ─────────────────────────────┐
 │                                                                              │
 │  index.html ─▶ app.js (rotas #/..., layout, sessão, lembretes)                │
 │                   │                                                          │
 │                   ├─▶ views-*.js  (telas)          content.js (textos)       │
 │                   ├─▶ report.js   (prévia + PDF via jsPDF, local)            │
 │                   ▼                                                          │
 │               store.js ──▶ crypto.js ──▶ IndexedDB                           │
 │               (dados em    (PBKDF2 310k    ├─ accounts: nome, e-mail, salt,  │
 │                memória)     + AES-GCM)     │            verificador cifrado  │
 │                                            └─ vaults:   TODO o conteúdo      │
 │                                                         cifrado (AES-256)    │
 │  sw.js: cache só dos arquivos do app (offline). Nunca guarda dados.          │
 └──────────────────────────────────────────────────────────────────────────────┘
                 Nenhum dado sai do aparelho sem ação explícita do usuário
                 (baixar PDF, compartilhar PDF, exportar JSON, criar backup).
```

**Cadastro e entrada.** A senha gera uma chave (PBKDF2-SHA256, 310 mil iterações). A chave existe apenas em memória durante a sessão. Ao sair, recarregar a página ou ficar inativo (2, 5, 10 ou 30 minutos, configurável), a sessão fecha e é preciso digitar a senha de novo. Os dados permanecem salvos.

**Autosave.** Cada campo digitado é salvo, cifrado, em cerca de 0,4 s. Ao interromper um registro, ele vira rascunho, aparece no Início e retoma na etapa onde parou.

**Prévia = PDF.** Os dois são gerados da mesma lista de blocos (`buildBlocks`), o que atende o critério da §10. Caracteres que a fonte do PDF não suporta, como emojis, são removidos dos dois.

### Modelo de dados (dentro do cofre cifrado)

```
 data
 ├─ profile { name }
 ├─ settings { autoLockMin, reminder { enabled, time }, lastReminderDay }
 ├─ consent { acceptedAt, termsVersion }
 ├─ records[]   (Meus pensamentos)
 │   ├─ id, status: rascunho | breve | completo, step, when, createdAt, updatedAt
 │   ├─ situacao, contexto, pensamentos[]
 │   ├─ emocoes[] { nome, antes 0–100, depois 0–100 | null }
 │   ├─ sensacoes, comportamento
 │   ├─ evidFavor, evidContra, outrasExplic, alguemQuerido
 │   ├─ distorcoes[] (marcadas pelo usuário)
 │   └─ alternativo, notas
 └─ checkins[]  (Meu momento)
     └─ id, when, humor 1–5, emocoes[] { nome, intensidade }, notas
```

---

## Testes realizados

Teste automatizado ponta a ponta (Playwright, Chromium, 390×844 e 1280×860), **sem erros de console**:

- Boas-vindas → aceite (18+, avisos) → cadastro → Início
- Check-in com humor, emoção, intensidade e nota
- Registro completo nas 7 etapas, com 2 pensamentos, 3 emoções (1 personalizada), reflexão, padrão marcado, alternativo e reavaliação
- Registro breve (sem reflexão)
- Rascunho: digitar → recarregar a página → entrar → volta ao mesmo campo com o texto intacto
- Filtro por palavra-chave
- Jornada, Outras perspectivas, Aprender
- Relatório: com check-ins e campo em destaque → prévia → PDF (conteúdo do PDF conferido contra a prévia)
- Exportação JSON
- Backup (v0.3): senha curta e senhas diferentes recusadas; arquivo sem texto legível; restaurar em outra conta com senha errada recusa, com senha certa traz registros, check-ins e nome; restaurar de novo não duplica
- **IndexedDB sem texto legível** (verificado buscando uma palavra registrada)
- Senha errada recusada; troca de senha preserva os dados
- Exclusão de conta remove tudo

---

## Limitações conhecidas (decisões do programador, conforme §9)

| Limitação | Por quê | Caminho |
|---|---|---|
| Dados só neste aparelho; sem sincronização | Não há backend; o briefing deixa a arquitetura em aberto | Adicionar backend com sincronização cifrada, se decidido |
| **Senha esquecida = dados perdidos** | A criptografia é local e ninguém mais tem a chave | Avisado no cadastro e em "Esqueci a senha". Com backend, dá para oferecer recuperação, com tradeoff de privacidade |
| Lembretes só disparam com o app aberto ou em segundo plano | Lembrete com o app fechado exige servidor de push | Web Push com backend, ou app nativo |
| No iPhone, o Safari pode apagar dados de sites **não instalados** após ~7 dias sem uso | Política do navegador | Orientar a instalação ("Adicionar à Tela de Início"); o app já pede armazenamento persistente |
| "Compartilhar" depende do navegador | `navigator.share` com arquivos não existe em todos | Se não houver, aparece só "Baixar PDF" |
| Conteúdo educativo, textos de crise e política de privacidade são **provisórios** | O briefing exige revisão profissional e jurídica | Revisão clínica (§5.5) e jurídica/LGPD (§7) antes de publicar |

---

## Estrutura de arquivos

```
resignifica/
├─ index.html              página única (CSP restritiva, sem scripts de terceiros)
├─ COMO-TESTAR.md         guia rápido para testadores
├─ manifest.webmanifest    instalação como app
├─ sw.js                   offline (cache dos arquivos do app)
├─ css/styles.css
├─ icons/                  icon.svg, icon-192.png, icon-512.png
├─ vendor/jspdf.umd.min.js jsPDF 2.5.1 (local, sem CDN)
└─ js/
   ├─ util.js              helpers, modal, toast, ícones
   ├─ crypto.js            PBKDF2 + AES-GCM
   ├─ store.js             IndexedDB, sessão, CRUD
   ├─ content.js           emoções, perguntas, distorções, artigos, crise
   ├─ views-auth.js        boas-vindas, cadastro, entrar, esqueci a senha
   ├─ views-main.js        início, meu momento, outras perspectivas, aprender, ajuda
   ├─ views-record.js      meus pensamentos + fluxo de 7 etapas
   ├─ views-journey.js     minha jornada + estatísticas
   ├─ report.js            relatório para terapeuta (prévia + PDF)
   ├─ demo.js              dados de exemplo (para testar sem digitar)
   ├─ views-profile.js     perfil e privacidade
   └─ app.js               rotas, layout, sessão, lembretes
```
