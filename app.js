const STORAGE_KEY = "exampulse.v1";
const ANALYZER_VERSION = 3;
const SUPABASE_URL = "https://woostdadplbikfwfiqjd.supabase.co";
const SUPABASE_KEY = "sb_publishable_7-rfzQ6TU8nYlADkHEkS9Q_zUHPAOKD";
const SUPABASE_IMAGE_BUCKET = "exercise-images";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
let cloudReady = false;
let syncTimer = null;
let cloudSupportsExerciseImages = true;

const TOPIC_LIBRARY = {
  "Sistemas Digitais": [
    {
      name: "Portas logicas e algebra booleana",
      keywords: ["porta", "and", "or", "not", "nand", "nor", "xor", "xnor", "boole", "boolean", "logica", "expressao", "simplifique", "simplificar"],
    },
    {
      name: "Mapas de Karnaugh",
      keywords: ["karnaugh", "k-map", "mapa", "mintermo", "maxtermo", "agrupamento", "implicante"],
    },
    {
      name: "Flip-flops e registos",
      keywords: ["flip-flop", "flip flop", "jk", "clock", "registo", "registrador", "latch", "bascula"],
    },
    {
      name: "Contadores e sequenciadores",
      keywords: ["contador", "contadores", "sequencia", "sequenciador", "modulo", "sincrono", "assincrono", "estado seguinte"],
    },
    {
      name: "RAM, ROM e memoria",
      keywords: ["ram", "rom", "memoria", "enderec", "barramento", "eprom", "eeprom", "pal", "pla"],
    },
    {
      name: "Maquinas de estados",
      keywords: ["maquina de estados", "fsm", "mealy", "moore", "diagrama de estados", "tabela de estados"],
    },
    {
      name: "Codificadores e multiplexers",
      keywords: ["multiplexer", "mux", "demux", "descodificador", "decodificador", "codificador", "encoder", "decoder", "seletor"],
    },
  ],
  Programacao: [
    {
      name: "Algoritmos e estruturas de controlo",
      keywords: ["algoritmo", "ciclo", "loop", "for", "while", "if", "condicao", "recurs", "complexidade"],
    },
    {
      name: "Arrays, listas e matrizes",
      keywords: ["array", "lista", "vetor", "matriz", "ordenar", "pesquisa", "indice"],
    },
    {
      name: "Funcoes e modularidade",
      keywords: ["funcao", "metodo", "parametro", "retorno", "modulo", "procedimento"],
    },
    {
      name: "Objetos e classes",
      keywords: ["classe", "objeto", "heranca", "polimorfismo", "interface", "atributo"],
    },
  ],
  Matematica: [
    {
      name: "Derivadas e otimizacao",
      keywords: ["derivada", "diferenci", "maximo", "minimo", "otimizacao", "tangente"],
    },
    {
      name: "Integrais",
      keywords: ["integral", "primitiva", "area", "substituicao", "partes"],
    },
    {
      name: "Matrizes e sistemas",
      keywords: ["matriz", "determinante", "sistema", "gauss", "vetor", "autovalor"],
    },
    {
      name: "Probabilidade e estatistica",
      keywords: ["probabilidade", "variavel aleatoria", "distribuicao", "media", "variancia", "desvio"],
    },
  ],
};

const GENERIC_TOPICS = [
  {
    name: "Definicoes e teoria",
    keywords: ["defina", "explique", "justifique", "teoria", "conceito", "propriedade"],
  },
  {
    name: "Calculo e resolucao",
    keywords: ["calcule", "determine", "resolva", "obtenha", "demonstre", "valor"],
  },
  {
    name: "Analise de casos",
    keywords: ["considere", "caso", "exemplo", "interprete", "compare", "discuta"],
  },
];

const STOPWORDS = new Set([
  "sobre", "para", "como", "quando", "onde", "porque", "qual", "quais", "este", "esta", "estes", "estas",
  "numa", "num", "com", "sem", "dos", "das", "uma", "uns", "nas", "nos", "que", "por", "mais", "menos",
  "calcule", "determine", "considere", "explique", "indique", "resolva", "desenhe", "projete", "implemente",
  "exercicio", "questao", "alinea", "valor", "valores", "seguinte", "seguintes", "sistema", "funcao",
  "escola", "superior", "tecnologia", "gestao", "instituto", "politecnico", "guarda", "enunciado",
  "avaliacao", "modelo", "pagina", "curso", "engenharia", "informatica", "data", "duracao", "ano",
  "curricular", "unidade", "frequencia", "exame", "professor", "docente",
]);

const GENERIC_NOISE = new Set([
  "questao", "exercicio", "pergunta", "valor", "valores", "seja", "sendo", "considere", "seguinte",
  "apresente", "indique", "responda", "item", "alinea", "parte", "pontos", "cotacao",
]);

const ACTION_VERBS = new Set([
  "defina", "explique", "justifique", "compare", "calcule", "determine", "resolva", "derive",
  "desenhe", "projete", "implemente", "analise", "interprete", "classifique", "identifique", "discuta",
]);

const SAMPLE_EXERCISES = `1. Simplifique a funcao logica F(A,B,C,D) usando mapas de Karnaugh e implemente o circuito apenas com portas NAND.

2. Considere um contador sincrono modulo 10 com flip-flops JK. Construa a tabela de estados e indique as entradas dos flip-flops.

3. Uma memoria ROM tem 12 linhas de endereco e palavras de 8 bits. Determine a capacidade total e desenhe a organizacao interna.

4. Projete uma maquina de estados do tipo Mealy que deteta a sequencia 1011 numa entrada serie.

5. Implemente a funcao F com um multiplexer 8:1, indicando as linhas de selecao e as entradas de dados.`;

const state = loadState();
let selectedSubjectId = state.selectedSubjectId || state.subjects[0].id;
const manualSelection = {
  fileName: "",
  mode: "question",
  pages: [],
  selections: [],
  drag: null,
};

const els = {
  subjectForm: document.querySelector("#subject-form"),
  newSubject: document.querySelector("#new-subject"),
  subjectList: document.querySelector("#subject-list"),
  manageSubjectsButton: document.querySelector("#manage-subjects-button"),
  subjectModal: document.querySelector("#subject-modal"),
  closeSubjectModal: document.querySelector("#close-subject-modal"),
  subjectManagerList: document.querySelector("#subject-manager-list"),
  subjectManagerNote: document.querySelector("#subject-manager-note"),
  subjectTitle: document.querySelector("#subject-title"),
  subjectAdvice: document.querySelector("#subject-advice"),
  generateAdvice: document.querySelector("#generate-advice"),
  saveAdvice: document.querySelector("#save-advice"),
  documentFiles: document.querySelector("#document-file"),
  documentFileStatus: document.querySelector("#document-file-status"),
  manualSelectionPanel: document.querySelector("#manual-selection-panel"),
  manualQuestionMode: document.querySelector("#manual-question-mode"),
  manualAnnexMode: document.querySelector("#manual-annex-mode"),
  manualUndo: document.querySelector("#manual-undo"),
  manualClear: document.querySelector("#manual-clear"),
  manualSave: document.querySelector("#manual-save"),
  manualSelectionStatus: document.querySelector("#manual-selection-status"),
  manualPageViewer: document.querySelector("#manual-page-viewer"),
  exerciseForm: document.querySelector("#exercise-form"),
  analysisPreview: document.querySelector("#analysis-preview"),
  topicPreview: document.querySelector("#topic-preview"),
  quickPriority: document.querySelector("#quick-priority"),
  documentsList: document.querySelector("#documents-list"),
  studyPlan: document.querySelector("#study-plan"),
  predictionList: document.querySelector("#prediction-list"),
  exerciseSuggestions: document.querySelector("#exercise-suggestions"),
  historyList: document.querySelector("#history-list"),
  seedButton: document.querySelector("#seed-button"),
  clearSubject: document.querySelector("#clear-subject"),
  generateFrequentTest: document.querySelector("#generate-frequent-test"),
  generateOverdueTest: document.querySelector("#generate-overdue-test"),
  generatedTestOutput: document.querySelector("#generated-test-output"),
  metrics: {
    exercises: document.querySelector("#metric-exercises"),
    topics: document.querySelector("#metric-topics"),
    years: document.querySelector("#metric-years"),
    mainTopic: document.querySelector("#metric-main-topic"),
  },
  filters: {
    topic: document.querySelector("#question-filter-topic"),
    year: document.querySelector("#question-filter-year"),
    semester: document.querySelector("#question-filter-semester"),
    assessment: document.querySelector("#question-filter-assessment"),
    status: document.querySelector("#question-filter-status"),
  },
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.subjects) && parsed.subjects.length) {
        const normalized = normalizeState(parsed);
        if (normalized.analyzerVersion !== ANALYZER_VERSION) {
          reanalyzeState(normalized);
        }
        return normalized;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const defaultSubjectId = crypto.randomUUID();

  return {
    analyzerVersion: ANALYZER_VERSION,
    selectedSubjectId: defaultSubjectId,
    subjects: [
      {
        id: defaultSubjectId,
        name: "Sistemas Digitais",
        advice: "",
        customTopics: [],
        exercises: [],
      },
    ],
  };
}

function persist() {
  state.selectedSubjectId = selectedSubjectId;
  state.analyzerVersion = ANALYZER_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (cloudReady) scheduleCloudSync();
}

function getSubject() {
  return state.subjects.find((subject) => subject.id === selectedSubjectId) || state.subjects[0];
}

function normalizeState(nextState) {
  nextState.subjects = nextState.subjects.map((subject) => dedupeSubjectExercises({
    ...subject,
    id: isUuid(subject.id) ? subject.id : crypto.randomUUID(),
    advice: subject.advice || "",
    customTopics: Array.isArray(subject.customTopics) ? subject.customTopics : [],
    exercises: Array.isArray(subject.exercises)
      ? subject.exercises.map((exercise) => ({
          ...exercise,
          id: isUuid(exercise.id) ? exercise.id : crypto.randomUUID(),
          signature: exercise.signature || getExerciseSignature(exercise.text || ""),
          sourceType: exercise.sourceType || exercise.source_type || "Manual",
          solution: exercise.solution || "",
          images: Array.isArray(exercise.images) ? exercise.images : [],
          confidence: exercise.confidence || estimateSegmentationConfidence(exercise.text || "", exercise),
          analysisNotes: exercise.analysisNotes || exercise.analysis_notes || "",
          questionNumber: exercise.questionNumber || exercise.question_number || null,
          answerStructure: exercise.answerStructure || exercise.answer_structure || "",
          notes: exercise.notes || "",
        }))
      : [],
  }));
  return nextState;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function reanalyzeState(nextState) {
  for (const subject of nextState.subjects) {
    subject.customTopics = [];
    subject.exercises = subject.exercises.map((exercise) => {
      const analysis = classifyExercise(exercise.text, subject);
      return { ...exercise, signature: getExerciseSignature(exercise.text), ...analysis };
    });
    subject.exercises = dedupeSubjectExercises(subject).exercises;
  }
  nextState.analyzerVersion = ANALYZER_VERSION;
}

function dedupeSubjectExercises(subject) {
  const seen = new Set();
  subject.exercises = subject.exercises.filter((exercise) => {
    const signature = exercise.signature || getExerciseSignature(exercise.text || "");
    if (!signature || seen.has(signature)) return false;
    seen.add(signature);
    exercise.signature = signature;
    return true;
  });
  return subject;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getTopicSet(subject) {
  return [...(TOPIC_LIBRARY[subject.name] || []), ...(subject.customTopics || []), ...GENERIC_TOPICS]
    .map(normalizeTopicProfile);
}

function splitExercises(rawText) {
  const preparedText = rawText
    .replace(/\r/g, "")
    .replace(/\s+(\d{1,2})\s*[.)]\s+(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, "\n\n$1. ")
    .replace(/\s+((?:exercicio|exercício|questao|questão)\s*\d+[:.)-])/gi, "\n\n$1");

  return preparedText
    .split(/\n\s*\n|(?=\n?\s*(?:exercicio|exercício|questao|questão)\s*\d+[:.)-])|(?=\n\s*\d+\s*[.)]\s+)/i)
    .map((item) => item.replace(/^\s*\d+\s*[.)]\s*/, "").trim())
    .filter((item) => item.length > 18);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function preprocessText(value) {
  const normalized = normalizeText(value || "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rawTokens = normalized.match(/[a-z0-9-]{3,}/g) || [];
  const tokens = rawTokens
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token) && !GENERIC_NOISE.has(token) && !/^\d+$/.test(token));
  const actionTokens = tokens.filter((token) => ACTION_VERBS.has(token));
  const contentTokens = tokens.filter((token) => !ACTION_VERBS.has(token));
  return { normalized, tokens, actionTokens, contentTokens };
}

function normalizeToken(token) {
  let next = String(token || "").toLowerCase().replace(/^-+|-+$/g, "");
  next = next
    .replace(/(coes|cao)$/g, "cao")
    .replace(/(mente)$/g, "")
    .replace(/(acoes|acoes)$/g, "acao")
    .replace(/(oes)$/g, "ao")
    .replace(/(s)$/g, "");
  next = next
    .replace(/(ando|endo|indo)$/g, "")
    .replace(/(ados|adas|idos|idas)$/g, "")
    .replace(/(ar|er|ir)$/g, "");
  return next.trim();
}

function extractNgrams(tokens, min = 1, max = 3) {
  const grams = new Map();
  for (let size = min; size <= max; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const gram = tokens.slice(index, index + size).join(" ");
      if (!gram || gram.length < 3) continue;
      grams.set(gram, (grams.get(gram) || 0) + 1);
    }
  }
  return grams;
}

function normalizeTopicProfile(topic) {
  const strongKeywords = topic.strongKeywords || topic.keywordsStrong || topic.keywords || [];
  const mediumKeywords = topic.mediumKeywords || topic.keywordsMedium || [];
  const synonyms = topic.synonyms || [];
  const verbs = topic.verbs || topic.commonVerbs || [];
  const subtopics = topic.subtopics || [];
  return {
    ...topic,
    strongKeywords: uniqueNormalizedTerms(strongKeywords),
    mediumKeywords: uniqueNormalizedTerms(mediumKeywords),
    synonyms: uniqueNormalizedTerms(synonyms),
    verbs: uniqueNormalizedTerms(verbs),
    subtopics: uniqueNormalizedTerms(subtopics),
  };
}

function uniqueNormalizedTerms(list) {
  return [...new Set((list || []).map((item) => normalizeText(item).trim()).filter(Boolean))];
}

function splitExamQuestions(rawText) {
  const preparedText = prepareExerciseText(rawText);
  const markers = findQuestionMarkers(preparedText);

  if (markers.length) {
    const markedQuestions = markers
      .map((marker, index) => preparedText.slice(marker.index, markers[index + 1]?.index || preparedText.length))
      .map(cleanQuestionCandidate)
      .filter(isLikelyExercise);
    if (markedQuestions.length) return markedQuestions;
  }

  return preparedText
    .split(/\n\s*\n\s*\n+|\n\s*[-_=]{4,}\s*\n|\n\s*\*{4,}\s*\n/)
    .map(cleanQuestionCandidate)
    .filter(isLikelyExercise);
}

function prepareExerciseText(rawText) {
  return rawText
    .replace(/\r/g, "")
    .replace(/[\u00a0\f]+/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+(\d{1,2}(?:[.,]\d{1,2}){0,3}\s*[.)]\s+(?=[A-Za-z0-9]))/g, "\n\n$1")
    .replace(/\s+(\d{1,2}(?:[.,]\d{1,2}){0,3}\s*-\s+(?=[A-Za-z0-9]))/g, "\n\n$1")
    .replace(/(^|\s+)(\d{1,2}(?:[.,]\d{1,2}){0,3})\s*\?\s+(?=[A-Za-z0-9])/g, "$1\n\n$2- ")
    .replace(/\s+(\d+\s*[.,]?\s*[a-z]\s*[\).:-]\s+)/gi, "\n\n$1")
    .replace(/\s+(pergunta\s*\d+(?:[.,]\d+)*(?:\s*[a-z])?\s*[:.)-])/gi, "\n\n$1 ")
    .replace(/\s+((?:quest(?:ao|ão)|exerc(?:icio|ício))\s*\d+(?:[.,]\d+)*(?:\s*[a-z])?\s*[:.)-])/gi, "\n\n$1 ")
    .replace(/\s+(\d+(?:[.,]\d+){1,3}\s*[:.)-]\s+)/g, "\n\n$1")
    .replace(/\s+(\d+\s*[a-z]\s*[:.)-]\s+)/gi, "\n\n$1")
    .replace(/\s+([a-z]\s*[\).:-]\s+(?=(?:calcule|determine|desenhe|projete|implemente|explique|indique|justifique|represente|construa|considere|apresente|descreva|identifique|complete|mostre|converta|codifique|liste|enumere|assinale|responda)\b))/gi, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findQuestionMarkers(text) {
  const markerPattern = /(?:^|\n)\s*((?:quest(?:ao|ão)|exerc(?:icio|ício))\s*\d+(?:[.,]\d+)*(?:\s*[a-z])?|(?:\d+(?:[.,]\d+){0,3})(?:\s*[a-z])?|[a-z])\s*[:.)-]\s+/gi;
  const markers = [];
  let match = markerPattern.exec(text);

  while (match) {
    const index = match.index + match[0].indexOf(match[1]);
    const lookahead = text.slice(index, index + 360);
    if (hasQuestionSignal(lookahead) && !looksLikeDocumentHeaderMarker(lookahead)) {
      markers.push({ index, label: match[1] });
    }
    match = markerPattern.exec(text);
  }

  return markers;
}

function cleanQuestionCandidate(value) {
  const cleaned = value
    .replace(/^\s*pergunta\s*/i, "")
    .replace(/^\s*(?:quest(?:ao|ão)|exerc(?:icio|ício))\s*/i, "")
    .replace(/^\s*\d+(?:[.,]\d+)*\s*[a-z]?\s*[:.)\-\u2013\u2014?]\s*/i, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return stripBoilerplatePrefix(cleaned);
}

function hasQuestionSignal(text) {
  const normalized = normalizeText(text);
  return /(calcule|determine|desenhe|projete|implemente|explique|indique|justifique|represente|construa|considere|dimensione|simplifique|obtenha|apresente|complete|preencha|analise|deduza|mostre|descreva|identifique|converta|codifique|liste|enumere|assinale|responda|avalie|classifique|derive|prove|trace|esboce|compare|discuta)/.test(normalized) || /[A-Za-z]\?/.test(text);
}

function looksLikeDocumentHeaderMarker(text) {
  const normalized = normalizeText(text);
  const signalIndex = normalized.search(/(calcule|determine|desenhe|projete|implemente|explique|indique|justifique|represente|construa|considere|dimensione|simplifique|obtenha|apresente|complete|preencha|analise|deduza|mostre|\?)/);
  if (signalIndex < 0 || signalIndex > 240) return false;

  const prefix = normalized.slice(0, signalIndex);
  const headerHits = [
    "escola",
    "instituto",
    "curso",
    "unidade curricular",
    "ano lectivo",
    "ano letivo",
    "enunciado de avaliacao",
    "modelo",
    "pagina",
    "data",
    "duracao",
    "cotacao",
    "formulario",
  ].filter((word) => prefix.includes(word)).length;

  return headerHits >= 2;
}

function stripBoilerplatePrefix(text) {
  const normalized = normalizeText(text);
  const headerHits = [
    "formulario",
    "cotacao",
    "duracao",
    "enunciado de avaliacao",
    "modelo",
    "pagina",
    "curso",
    "unidade curricular",
  ].filter((word) => normalized.slice(0, 260).includes(word)).length;

  if (headerHits < 2) return text;

  const signal = text.search(/\b(Calcule|calcule|Determine|determine|Desenhe|desenhe|Projete|projete|Implemente|implemente|Explique|explique|Indique|indique|Justifique|justifique|Represente|represente|Construa|construa|Considere|considere|Simplifique|simplifique|Obtenha|obtenha|Analise|analise)\b/);
  if (signal > 20 && signal < 420) {
    return text.slice(signal).trim();
  }

  return text;
}

function isLikelyExercise(text) {
  const normalized = normalizeText(text);
  if (text.length < 25) return false;
  if (!hasQuestionSignal(text)) return false;
  if (isBoilerplateText(normalized)) return false;
  return true;
}

function isBoilerplateText(normalized) {
  const boilerplateHits = [
    "formulario",
    "formula",
    "cotacao",
    "duracao",
    "enunciado de avaliacao",
    "modelo",
    "pagina",
    "classificacao",
    "instrucoes",
    "consulta",
  ].filter((word) => normalized.includes(word)).length;

  return boilerplateHits >= 2 && !hasQuestionSignal(normalized);
}

function classifyExercise(text, subject, options = {}) {
  const processed = preprocessText(text);
  const forcedTopic = normalizeManualTopicName(options.manualTopic || "");
  const ngrams = extractNgrams(processed.contentTokens, 1, 3);
  const scored = getTopicSet(subject)
    .map((topic) => {
      const result = scoreTopic(topic, processed, ngrams);
      return {
        name: topic.name,
        score: result.score,
        matches: result.matches,
        similarity: result.similarity,
      };
    })
    .filter((topic) => topic.score >= 2.8 || topic.matches >= 2 || topic.similarity >= 0.5)
    .sort((a, b) => b.score - a.score);

  const customAndKnown = scored.filter((topic) => !GENERIC_TOPICS.some((generic) => generic.name === topic.name));
  const topics = forcedTopic
    ? [ensureManualTopic(subject, forcedTopic)]
    : customAndKnown.slice(0, 2).map((topic) => topic.name);

  return {
    topics: topics.length ? topics : ["Tema por definir"],
    difficulty: estimateDifficulty(processed.normalized, text.length),
    type: estimateType(processed.normalized, processed.actionTokens),
    keywords: forcedTopic ? [] : extractKeywords(text).slice(0, 10),
  };
}

function scoreTopic(topic, processed, ngrams) {
  let score = 0;
  let matches = 0;
  let fuzzyMatches = 0;
  let semanticHits = 0;

  for (const keyword of topic.strongKeywords || []) {
    if (termMatch(keyword, processed, ngrams, 2.4)) {
      matches += 1;
      score += 2.4;
    }
  }

  for (const keyword of topic.mediumKeywords || []) {
    if (termMatch(keyword, processed, ngrams, 1.5)) {
      matches += 1;
      score += 1.5;
    }
  }

  for (const synonym of topic.synonyms || []) {
    if (termMatch(synonym, processed, ngrams, 1.3, true)) {
      fuzzyMatches += 1;
      score += 1.2;
    }
  }

  for (const subtopic of topic.subtopics || []) {
    if (termMatch(subtopic, processed, ngrams, 1.4, true)) {
      semanticHits += 1;
      score += 1.05;
    }
  }

  for (const verb of topic.verbs || []) {
    if (processed.actionTokens.includes(normalizeToken(verb))) {
      score += 0.55;
    }
  }

  const profileTerms = new Set([
    ...(topic.strongKeywords || []),
    ...(topic.mediumKeywords || []),
    ...(topic.synonyms || []),
    ...(topic.subtopics || []),
  ]);
  const similarity = computeThemeSimilarity(profileTerms, ngrams);
  score += similarity * 1.6;

  return { score, matches: matches + fuzzyMatches + semanticHits, similarity };
}

function termMatch(term, processed, ngrams, minSimilarity = 1.3, allowApprox = false) {
  const normalizedTerm = normalizeText(term).trim();
  if (!normalizedTerm) return false;
  if (ngrams.has(normalizedTerm)) return true;
  const parts = normalizedTerm.split(/\s+/).map(normalizeToken).filter(Boolean);
  if (!parts.length) return false;
  const joined = parts.join(" ");
  if (ngrams.has(joined)) return true;
  if (!allowApprox) return false;

  for (const gram of ngrams.keys()) {
    if (approximateTextSimilarity(gram, joined) >= minSimilarity / 2.4) {
      return true;
    }
  }
  return false;
}

function keywordMatches(normalizedText, keyword) {
  const processed = preprocessText(normalizedText);
  const grams = extractNgrams(processed.tokens, 1, 3);
  return termMatch(keyword, processed, grams, 1.3, true);
}

function computeThemeSimilarity(themeTerms, ngrams) {
  const terms = [...themeTerms].map((term) => normalizeText(term).trim()).filter(Boolean);
  if (!terms.length) return 0;
  let hits = 0;
  for (const term of terms) {
    if (ngrams.has(term)) {
      hits += 1;
      continue;
    }
    for (const gram of ngrams.keys()) {
      if (approximateTextSimilarity(gram, term) >= 0.72) {
        hits += 0.75;
        break;
      }
    }
  }
  return Math.min(1, hits / Math.max(2, terms.length));
}

function approximateTextSimilarity(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.82;
  const aSet = new Set(a.split(" "));
  const bSet = new Set(b.split(" "));
  const union = new Set([...aSet, ...bSet]);
  const inter = [...aSet].filter((token) => bSet.has(token)).length;
  return inter / Math.max(1, union.size);
}

function ensureCustomTopic(subject, text) {
  const inferred = inferTopicName(text);
  if (!inferred) return null;

  const normalizedName = normalizeText(inferred);
  const allTopics = getTopicSet(subject);
  const existing = allTopics.find((topic) => normalizeText(topic.name) === normalizedName);
  if (existing) return existing.name;

  const processed = preprocessText(text);
  const ngrams = extractNgrams(processed.contentTokens, 1, 3);
  const closeTopic = allTopics
    .map((topic) => ({ topic, sim: scoreTopic(topic, processed, ngrams).similarity }))
    .sort((a, b) => b.sim - a.sim)[0];
  if (closeTopic?.sim >= 0.64) return closeTopic.topic.name;

  const keywords = extractKeywords(text).slice(0, 8);
  if (!keywords.length) return null;

  subject.customTopics = subject.customTopics || [];
  subject.customTopics.push({
    name: inferred,
    strongKeywords: keywords.slice(0, 4),
    mediumKeywords: keywords.slice(4),
    keywords,
    synonyms: [],
    verbs: extractActionVerbs(text).slice(0, 5),
    subtopics: keywords.slice(0, 3),
    occurrenceHistory: [],
    years: [],
    sourceTypes: [],
    custom: true,
  });

  return inferred;
}

function normalizeManualTopicName(value) {
  const cleaned = String(value || "")
    .replace(/^materia\s*:\s*/i, "")
    .replace(/[.;:,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return titleCase(cleaned).replace(/\bRam\b/g, "RAM").replace(/\bRom\b/g, "ROM");
}

function ensureManualTopic(subject, topicName) {
  const normalizedName = normalizeText(topicName);
  const existing = getTopicSet(subject).find((topic) => normalizeText(topic.name) === normalizedName);
  if (existing) return existing.name;

  subject.customTopics = subject.customTopics || [];
  subject.customTopics.push({
    name: topicName,
    strongKeywords: [],
    mediumKeywords: [],
    keywords: [],
    synonyms: [],
    verbs: [],
    subtopics: [],
    occurrenceHistory: [],
    years: [],
    sourceTypes: [],
    custom: true,
  });
  return topicName;
}

function registerTopicOccurrences(subject, topicNames, context) {
  subject.customTopics = subject.customTopics || [];
  const year = Number(context?.year) || null;
  const sourceType = String(context?.sourceType || "Documento");
  const assessment = String(context?.assessment || "");

  for (const topicName of topicNames || []) {
    const customTopic = subject.customTopics.find((topic) => normalizeText(topic.name) === normalizeText(topicName));
    if (!customTopic) continue;
    customTopic.occurrenceHistory = Array.isArray(customTopic.occurrenceHistory) ? customTopic.occurrenceHistory : [];
    customTopic.years = Array.isArray(customTopic.years) ? customTopic.years : [];
    customTopic.sourceTypes = Array.isArray(customTopic.sourceTypes) ? customTopic.sourceTypes : [];

    customTopic.occurrenceHistory.push({
      year,
      sourceType,
      assessment,
      at: new Date().toISOString(),
    });
    if (year && !customTopic.years.includes(year)) customTopic.years.push(year);
    if (sourceType && !customTopic.sourceTypes.includes(sourceType)) customTopic.sourceTypes.push(sourceType);
  }
}

function inferTopicName(text) {
  const explicit = text.match(/(?:tema|materia|mat[eé]ria|capitulo|cap[ií]tulo|unidade)\s*[:\-]\s*([A-Za-z0-9 \-/]{3,55})/i);
  if (explicit) return titleCase(explicit[1].trim().replace(/[.;:,]+$/, ""));

  const keywords = extractKeywords(text);
  if (!keywords.length) return null;
  return `Materia: ${titleCase(keywords.slice(0, 2).join(" "))}`;
}

function extractKeywords(text) {
  const processed = preprocessText(text);
  const grams = extractNgrams(processed.contentTokens, 1, 3);
  const ranked = [...grams.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token);
  const preferred = ranked.filter((token) => token.includes(" "));
  const singles = ranked.filter((token) => !token.includes(" "));
  return [...preferred, ...singles]
    .slice(0, 12);
}

function extractActionVerbs(text) {
  const processed = preprocessText(text);
  return [...new Set(processed.actionTokens)];
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function estimateDifficulty(normalized, length) {
  let score = length > 520 ? 2 : length > 280 ? 1 : 0;
  if (/(demonstre|projete|implemente|justifique|otimiz|diagrama|tabela de estados)/.test(normalized)) score += 1;
  if (/(apenas|sem usar|minimo|minima|complexidade|prova)/.test(normalized)) score += 1;
  if (score >= 3) return "Alta";
  if (score >= 1) return "Media";
  return "Baixa";
}

function estimateType(normalized, actionTokens = []) {
  const actions = new Set(actionTokens);
  if (/(diagrama|imagem|grafico|esquema)/.test(normalized) || actions.has("interprete")) return "Interpretacao de imagem/diagrama";
  if (actions.has("compare")) return "Comparacao";
  if (actions.has("defina")) return "Definicao";
  if (/(projete|desenhe|implemente|construa)/.test(normalized)) return "Projeto";
  if (/(calcule|determine|obtenha|resolva|derive)/.test(normalized)) return "Calculo";
  if (/(explique|justifique|analise|discuta)/.test(normalized)) return "Explicacao";
  return "Pergunta";
}

function parseYearStart(academicYear) {
  const match = String(academicYear || "").match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function inferAcademicYear(text, fileName = "") {
  const source = normalizeText(`${fileName}\n${String(text).slice(0, 2200)}`);
  const explicit = source.match(/(?:ano\s+lectivo|ano\s+letivo|ano\s+let)\D*(\d{2,4})\s*[/\\-]\s*(\d{2,4})/);
  if (explicit) {
    const start = normalizeYear(explicit[1]);
    const end = normalizeYear(explicit[2], start);
    if (start && end) return `${start}/${end}`;
  }

  const dateMatch = source.match(/\b(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(20\d{2})\b/);
  if (dateMatch) {
    const month = Number(dateMatch[2]);
    const year = Number(dateMatch[3]);
    const start = month >= 9 ? year : year - 1;
    return `${start}/${start + 1}`;
  }

  const fileYear = source.match(/\b(20\d{2})\b/);
  if (fileYear) {
    const year = Number(fileYear[1]);
    return `${year}/${year + 1}`;
  }

  return "";
}

function normalizeYear(value, startYear = null) {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (year >= 1000) return year;
  const century = startYear ? Math.floor(startYear / 100) * 100 : 2000;
  return century + year;
}

function detectDocumentType(text, fileName = "") {
  const header = normalizeText(`${fileName}\n${String(text).slice(0, 1800)}`);
  const hits = (words) => words.filter((word) => header.includes(word)).length;

  const examHits = hits([
    "enunciado de avaliacao",
    "frequencia",
    "freq",
    "exame",
    "teste",
    "recurso",
    "duracao",
    "cotacao",
    "classificacao",
    "modelo p",
    "ano lectivo",
    "ano letivo",
  ]);
  const workbookHits = hits([
    "caderno de exercicios",
    "ficha de exercicios",
    "lista de exercicios",
    "problemas propostos",
    "exercicios resolvidos",
    "folha de exercicios",
  ]);
  const notesHits = hits([
    "apontamentos",
    "sebenta",
    "resumo",
    "slides",
    "capitulo",
    "teoria",
  ]);

  if (examHits >= 2 || /\b(exame|frequencia|freq|teste|recurso)\b/.test(header)) {
    return {
      sourceType: "Teste/Exame",
      assessment: inferAssessmentFromHeader(header),
    };
  }

  if (workbookHits >= 1) {
    return { sourceType: "Caderno de exercicios", assessment: "" };
  }

  if (notesHits >= 1) {
    return { sourceType: "Apontamentos/Teoria", assessment: "" };
  }

  return { sourceType: "Documento", assessment: "" };
}

function inferAssessmentFromHeader(header) {
  if (header.includes("recurso")) return "Recurso";
  if (header.includes("2") && (header.includes("frequencia") || /\bfreq/.test(header))) return "Frequencia 2";
  if (header.includes("frequencia") || /\bfreq/.test(header)) return "Frequencia 1";
  if (header.includes("teste")) return "Teste";
  if (header.includes("exame")) return "Exame";
  return "";
}

function addExercisesFromForm(formData) {
  const subject = getSubject();
  const pieces = Array.isArray(formData.preparedQuestions) && formData.preparedQuestions.length
    ? formData.preparedQuestions
    : splitExamQuestions(formData.exerciseText).map((text) => ({ text, images: [] }));
  const now = new Date().toISOString();
  const sourceName = formData.sourceName || getManualSourceName(now);
  const existingSignatures = new Set(subject.exercises.map((exercise) => getExerciseSignature(exercise.text)));

  const newExercises = [];
  let skippedDuplicates = 0;

  for (const piece of pieces) {
    const text = cleanQuestionCandidate(piece.text || "");
    const signature = getExerciseSignature(text);
    if (!signature || existingSignatures.has(signature)) {
      skippedDuplicates += 1;
      continue;
    }

    existingSignatures.add(signature);
    const confidence = piece.confidence || estimateSegmentationConfidence(text, piece);
    const manualTopic = normalizeManualTopicName(piece.manualTopic || formData.manualTopic || "");
    const analysis = classifyExercise(text, subject, { manualTopic });
    registerTopicOccurrences(subject, analysis.topics, {
      year: parseYearStart(formData.academicYear),
      sourceType: formData.sourceType || "Manual",
      assessment: formData.assessment || "",
    });
    newExercises.push({
      id: crypto.randomUUID(),
      text,
      signature,
      academicYear: formData.academicYear,
      yearStart: parseYearStart(formData.academicYear),
      semester: formData.semester,
      month: formData.month,
      assessment: formData.assessment,
      sourceType: formData.sourceType || "Manual",
      sourceName,
      solution: "",
      images: Array.isArray(piece.images) ? piece.images.slice(0, 4) : [],
      confidence,
      analysisNotes: piece.analysisNotes || buildSegmentationNote(text, confidence),
      questionNumber: piece.questionNumber || newExercises.length + 1,
      createdAt: now,
      ...analysis,
    });
  }

  subject.exercises.unshift(...newExercises);
  persist();
  newExercises.skippedDuplicates = skippedDuplicates;
  return newExercises;
}

function getManualSourceName(dateValue) {
  return "Perguntas coladas";
}

function estimateSegmentationConfidence(text, piece = {}) {
  const cleaned = cleanExerciseText(text);
  const markers = findQuestionMarkers(prepareExerciseText(cleaned)).length;
  const hasAction = preprocessText(cleaned).actionTokens.length > 0;
  const hasImage = Array.isArray(piece.images) && piece.images.length > 0;
  const length = cleaned.length;

  if (piece.confidence) return piece.confidence;
  if (markers > 1 || length > 1300 || length < 35) return "Baixa";
  if (!hasAction && !hasImage) return "Media";
  if (length > 850) return "Media";
  return "Alta";
}

function buildSegmentationNote(text, confidence) {
  if (confidence === "Baixa") {
    return "Separacao duvidosa: confirma se esta pergunta nao juntou partes de outra pergunta ou do formulario.";
  }
  if (confidence === "Media") {
    return "Separacao provavel, mas vale a pena rever o enunciado antes de estudar.";
  }
  return "Separacao com boa confianca pelas regras atuais.";
}

function buildAnswerStructureSuggestion(analysis, text) {
  const type = analysis?.type || estimateType(normalizeText(text));
  if (/projeto/i.test(type)) return "1. Identificar requisitos. 2. Desenhar/esquematizar. 3. Justificar escolhas. 4. Validar resultado.";
  if (/calculo/i.test(type)) return "1. Escrever dados. 2. Apresentar formula/metodo. 3. Resolver passo a passo. 4. Verificar unidades/resultado.";
  if (/explicacao|definicao|teoria/i.test(type)) return "1. Definir conceito. 2. Explicar funcionamento. 3. Dar exemplo. 4. Concluir com criterio pedido.";
  if (/interpretacao/i.test(type)) return "1. Ler o diagrama. 2. Nomear sinais/elementos. 3. Relacionar com a pergunta. 4. Justificar conclusao.";
  return "1. Ler o enunciado. 2. Identificar o tema. 3. Resolver com passos visiveis. 4. Rever a resposta final.";
}

function getExerciseSignature(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(enunciado|avaliacao|modelo|pagina|curso|engenharia|informatica|ano|letivo|unidade|curricular)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

async function importDocumentFiles() {
  const files = [...(els.documentFiles.files || [])];
  if (!files.length) {
    showImportMessage("Escolhe primeiro um PDF, Word, TXT ou imagem na caixa de documentos.");
    return;
  }

  const metadata = getExerciseMetadataFromForm();
  const shouldInferAcademicYear = !metadata.academicYear.trim();

  showImportMessage(`A ler ${files.length} ficheiro${files.length > 1 ? "s" : ""}...`);

  try {
    let totalExercises = 0;
    let totalSkipped = 0;
    const topicNames = new Set();
    const sourceTypes = new Set();
    const failedFiles = [];

    for (const file of files) {
      try {
        const payload = await extractDocumentPayload(file);
        const text = payload.text || "";
        const documentInfo = detectDocumentType(text, file.name);
        const academicYear = shouldInferAcademicYear
          ? inferAcademicYear(text, file.name) || ""
          : metadata.academicYear;
        const added = addExercisesFromForm({
          ...metadata,
          academicYear,
          assessment: documentInfo.assessment || metadata.assessment,
          sourceType: documentInfo.sourceType,
          exerciseText: text,
          preparedQuestions: payload.questions || null,
          sourceName: file.name,
        });
        totalExercises += added.length;
        totalSkipped += added.skippedDuplicates || 0;
        sourceTypes.add(documentInfo.sourceType);
        added.flatMap((exercise) => exercise.topics).forEach((topic) => topicNames.add(topic));
      } catch (error) {
        failedFiles.push(`${file.name} (${error.message})`);
      }
    }

    els.documentFiles.value = "";
    render();
    activateTab(totalExercises ? "documents" : "import");

    if (!totalExercises) {
      showImportMessage(failedFiles.length
        ? `Nao consegui extrair perguntas reais de: ${failedFiles.join(", ")}.`
        : totalSkipped
          ? `Documento ja importado. Ignorei ${totalSkipped} perguntas duplicadas.`
          : "Nao encontrei perguntas claras no documento.");
      return;
    }

    const failedNote = failedFiles.length ? ` Nao lidos: ${failedFiles.join(", ")}.` : "";
    const duplicateNote = totalSkipped ? ` Ignorei ${totalSkipped} duplicados.` : "";
    const sourceNote = sourceTypes.size ? ` Tipo detetado: ${[...sourceTypes].join(", ")}.` : "";
    const lowConfidence = getSubject().exercises.filter((exercise) => exercise.confidence === "Baixa").length;
    showImportMessage(`${totalExercises} perguntas reais importadas.${sourceNote} Temas identificados: ${[...topicNames].join(", ")}. Perguntas para rever: ${lowConfidence}.${duplicateNote}${failedNote}`);
  } catch (error) {
    showImportMessage(`Nao consegui importar automaticamente: ${error.message}`);
  }
}

function getExerciseMetadataFromForm() {
  const formData = Object.fromEntries(new FormData(els.exerciseForm).entries());
  return {
    academicYear: formData.academicYear || "",
    semester: formData.semester || "1",
    month: formData.month || "Janeiro",
    assessment: formData.assessment || "Frequencia 1",
    manualTopic: formData.manualTopic || "",
  };
}

function showImportMessage(message) {
  els.analysisPreview.textContent = message;
  els.documentFileStatus.textContent = message;
}

function showManualMessage(message) {
  els.manualSelectionStatus.textContent = message;
  els.analysisPreview.textContent = message;
}

async function openManualSelection() {
  const files = [...(els.documentFiles.files || [])];
  const file = files[0];
  if (!file) {
    showManualMessage("Escolhe primeiro um PDF ou imagem para selecionar perguntas manualmente.");
    return;
  }

  const isSupported = file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!isSupported) {
    showManualMessage("A selecao manual funciona com PDF ou imagem. Para TXT/Word usa a importacao automatica ou cola as perguntas.");
    return;
  }

  els.manualSelectionPanel.hidden = false;
  showManualMessage("A preparar paginas para selecao manual...");

  try {
    manualSelection.fileName = file.name;
    manualSelection.mode = "question";
    manualSelection.selections = [];
    manualSelection.pages = await renderManualPages(file);
    renderManualSelectionViewer();
    setManualMode("question");
    showManualMessage("Arrasta uma caixa sobre cada pergunta. As perguntas ficam numeradas pela ordem em que as selecionas.");
  } catch (error) {
    showManualMessage(`Nao consegui abrir selecao manual: ${error.message}`);
  }
}

async function renderManualPages(file) {
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) {
    return [{ index: 0, src: await fileToDataUrl(file) }];
  }

  if (!window.pdfjsLib) throw new Error("leitor PDF nao carregou");
  const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.55 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push({ index: pageNumber - 1, src: canvas.toDataURL("image/png") });
  }
  return pages;
}

function renderManualSelectionViewer() {
  els.manualPageViewer.innerHTML = "";
  for (const page of manualSelection.pages) {
    const pageEl = document.createElement("div");
    pageEl.className = "manual-page";
    pageEl.dataset.pageIndex = page.index;
    pageEl.innerHTML = `
      <img src="${escapeHtml(page.src)}" alt="Pagina ${page.index + 1}">
      <div class="manual-overlay"></div>
    `;
    els.manualPageViewer.append(pageEl);
  }
  renderManualSelections();
}

function renderManualSelections() {
  els.manualPageViewer.querySelectorAll(".manual-overlay").forEach((overlay) => {
    overlay.innerHTML = "";
  });

  for (const selection of manualSelection.selections) {
    const pageEl = els.manualPageViewer.querySelector(`[data-page-index="${selection.pageIndex}"]`);
    const overlay = pageEl?.querySelector(".manual-overlay");
    if (!overlay) continue;
    const box = document.createElement("div");
    box.className = `manual-box ${selection.type === "annex" ? "annex-box" : "question-box"}`;
    box.style.left = `${selection.rect.x}%`;
    box.style.top = `${selection.rect.y}%`;
    box.style.width = `${selection.rect.width}%`;
    box.style.height = `${selection.rect.height}%`;
    box.innerHTML = `<span>${selection.type === "annex" ? "Anexo geral" : `Pergunta ${selection.questionNumber}`}</span>`;
    overlay.append(box);
  }

  const questionCount = manualSelection.selections.filter((item) => item.type === "question").length;
  const annexCount = manualSelection.selections.filter((item) => item.type === "annex").length;
  els.manualSelectionStatus.textContent = `${questionCount} pergunta${questionCount === 1 ? "" : "s"} selecionada${questionCount === 1 ? "" : "s"}; ${annexCount} anexo${annexCount === 1 ? "" : "s"} geral${annexCount === 1 ? "" : "is"}.`;
}

function setManualMode(mode) {
  manualSelection.mode = mode;
  els.manualQuestionMode.classList.toggle("active-tool", mode === "question");
  els.manualAnnexMode.classList.toggle("active-tool", mode === "annex");
  const message = mode === "question"
    ? "Modo pergunta: a proxima caixa cria a pergunta seguinte."
    : "Modo anexo geral: a proxima caixa fica ligada ao documento inteiro, nao a uma pergunta especifica.";
  els.manualSelectionStatus.textContent = message;
}

function getManualRect(event, pageEl) {
  const bounds = pageEl.getBoundingClientRect();
  const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
  const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
  return { x, y, width: bounds.width, height: bounds.height };
}

function startManualDrag(event) {
  const pageEl = event.target.closest(".manual-page");
  if (!pageEl || event.button !== 0) return;
  event.preventDefault();
  const point = getManualRect(event, pageEl);
  manualSelection.drag = {
    pageEl,
    pageIndex: Number(pageEl.dataset.pageIndex),
    startX: point.x,
    startY: point.y,
    width: point.width,
    height: point.height,
  };
  const preview = document.createElement("div");
  preview.className = "manual-box preview-box";
  pageEl.querySelector(".manual-overlay").append(preview);
  manualSelection.drag.preview = preview;
  updateManualDrag(event);
}

function updateManualDrag(event) {
  if (!manualSelection.drag) return;
  const drag = manualSelection.drag;
  const point = getManualRect(event, drag.pageEl);
  const left = Math.min(drag.startX, point.x);
  const top = Math.min(drag.startY, point.y);
  const width = Math.abs(point.x - drag.startX);
  const height = Math.abs(point.y - drag.startY);
  drag.preview.style.left = `${(left / drag.width) * 100}%`;
  drag.preview.style.top = `${(top / drag.height) * 100}%`;
  drag.preview.style.width = `${(width / drag.width) * 100}%`;
  drag.preview.style.height = `${(height / drag.height) * 100}%`;
}

function finishManualDrag(event) {
  if (!manualSelection.drag) return;
  const drag = manualSelection.drag;
  const point = getManualRect(event, drag.pageEl);
  const left = Math.min(drag.startX, point.x);
  const top = Math.min(drag.startY, point.y);
  const width = Math.abs(point.x - drag.startX);
  const height = Math.abs(point.y - drag.startY);
  drag.preview.remove();
  manualSelection.drag = null;

  if (width < 24 || height < 24) {
    renderManualSelections();
    return;
  }

  const questionCount = manualSelection.selections.filter((item) => item.type === "question").length;
  const questionNumber = manualSelection.mode === "question"
    ? questionCount + 1
    : null;

  manualSelection.selections.push({
    id: crypto.randomUUID(),
    type: manualSelection.mode,
    questionNumber,
    pageIndex: drag.pageIndex,
    rect: {
      x: (left / drag.width) * 100,
      y: (top / drag.height) * 100,
      width: (width / drag.width) * 100,
      height: (height / drag.height) * 100,
    },
  });
  renderManualSelections();
}

function undoManualSelection() {
  manualSelection.selections.pop();
  renderManualSelections();
}

function clearManualSelections() {
  manualSelection.selections = [];
  renderManualSelections();
}

async function saveManualSelections() {
  const questions = manualSelection.selections.filter((item) => item.type === "question");
  if (!questions.length) {
    showManualMessage("Seleciona pelo menos uma pergunta antes de guardar.");
    return;
  }

  const metadata = getExerciseMetadataFromForm();
  if (!metadata.academicYear.trim()) {
    showManualMessage("Preenche a data/ano do teste antes de guardar as perguntas.");
    return;
  }

  els.manualSave.disabled = true;
  els.manualSave.textContent = "A guardar...";
  showManualMessage("A recortar e ler as perguntas selecionadas...");

  try {
    const preparedQuestions = [];
    let ocrFailures = 0;
    const annexes = manualSelection.selections.filter((item) => item.type === "annex");
    const generalAnnexImages = [];

    for (let index = 0; index < annexes.length; index += 1) {
      const annex = annexes[index];
      const annexPage = manualSelection.pages.find((item) => item.index === annex.pageIndex);
      if (!annexPage) continue;
      generalAnnexImages.push({
        src: await cropImageDataUrl(annexPage.src, annex.rect),
        caption: `Anexo geral ${index + 1}`,
      });
    }

    for (const question of questions) {
      const page = manualSelection.pages.find((item) => item.index === question.pageIndex);
      if (!page) continue;
      const questionImage = await cropImageDataUrl(page.src, question.rect);
      let ocrText = "";
      try {
        ocrText = await recognizeSelectionText(questionImage, question.questionNumber);
      } catch {
        ocrFailures += 1;
      }
      preparedQuestions.push({
        text: ocrText || `Pergunta ${question.questionNumber} selecionada manualmente. Revê a imagem associada.`,
        images: [
          { src: questionImage, caption: `Recorte da pergunta ${question.questionNumber}` },
          ...generalAnnexImages,
        ],
        confidence: ocrText ? "Alta" : "Media",
        analysisNotes: ocrText
          ? "Pergunta selecionada manualmente pelo aluno."
          : "OCR nao conseguiu ler texto suficiente; usa a imagem da pergunta como referencia.",
        questionNumber: question.questionNumber,
      });
    }

    if (!preparedQuestions.length) {
      showManualMessage("Nao encontrei caixas de pergunta validas para guardar.");
      return;
    }
    const added = addExercisesFromForm({
      ...metadata,
      sourceType: "Teste/Exame",
      sourceName: manualSelection.fileName || "Selecao manual",
      preparedQuestions,
      exerciseText: preparedQuestions.map((item) => item.text).join("\n\n"),
    });
    const topics = [...new Set(added.flatMap((exercise) => exercise.topics))].join(", ");
    render();
    if (added.length) {
      activateTab("questions");
      const annexNote = generalAnnexImages.length ? ` ${generalAnnexImages.length} anexo${generalAnnexImages.length === 1 ? "" : "s"} geral${generalAnnexImages.length === 1 ? "" : "is"} guardado${generalAnnexImages.length === 1 ? "" : "s"} junto das perguntas.` : "";
      const ocrNote = ocrFailures ? ` OCR falhou em ${ocrFailures} pergunta${ocrFailures === 1 ? "" : "s"}, mas guardei o recorte da imagem.` : "";
      showImportMessage(`${added.length} perguntas selecionadas manualmente.${annexNote} Temas identificados: ${topics || "por definir"}.${ocrNote}`);
    } else {
      showImportMessage("Nenhuma pergunta nova guardada. Pode ser duplicado de algo que ja tinhas importado.");
    }
  } catch (error) {
    showManualMessage(`Nao consegui guardar selecoes: ${error.message}`);
  } finally {
    els.manualSave.disabled = false;
    els.manualSave.textContent = "Guardar perguntas selecionadas";
  }
}

async function recognizeSelectionText(imageDataUrl, questionNumber) {
  if (!window.Tesseract) return "";
  showManualMessage(`A ler texto da pergunta ${questionNumber}...`);
  const result = await window.Tesseract.recognize(imageDataUrl, "por+eng");
  return cleanQuestionCandidate((result.data?.text || "").trim());
}

async function cropImageDataUrl(imageUrl, rect) {
  const image = await loadImage(imageUrl);
  const x = Math.max(0, Math.floor((rect.x / 100) * image.naturalWidth));
  const y = Math.max(0, Math.floor((rect.y / 100) * image.naturalHeight));
  const width = Math.min(image.naturalWidth - x, Math.max(20, Math.floor((rect.width / 100) * image.naturalWidth)));
  const height = Math.min(image.naturalHeight - y, Math.max(20, Math.floor((rect.height / 100) * image.naturalHeight)));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

function scheduleCloudSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToSupabase, 700);
}

async function initSupabaseSync() {
  if (!supabaseClient) {
    els.analysisPreview.textContent = "Supabase nao carregou; a app continua em modo local.";
    return;
  }

  try {
    const cloudState = await loadFromSupabase();
    cloudReady = true;

    if (cloudState.subjects.length) {
      state.subjects = normalizeState(cloudState).subjects;
      selectedSubjectId = cloudState.selectedSubjectId || state.subjects[0].id;
      render();
      els.analysisPreview.textContent = "Dados carregados da Supabase.";
      return;
    }

    await syncToSupabase();
    els.analysisPreview.textContent = "Supabase ligada. As proximas perguntas ficam guardadas online.";
  } catch (error) {
    els.analysisPreview.textContent = `Nao consegui ligar a Supabase: ${error.message}`;
  }
}

async function loadFromSupabase() {
  const { data: subjects, error: subjectError } = await supabaseClient
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  if (subjectError) throw subjectError;

  const { data: exercises, error: exerciseError } = await supabaseClient
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });
  if (exerciseError) throw exerciseError;

  const { data: topics, error: topicError } = await supabaseClient
    .from("topics")
    .select("*")
    .order("created_at", { ascending: true });
  if (topicError) throw topicError;

  return {
    analyzerVersion: ANALYZER_VERSION,
    selectedSubjectId: subjects[0]?.id,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      advice: subject.advice || "",
      customTopics: topics
        .filter((topic) => topic.subject_id === subject.id)
        .map((topic) => ({
          name: topic.name,
          keywords: topic.keywords || [],
          custom: topic.is_custom,
        })),
      exercises: exercises
        .filter((exercise) => exercise.subject_id === subject.id)
        .map((exercise) => ({
          id: exercise.id,
          text: exercise.text,
          academicYear: exercise.academic_year,
          yearStart: exercise.year_start,
          semester: exercise.semester,
          month: exercise.month,
          assessment: exercise.assessment,
          topics: exercise.topic_names || [],
          difficulty: exercise.difficulty,
          type: exercise.exercise_type,
          keywords: exercise.keywords || [],
          signature: getExerciseSignature(exercise.text),
          sourceName: exercise.source_name || "",
          sourceType: exercise.source_type || "Documento",
          solution: exercise.solution || "",
          images: Array.isArray(exercise.images) ? exercise.images : [],
          confidence: exercise.confidence || "Media",
          analysisNotes: exercise.analysis_notes || "",
          questionNumber: exercise.question_number || null,
          answerStructure: exercise.answer_structure || "",
          notes: exercise.notes || "",
          createdAt: exercise.created_at,
        })),
    })),
  };
}

async function syncToSupabase() {
  if (!supabaseClient) return;

  const subjects = state.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    advice: subject.advice || "",
  }));

  const topics = state.subjects.flatMap((subject) =>
    (subject.customTopics || []).map((topic) => ({
      subject_id: subject.id,
      name: topic.name,
      keywords: topic.keywords || [],
      is_custom: Boolean(topic.custom),
    }))
  );

  const exercises = await buildExerciseRowsForSync();

  const { error: subjectError } = await supabaseClient.from("subjects").upsert(subjects);
  if (subjectError) throw subjectError;

  if (topics.length) {
    const { error: topicError } = await supabaseClient.from("topics").upsert(topics, { onConflict: "subject_id,name" });
    if (topicError) throw topicError;
  }

  if (exercises.length) {
    const { error: exerciseError } = await supabaseClient.from("exercises").upsert(exercises);
    if (exerciseError) {
      if (isMissingImagesColumnError(exerciseError) && cloudSupportsExerciseImages) {
        cloudSupportsExerciseImages = false;
        const fallback = await buildExerciseRowsForSync({ includeImages: false });
        const { error: fallbackError } = await supabaseClient.from("exercises").upsert(fallback);
        if (fallbackError) throw fallbackError;
        els.analysisPreview.textContent = "Supabase sem coluna images; sincronizei sem imagens. Atualiza o schema para ativar imagens na cloud.";
      } else if (isMissingExtendedExerciseColumnError(exerciseError)) {
        const fallback = await buildExerciseRowsForSync({ includeExtended: false });
        const { error: fallbackError } = await supabaseClient.from("exercises").upsert(fallback);
        if (fallbackError) throw fallbackError;
        els.analysisPreview.textContent = "Supabase sem metadados novos; sincronizei as perguntas principais. Atualiza o schema para ativar confianca e estrutura de resposta.";
      } else {
        throw exerciseError;
      }
    }
  }
}

async function buildExerciseRowsForSync(options = {}) {
  const includeImages = options.includeImages ?? cloudSupportsExerciseImages;
  const includeExtended = options.includeExtended ?? true;
  return Promise.all(
    state.subjects.flatMap((subject) =>
      subject.exercises.map(async (exercise) => {
        const row = {
          id: exercise.id,
          subject_id: subject.id,
          topic_names: exercise.topics || [],
          text: exercise.text,
          academic_year: exercise.academicYear,
          year_start: exercise.yearStart,
          semester: exercise.semester,
          month: exercise.month,
          assessment: exercise.assessment,
          difficulty: exercise.difficulty,
          exercise_type: exercise.type,
          solution: exercise.solution || "",
          keywords: exercise.keywords || [],
          source_name: exercise.sourceName || "",
          source_type: exercise.sourceType || "Documento",
          created_at: exercise.createdAt,
        };
        if (includeExtended) {
          row.confidence = exercise.confidence || "Media";
          row.analysis_notes = exercise.analysisNotes || "";
          row.question_number = exercise.questionNumber || null;
          row.answer_structure = exercise.answerStructure || "";
          row.notes = exercise.notes || "";
        }
        if (includeImages) {
          row.images = await persistExerciseImages(subject.id, exercise);
        }
        return row;
      })
    )
  );
}

function isMissingImagesColumnError(error) {
  const text = String(error?.message || "").toLowerCase();
  return text.includes("images") && text.includes("column");
}

function isMissingExtendedExerciseColumnError(error) {
  const text = String(error?.message || "").toLowerCase();
  return ["confidence", "analysis_notes", "question_number", "answer_structure", "notes"].some((column) =>
    text.includes(column) && text.includes("column")
  );
}

async function persistExerciseImages(subjectId, exercise) {
  const images = Array.isArray(exercise.images) ? exercise.images : [];
  if (!images.length) return [];

  const stored = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const src = String(image?.src || "");
    if (!src) continue;

    if (!isDataUrl(src)) {
      stored.push({
        src,
        caption: image.caption || "Figura da pergunta",
      });
      continue;
    }

    try {
      const uploaded = await uploadImageDataUrl(subjectId, exercise.id, src, index);
      stored.push({
        src: uploaded,
        caption: image.caption || "Figura da pergunta",
      });
    } catch {
      // Keep local data URL as fallback when upload fails.
      stored.push({
        src,
        caption: image.caption || "Figura da pergunta",
      });
    }
  }

  exercise.images = stored;
  return stored;
}

function isDataUrl(value) {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

async function uploadImageDataUrl(subjectId, exerciseId, dataUrl, index) {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
  const path = `${subjectId}/${exerciseId}/${Date.now()}-${index}.${extension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: blob.type || `image/${extension}`,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("URL publica de imagem indisponivel");
  return data.publicUrl;
}

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(await file.arrayBuffer());
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    if (!window.mammoth) {
      throw new Error("leitor de Word nao carregou");
    }
    return extractDocxText(await file.arrayBuffer());
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(name)) {
    return extractImageText(file);
  }

  throw new Error("Formato nao suportado");
}

async function extractDocumentPayload(file) {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return { text: await file.text(), questions: [] };
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfPayload(await file.arrayBuffer());
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    if (!window.mammoth) throw new Error("leitor de Word nao carregou");
    return { text: await extractDocxText(await file.arrayBuffer()), questions: [] };
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(name)) {
    return extractImagePayload(file);
  }

  throw new Error("Formato nao suportado");
}

async function extractPdfPayload(arrayBuffer) {
  if (window.pdfjsLib) {
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const text = await extractPdfTextWithPdfJs(pdf);
      const questions = await extractPdfQuestionsWithOcr(pdf);
      if (questions.length) {
        const joinedText = text.length > 20 ? text : questions.map((q) => q.text).join("\n\n");
        return { text: joinedText, questions };
      }
      if (text.length > 40) return { text, questions: [] };
      const ocrText = await extractPdfImageTextWithOcr(pdf);
      if (ocrText.length > 40) return { text: ocrText, questions: [] };
    } catch {
      // Fall through.
    }
  }

  const fallbackText = await extractSimplePdfText(arrayBuffer);
  if (fallbackText.trim().length > 40) return { text: fallbackText, questions: [] };
  throw new Error("PDF sem texto selecionavel ou digitalizado por imagem");
}

async function extractPdfText(arrayBuffer) {
  if (window.pdfjsLib) {
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const text = await extractPdfTextWithPdfJs(pdf);
      if (text.length > 40) return text;

      const ocrText = await extractPdfImageTextWithOcr(pdf);
      if (ocrText.length > 40) return ocrText;
    } catch {
      // Fall back to the small offline extractor below.
    }
  }

  const fallbackText = await extractSimplePdfText(arrayBuffer);
  if (fallbackText.trim().length > 40) return fallbackText;

  throw new Error("PDF sem texto selecionavel ou digitalizado por imagem");
}

async function extractPdfTextWithPdfJs(pdf) {
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n\n").trim();
}

async function extractPdfImageTextWithOcr(pdf) {
  if (!window.Tesseract) return "";

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    const imageUrl = canvas.toDataURL("image/png");
    const result = await window.Tesseract.recognize(imageUrl, "por+eng");
    pages.push(result.data.text || "");
  }

  return pages.join("\n\n").trim();
}

async function extractImageText(file) {
  if (!window.Tesseract) {
    throw new Error("OCR de imagens nao carregou");
  }

  showImportMessage(`A ler texto da imagem ${file.name}...`);
  const result = await window.Tesseract.recognize(file, "por+eng");
  const text = (result.data.text || "").trim();

  if (text.length < 20) {
    throw new Error("nao encontrei texto suficiente na imagem");
  }

  return text;
}

async function extractImagePayload(file) {
  if (!window.Tesseract) throw new Error("OCR de imagens nao carregou");
  showImportMessage(`A analisar imagem ${file.name} e associar figuras por pergunta...`);
  const imageUrl = await fileToDataUrl(file);
  const result = await window.Tesseract.recognize(file, "por+eng");
  const questions = await buildQuestionsFromOcrResult(result, imageUrl);
  if (questions.length) {
    return { text: questions.map((q) => q.text).join("\n\n"), questions };
  }
  const text = (result.data?.text || "").trim();
  if (text.length < 20) throw new Error("nao encontrei texto suficiente na imagem");
  return { text, questions: [] };
}

async function extractPdfQuestionsWithOcr(pdf) {
  if (!window.Tesseract) return [];
  const collected = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const imageUrl = canvas.toDataURL("image/png");
    const ocr = await window.Tesseract.recognize(imageUrl, "por+eng");
    const pageQuestions = (await buildQuestionsFromOcrResult(ocr, imageUrl))
      .map((question) => ({ ...question, text: `[Pag. ${pageNumber}] ${question.text}` }));
    collected.push(...pageQuestions);
  }

  return collected.filter((question) => question.text.length > 20);
}

async function buildQuestionsFromOcrResult(result, imageUrl) {
  const lines = (result.data?.lines || [])
    .map((line) => ({
      text: String(line.text || "").trim(),
      y0: line.bbox?.y0 ?? 0,
      y1: line.bbox?.y1 ?? 0,
    }))
    .filter((line) => line.text.length >= 2)
    .sort((a, b) => a.y0 - b.y0);

  if (!lines.length) return [];
  const imageHeight = result.data?.imageSize?.height || null;
  const blocks = splitOcrLinesIntoQuestionBlocks(lines);
  const questions = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const image = await createQuestionImage(imageUrl, block.startY, block.endY, imageHeight);
    const text = cleanQuestionCandidate(block.lines.map((line) => line.text).join("\n"));
    const confidence = block.confidence || estimateSegmentationConfidence(text, { images: image ? [image] : [] });
    questions.push({
      text,
      images: image ? [image] : [],
      confidence,
      analysisNotes: buildSegmentationNote(text, confidence),
      questionNumber: index + 1,
    });
  }
  return questions.filter((question) => isLikelyExercise(question.text));
}

function splitOcrLinesIntoQuestionBlocks(lines) {
  const gaps = [];
  for (let index = 1; index < lines.length; index += 1) {
    gaps.push(Math.max(0, lines[index].y0 - lines[index - 1].y1));
  }
  const medianGap = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
  const largeGap = Math.max(18, medianGap * 2.3);

  const blocks = [];
  let current = [lines[0]];

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const prev = lines[index - 1];
    const gap = Math.max(0, line.y0 - prev.y1);
    const startsNewQuestion = isLineQuestionStart(line.text);
    const bigVisualBreak = gap >= largeGap && current.map((item) => item.text).join(" ").length > 55;

    if (startsNewQuestion || bigVisualBreak) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);

  return blocks.map((group) => {
    const text = group.map((line) => line.text).join(" ");
    const markers = group.filter((line) => isLineQuestionStart(line.text)).length;
    const confidence = markers > 1 || text.length > 1300 ? "Baixa" : text.length > 850 ? "Media" : "Alta";
    return {
      lines: group,
      startY: Math.max(0, Math.min(...group.map((line) => line.y0)) - 10),
      endY: Math.max(...group.map((line) => line.y1)) + 14,
      confidence,
    };
  });
}

function isLineQuestionStart(text) {
  const line = normalizeText(String(text).trim());
  return /^(quest(?:ao|ão)|exerc(?:icio|ício)|pergunta)\s*\d+/.test(line) ||
    /^\d{1,2}(?:[.,]\d+){0,2}\s*[:.)-]/.test(line) ||
    /^\d{1,2}\s+[a-z]\s*[:.)-]/.test(line);
}

async function createQuestionImage(imageUrl, startY, endY, sourceImageHeight) {
  try {
    const image = await loadImage(imageUrl);
    if (!sourceImageHeight) return { src: imageUrl, caption: "Figura da pergunta" };
    const ratio = image.naturalHeight / Math.max(1, sourceImageHeight);
    const y0 = Math.max(0, Math.floor(startY * ratio));
    const y1 = Math.min(image.naturalHeight, Math.max(y0 + 40, Math.floor(endY * ratio)));
    const height = Math.max(40, y1 - y0);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = image.naturalWidth;
    canvas.height = height;
    context.drawImage(image, 0, y0, image.naturalWidth, height, 0, 0, image.naturalWidth, height);
    return { src: canvas.toDataURL("image/png"), caption: "Figura da pergunta" };
  } catch {
    return { src: imageUrl, caption: "Figura da pergunta" };
  }
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("falha ao ler imagem"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("falha ao abrir imagem"));
    image.src = src;
  });
}

async function extractSimplePdfText(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const pdfSource = bytesToBinaryString(bytes);
  const streamPattern = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  const chunks = [];
  let match = streamPattern.exec(pdfSource);

  while (match) {
    const header = match[1];
    if (/\/Subtype\s*\/Image/.test(header)) {
      match = streamPattern.exec(pdfSource);
      continue;
    }

    const streamBytes = binaryStringToBytes(match[2]);
    let decodedBytes = streamBytes;

    if (/FlateDecode/.test(header)) {
      decodedBytes = await inflatePdfStream(streamBytes);
    }

    if (decodedBytes.length) {
      chunks.push(extractPdfStrings(bytesToBinaryString(decodedBytes)));
    }

    match = streamPattern.exec(pdfSource);
  }

  return chunks.join("\n\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function inflatePdfStream(streamBytes) {
  if (!window.DecompressionStream) return new Uint8Array();

  try {
    const stream = new Blob([streamBytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return new Uint8Array();
  }
}

function extractPdfStrings(content) {
  const textParts = [];
  const literalPattern = /\((?:\\.|[^\\()])*\)/g;
  const hexPattern = /<([0-9A-Fa-f\s]{4,})>/g;

  for (const match of content.matchAll(literalPattern)) {
    const decoded = decodePdfLiteral(match[0]);
    if (isUsefulPdfText(decoded)) textParts.push(decoded);
  }

  for (const match of content.matchAll(hexPattern)) {
    const decoded = decodePdfHex(match[1]);
    if (isUsefulPdfText(decoded)) textParts.push(decoded);
  }

  return textParts.join(" ");
}

function isUsefulPdfText(value) {
  const text = value.trim();
  if (text.length <= 1) return false;

  const printable = [...text].filter((char) => {
    const code = char.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127) || code >= 160;
  }).length;
  const letters = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;

  return printable / text.length > 0.86 && letters >= Math.max(2, Math.floor(text.length * 0.18));
}

function decodePdfLiteral(value) {
  const inner = value.slice(1, -1);
  return inner
    .replace(/\\([nrtbf()\\])/g, (_, char) => {
      const escapes = { n: "\n", r: "\r", t: "\t", b: "", f: "", "(": "(", ")": ")", "\\": "\\" };
      return escapes[char] ?? char;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\\r?\n/g, "");
}

function decodePdfHex(value) {
  const clean = value.replace(/\s+/g, "");
  const bytes = [];
  for (let index = 0; index < clean.length - 1; index += 2) {
    bytes.push(parseInt(clean.slice(index, index + 2), 16));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = "";
    for (let index = 2; index < bytes.length - 1; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) + bytes[index + 1]);
    }
    return output;
  }

  return bytesToBinaryString(new Uint8Array(bytes));
}

function bytesToBinaryString(bytes) {
  let output = "";
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    output += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return output;
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 255;
  }
  return bytes;
}

async function extractDocxText(arrayBuffer) {
  if (!window.mammoth) {
    throw new Error("Leitor de Word indisponivel");
  }

  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

function calculatePredictions(subject) {
  const exercises = subject.exercises;
  if (!exercises.length) return [];

  const newestYear = Math.max(...exercises.map((exercise) => exercise.yearStart || 0));
  const oldestYear = Math.min(...exercises.map((exercise) => exercise.yearStart || newestYear));
  const yearWindow = Math.max(1, newestYear - oldestYear + 1);
  const totalWeight = Math.max(1, exercises.reduce((sum, exercise) => sum + getSourceWeight(exercise), 0));
  const byTopic = new Map();

  for (const exercise of exercises) {
    const sourceWeight = getSourceWeight(exercise);
    for (const rawTopic of exercise.topics || []) {
      const topic = normalizeStoredTopic(rawTopic);
      if (!topic) continue;
      if (!byTopic.has(topic)) {
        byTopic.set(topic, {
          topic,
          count: 0,
          weightedCount: 0,
          years: new Set(),
          recentCount: 0,
          lastSeen: 0,
          examples: [],
          assessments: new Set(),
          sourceTypes: new Set(),
          keywords: new Map(),
          types: new Map(),
        });
      }

      const bucket = byTopic.get(topic);
      bucket.count += 1;
      bucket.weightedCount += sourceWeight;
      bucket.years.add(exercise.yearStart);
      bucket.assessments.add(exercise.assessment);
      bucket.sourceTypes.add(exercise.sourceType || "Documento");
      bucket.lastSeen = Math.max(bucket.lastSeen, exercise.yearStart || 0);
      if ((exercise.yearStart || 0) >= newestYear - 1) bucket.recentCount += 1;
      bucket.examples.push(exercise);
      bucket.types.set(exercise.type, (bucket.types.get(exercise.type) || 0) + 1);

      const exerciseKeywords = exercise.keywords?.length ? exercise.keywords : extractKeywords(exercise.text).slice(0, 10);
      for (const keyword of exerciseKeywords) {
        bucket.keywords.set(keyword, (bucket.keywords.get(keyword) || 0) + 1);
      }
    }
  }

  return [...byTopic.values()]
    .map((item) => {
      const frequency = item.weightedCount / totalWeight;
      const consistency = item.years.size / yearWindow;
      const recency = item.lastSeen ? 1 / (1 + Math.max(0, newestYear - item.lastSeen)) : 0;
      const evidence = Math.min(1, item.weightedCount / 4);
      let score = Math.round(18 + evidence * 34 + frequency * 20 + consistency * 16 + recency * 12);
      if (exercises.length < 5) score = Math.min(score, 72);
      if (item.count === 1) score = Math.min(score, 58);
      if (item.years.size === 1) score = Math.min(score, 68);
      const sortedExamples = item.examples.sort((a, b) => (b.yearStart || 0) - (a.yearStart || 0));
      const topKeywords = [...item.keywords.entries()]
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .slice(0, 6)
        .map(([keyword]) => keyword);
      const topType = [...item.types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Exercicio";

      return {
        ...item,
        score,
        frequency: Math.round(frequency * 100),
        consistency: Math.round(consistency * 100),
        absenceYears: Math.max(0, newestYear - (item.lastSeen || newestYear)),
        recentCount: item.recentCount,
        assessments: [...item.assessments],
        sourceTypes: [...item.sourceTypes],
        topKeywords,
        topType,
        likelyExercise: buildLikelyExercise(item.topic, topType, topKeywords, sortedExamples),
        examples: sortedExamples,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildLikelyExercise(topic, type, keywords, examples) {
  const verbs = collectFrequentVerbs(examples);
  const verbText = verbs.length ? verbs.slice(0, 3).join(", ") : "resolver/aplicar";
  const keywordText = keywords.length ? keywords.slice(0, 4).join(", ") : normalizeText(topic).replace(/^materia:\s*/i, "");
  const subtopics = collectFrequentSubtopics(examples);
  const template = pickQuestionTemplate(type, subtopics);
  const base = examples[0]?.text || "";

  return {
    title: `${type} sobre ${topic}`,
    prompt: template
      .replace("{subtema}", subtopics[0] || keywordText)
      .replace("{subtema1}", subtopics[0] || keywordText.split(",")[0] || topic)
      .replace("{subtema2}", subtopics[1] || keywordText.split(",")[1] || topic)
      .replace("{verbos}", verbText),
    evidence: clip(cleanExerciseText(base), 240),
  };
}

function normalizeStoredTopic(topic) {
  const value = String(topic || "").trim();
  if (!value) return "";
  if (/^materia\s*:/i.test(value) && value.split(/\s+/).length > 3) return "Tema por definir";
  if (/^(tema por confirmar|tema por definir)$/i.test(value)) return "Tema por definir";
  return value;
}

function getSourceWeight(exercise) {
  const source = normalizeText(`${exercise.sourceType || ""} ${exercise.assessment || ""}`);
  if (/(teste|exame|frequencia|recurso|avaliacao)/.test(source)) return 1;
  if (/(caderno|ficha|lista|problemas propostos)/.test(source)) return 0.55;
  if (/(apontamentos|teoria|slides|sebenta|resumo)/.test(source)) return 0.25;
  return 0.75;
}

function collectFrequentVerbs(examples) {
  const verbs = new Map();
  const candidates = ["calcule", "determine", "projete", "desenhe", "implemente", "indique", "explique", "justifique", "represente", "construa", "analise"];

  for (const exercise of examples) {
    const normalized = normalizeText(exercise.text);
    for (const verb of candidates) {
      if (keywordMatches(normalized, verb)) {
        verbs.set(verb, (verbs.get(verb) || 0) + 1);
      }
    }
  }

  return [...verbs.entries()].sort((a, b) => b[1] - a[1]).map(([verb]) => verb);
}

function collectFrequentSubtopics(examples) {
  const counts = new Map();
  for (const exercise of examples) {
    const items = extractKeywords(exercise.text).filter((keyword) => keyword.includes(" "));
    for (const item of items.slice(0, 4)) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value).slice(0, 4);
}

function pickQuestionTemplate(type, subtopics) {
  if (/comparacao/i.test(type)) return "Compare {subtema1} e {subtema2}.";
  if (/definicao/i.test(type)) return "Explique o conceito de {subtema}.";
  if (/calculo/i.test(type)) return "Resolva uma pergunta de {subtema}.";
  if (/interpretacao/i.test(type)) return "Interprete o diagrama de {subtema} e justifique o resultado.";
  if (/explicacao|teoria/i.test(type)) return "Indique vantagens e desvantagens de {subtema}.";
  if (subtopics.length >= 2) return "Use {verbos} para resolver uma questao sobre {subtema1} e {subtema2}.";
  return "Resolva uma pergunta de {subtema}.";
}

function render() {
  const subject = getSubject();
  const predictions = calculatePredictions(subject);

  renderSubjects();
  renderMetrics(subject, predictions);
  renderAdvice(subject, predictions);
  renderPreview(predictions);
  renderDocuments(subject);
  renderQuestionFilters(subject);
  renderPredictions(predictions);
  renderExercisesByDocument(subject);
  renderStudyPlan(subject, predictions);
  persist();
}

function renderSubjects() {
  els.subjectList.innerHTML = "";

  for (const subject of state.subjects) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `subject-button${subject.id === selectedSubjectId ? " active" : ""}`;
    button.textContent = `${subject.name} (${subject.exercises.length})`;
    button.addEventListener("click", () => {
      selectedSubjectId = subject.id;
      render();
    });
    els.subjectList.append(button);
  }

  els.subjectTitle.textContent = getSubject().name;
  renderSubjectManager();
}

function renderSubjectManager() {
  els.subjectManagerList.innerHTML = "";

  for (const subject of state.subjects) {
    const row = document.createElement("article");
    row.className = `subject-manager-row${subject.id === selectedSubjectId ? " active" : ""}`;
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(subject.name)}</strong>
        <span>${subject.exercises.length} perguntas guardadas</span>
      </div>
      <button class="secondary-button" type="button" data-open-subject="${subject.id}">Abrir</button>
    `;
    els.subjectManagerList.append(row);
  }
}

function renderMetrics(subject, predictions) {
  const topicCount = new Set(subject.exercises.flatMap((exercise) =>
    (exercise.topics || []).map(normalizeStoredTopic).filter(Boolean)
  )).size;
  const yearCount = new Set(subject.exercises.map((exercise) => exercise.academicYear)).size;

  els.metrics.exercises.textContent = subject.exercises.length;
  els.metrics.topics.textContent = topicCount;
  els.metrics.years.textContent = yearCount;
  els.metrics.mainTopic.textContent = predictions[0]?.topic || "-";
}

function getDocumentGroups(subject) {
  const byDocument = new Map();
  for (const exercise of subject.exercises) {
    const key = getDocumentKey(exercise);
    if (!byDocument.has(key)) byDocument.set(key, []);
    byDocument.get(key).push(exercise);
  }
  return [...byDocument.values()].sort((a, b) => {
    const newestA = Math.max(...a.map((exercise) => exercise.yearStart || 0));
    const newestB = Math.max(...b.map((exercise) => exercise.yearStart || 0));
    return newestB - newestA || getDocumentLabel(a[0]).localeCompare(getDocumentLabel(b[0]));
  });
}

function renderDocuments(subject) {
  if (!els.documentsList) return;
  els.documentsList.innerHTML = "";
  const groups = getDocumentGroups(subject);

  if (!groups.length) {
    els.documentsList.append(emptyState());
    return;
  }

  for (const exercises of groups) {
    const first = exercises[0];
    const topics = [...new Set(exercises.flatMap((exercise) =>
      (exercise.topics || []).map(normalizeStoredTopic).filter(Boolean)
    ))].slice(0, 5);
    const lowConfidence = exercises.filter((exercise) => exercise.confidence === "Baixa").length;
    const card = document.createElement("article");
    card.className = "document-card";
    card.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(getDocumentLabel(first))}</h3>
          <p>${escapeHtml(first.sourceName || "Origem manual")}</p>
        </div>
        <span class="pill">${escapeHtml(first.sourceType || "Documento")}</span>
      </header>
      <div class="document-stats">
        <span><strong>${exercises.length}</strong> perguntas</span>
        <span><strong>${topics.length}</strong> temas</span>
        <span><strong>${lowConfidence}</strong> para rever</span>
      </div>
      <div class="prediction-meta">
        <span class="pill">${escapeHtml(first.academicYear || "Ano por confirmar")}</span>
        <span class="pill">${escapeHtml(first.semester || "-")}. semestre</span>
        <span class="pill">${escapeHtml(first.assessment || "Avaliacao por confirmar")}</span>
        ${topics.map((topic) => `<span class="pill">${escapeHtml(topic)}</span>`).join("")}
      </div>
      <div class="solution-actions">
        <button class="secondary-button" type="button" data-open-document="${escapeHtml(getDocumentKey(first))}">Ver perguntas deste documento</button>
      </div>
    `;
    els.documentsList.append(card);
  }
}

function renderAdvice(subject, predictions) {
  els.subjectAdvice.value = subject.advice || "";
  els.subjectAdvice.placeholder = predictions.length
    ? "Ex: treinar primeiro os temas mais frequentes, rever perguntas reais e escrever resolucoes completas..."
    : "Importa exames antigos para gerar conselhos com base nos temas e perguntas mais frequentes.";
}

function generateSubjectAdvice() {
  const subject = getSubject();
  const predictions = calculatePredictions(subject).slice(0, 4);

  if (!predictions.length) {
    els.subjectAdvice.value = "Ainda nao ha dados suficientes. Importa exames/frequencias anteriores e depois gera conselhos com base nos temas mais repetidos.";
    return;
  }

  const topicLines = predictions.map((prediction, index) => {
    return `${index + 1}. ${prediction.topic}: rever as perguntas reais guardadas e escrever a resolucao completa.`;
  });

  els.subjectAdvice.value = [
    `Para passar ${subject.name}, começa pelos temas que mais aparecem no historico:`,
    ...topicLines,
    "Metodo recomendado: resolver primeiro as perguntas reais guardadas, escrever a resolucao completa, comparar padroes de pergunta e repetir os temas com maior prioridade.",
  ].join("\n");
}

function saveSubjectAdvice() {
  const subject = getSubject();
  subject.advice = els.subjectAdvice.value.trim();
  persist();
  els.analysisPreview.textContent = "Conselhos da disciplina guardados.";
}

function renderPreview(predictions) {
  els.topicPreview.innerHTML = "";
  els.quickPriority.textContent = predictions[0]?.topic || "Sem dados";

  if (!predictions.length) {
    els.topicPreview.append(emptyState());
    return;
  }

  for (const prediction of predictions.slice(0, 4)) {
    const row = document.createElement("div");
    row.className = "topic-chip";
    row.innerHTML = `<strong>${escapeHtml(prediction.topic)}</strong><span>${prediction.score}%</span>`;
    els.topicPreview.append(row);
  }
}

function renderStudyPlan(subject, predictions) {
  if (!els.studyPlan) return;
  els.studyPlan.innerHTML = "";

  if (!predictions.length) {
    els.studyPlan.append(emptyState());
    return;
  }

  const priority = predictions[0];
  const overdue = [...predictions].sort((a, b) => (b.absenceYears || 0) - (a.absenceYears || 0)).slice(0, 3);
  const strong = predictions.filter((item) => item.score >= 65).slice(0, 4);
  const totalQuestions = Math.max(1, subject.exercises.length);

  const cards = [
    {
      title: "Tema prioritario",
      body: `${priority.topic} deve abrir o estudo: representa ${priority.count} pergunta${priority.count === 1 ? "" : "s"} e aparece em ${priority.years.size} ano${priority.years.size === 1 ? "" : "s"}.`,
    },
    {
      title: "Ordem sugerida",
      body: predictions.slice(0, 5).map((item, index) => `${index + 1}. ${item.topic} (${item.score}%)`).join("\n"),
    },
    {
      title: "Proximos passos",
      body: "1. Abrir as perguntas reais do tema prioritario.\n2. Escrever a resolucao completa.\n3. Comparar tipos de pergunta repetidos.\n4. Gerar uma simulacao por frequencia e outra por ausencia.",
    },
    {
      title: "Metas semanais",
      body: "Semana 1: resolver perguntas dos 2 temas mais provaveis.\nSemana 2: rever perguntas com baixa confianca e completar resolucoes.\nSemana 3: simular teste e corrigir lacunas.",
    },
    {
      title: "Temas fortes",
      body: strong.length ? strong.map((item) => `${item.topic}: ${Math.round((item.count / totalQuestions) * 100)}% das perguntas analisadas`).join("\n") : "Ainda nao ha temas fortes suficientes.",
    },
    {
      title: "Ausentes ha mais tempo",
      body: overdue.map((item) => `${item.topic}: ${item.absenceYears || 0} ciclo${item.absenceYears === 1 ? "" : "s"} sem aparecer`).join("\n"),
    },
  ];

  for (const item of cards) {
    const card = document.createElement("article");
    card.className = "study-card";
    card.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p>`;
    els.studyPlan.append(card);
  }
}

function renderPredictions(predictions) {
  els.predictionList.innerHTML = "";
  els.exerciseSuggestions.innerHTML = "";

  if (!predictions.length) {
    els.predictionList.append(emptyState());
    els.exerciseSuggestions.append(emptyState());
    return;
  }

  for (const prediction of predictions) {
    const card = document.createElement("article");
    card.className = "prediction-card";
    card.innerHTML = `
      <div class="prediction-head">
        <h3>${escapeHtml(prediction.topic)}</h3>
        <span class="score-badge">${prediction.score}%</span>
      </div>
      <div class="probability-bar" aria-hidden="true"><span style="width:${prediction.score}%"></span></div>
      <div class="prediction-meta">
        <span class="pill">${prediction.count} ocorrencias</span>
        <span class="pill">${prediction.years.size} anos</span>
        <span class="pill">${prediction.recentCount} recentes</span>
        <span class="pill">${escapeHtml(prediction.assessments.slice(0, 2).join(", "))}</span>
        <span class="pill">${escapeHtml(prediction.sourceTypes.slice(0, 2).join(", "))}</span>
      </div>
      <p class="prediction-reason">${escapeHtml(buildPredictionExplanation(prediction))}</p>
      <div class="solution-actions">
        <button class="secondary-button" type="button" data-filter-topic="${escapeHtml(prediction.topic)}">Ver perguntas reais</button>
        <button class="secondary-button" type="button" data-generate-topic="${escapeHtml(prediction.topic)}">Gerar exemplo provavel</button>
      </div>
    `;
    els.predictionList.append(card);
  }

  const suggestions = predictions.slice(0, 5);

  for (const prediction of suggestions) {
    const exampleText = prediction.examples?.[0]?.text
      ? clip(cleanExerciseText(prediction.examples[0].text), 260)
      : "Ainda ha poucas perguntas reais neste tema.";
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.innerHTML = `
      <header>
        <strong>${escapeHtml(prediction.topic)}</strong>
        <span class="mini-label">${prediction.score}%</span>
      </header>
      <p>${escapeHtml(buildPredictionExplanation(prediction))}</p>
      <p class="evidence-text">${escapeHtml(exampleText)}</p>
      <div class="prediction-meta">
        <span class="pill">${prediction.count} exemplos</span>
        <span class="pill">${prediction.years.size} anos</span>
        <span class="pill">${escapeHtml(prediction.sourceTypes.slice(0, 2).join(", "))}</span>
      </div>
    `;
    els.exerciseSuggestions.append(card);
  }
}

function buildPredictionExplanation(prediction) {
  const reasons = [];
  reasons.push(`apareceu em ${prediction.count} pergunta${prediction.count === 1 ? "" : "s"}`);
  reasons.push(`surgiu em ${prediction.years.size} ano${prediction.years.size === 1 ? "" : "s"} diferente${prediction.years.size === 1 ? "" : "s"}`);
  if (prediction.recentCount) reasons.push(`${prediction.recentCount} ocorrencia${prediction.recentCount === 1 ? "" : "s"} recente${prediction.recentCount === 1 ? "" : "s"}`);
  if (prediction.assessments.length) reasons.push(`costuma aparecer em ${prediction.assessments.slice(0, 2).join(", ")}`);
  if (prediction.absenceYears > 0) reasons.push(`esta ausente ha ${prediction.absenceYears} ciclo${prediction.absenceYears === 1 ? "" : "s"}`);
  return `Porque esta alto no ranking: ${reasons.join("; ")}.`;
}

function renderQuestionFilters(subject) {
  if (!els.filters.topic) return;
  const current = {
    topic: els.filters.topic.value,
    year: els.filters.year.value,
    semester: els.filters.semester.value,
    assessment: els.filters.assessment.value,
    status: els.filters.status.value,
  };
  const topics = [...new Set(subject.exercises.flatMap((exercise) =>
    (exercise.topics || []).map(normalizeStoredTopic).filter(Boolean)
  ))].sort();
  const years = [...new Set(subject.exercises.map((exercise) => exercise.academicYear).filter(Boolean))].sort().reverse();
  const semesters = [...new Set(subject.exercises.map((exercise) => exercise.semester).filter(Boolean))].sort();
  const assessments = [...new Set(subject.exercises.map((exercise) => exercise.assessment).filter(Boolean))].sort();

  fillSelect(els.filters.topic, topics, "Todos");
  fillSelect(els.filters.year, years, "Todos");
  fillSelect(els.filters.semester, semesters, "Todos");
  fillSelect(els.filters.assessment, assessments, "Todas");

  els.filters.topic.value = topics.includes(current.topic) ? current.topic : "";
  els.filters.year.value = years.includes(current.year) ? current.year : "";
  els.filters.semester.value = semesters.includes(current.semester) ? current.semester : "";
  els.filters.assessment.value = assessments.includes(current.assessment) ? current.assessment : "";
  els.filters.status.value = current.status || "";
}

function fillSelect(select, values, emptyLabel) {
  const first = select.querySelector("option[value='']");
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = first?.textContent || emptyLabel;
  select.append(empty);
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function getQuestionFilters() {
  return {
    topic: els.filters.topic?.value || "",
    year: els.filters.year?.value || "",
    semester: els.filters.semester?.value || "",
    assessment: els.filters.assessment?.value || "",
    status: els.filters.status?.value || "",
  };
}

function matchesQuestionFilters(exercise, filters) {
  const exerciseTopics = (exercise.topics || []).map(normalizeStoredTopic);
  if (filters.topic && !exerciseTopics.includes(filters.topic)) return false;
  if (filters.year && exercise.academicYear !== filters.year) return false;
  if (filters.semester && exercise.semester !== filters.semester) return false;
  if (filters.assessment && exercise.assessment !== filters.assessment) return false;
  if (filters.status === "answered" && !exercise.solution) return false;
  if (filters.status === "unanswered" && exercise.solution) return false;
  if (filters.status === "with-solution" && !exercise.solution) return false;
  if (filters.status === "without-solution" && exercise.solution) return false;
  if (filters.status === "with-image" && !(exercise.images || []).length) return false;
  if (filters.status === "without-image" && (exercise.images || []).length) return false;
  if (filters.status === "low-confidence" && exercise.confidence !== "Baixa") return false;
  return true;
}

function emptyState() {
  return document.querySelector("#empty-state-template").content.firstElementChild.cloneNode(true);
}

function renderExercisesByDocument(subject, documentKey = "") {
  els.historyList.innerHTML = "";

  if (!subject.exercises.length) {
    els.historyList.append(emptyState());
    return;
  }

  const filters = getQuestionFilters();
  const sortedGroups = getDocumentGroups(subject)
    .filter((group) => !documentKey || getDocumentKey(group[0]) === documentKey)
    .map((group) => group.filter((exercise) => matchesQuestionFilters(exercise, filters)))
    .filter((group) => group.length);

  if (!sortedGroups.length) {
    const empty = emptyState();
    empty.querySelector("h3").textContent = "Nenhuma pergunta corresponde aos filtros";
    empty.querySelector("p").textContent = "Limpa ou altera os filtros para veres mais perguntas reais.";
    els.historyList.append(empty);
    return;
  }

  for (const exercises of sortedGroups) {
    const firstExercise = exercises[0];
    const topics = [...new Set(exercises.flatMap((exercise) =>
      (exercise.topics || []).map(normalizeStoredTopic).filter(Boolean)
    ))].slice(0, 5);
    const group = document.createElement("details");
    group.className = "topic-group document-group";
    group.open = sortedGroups.length === 1;
    group.innerHTML = `
      <summary class="topic-group-header document-summary">
        <div>
          <h3>${escapeHtml(getDocumentLabel(firstExercise))}</h3>
          <p>${exercises.length} pergunta${exercises.length > 1 ? "s" : ""} separada${exercises.length > 1 ? "s" : ""} deste documento</p>
        </div>
        <span class="pill">${escapeHtml(firstExercise.sourceType || "Documento")}</span>
      </summary>
      <div class="prediction-meta document-topics">
        ${topics.map((topic) => `<span class="pill">${escapeHtml(topic)}</span>`).join("")}
      </div>
      <div class="topic-exercises"></div>
    `;

    const list = group.querySelector(".topic-exercises");
    exercises.forEach((exercise, index) => {
      const primaryTopic = normalizeStoredTopic(exercise.topics?.[0]) || "Tema por definir";
      const card = document.createElement("article");
      card.className = "history-card";
      card.innerHTML = `
        <header>
          <div>
            <strong>Pergunta ${index + 1}</strong>
            <div class="mini-label">${escapeHtml(primaryTopic)} · ${escapeHtml(exercise.type || "Pergunta")}</div>
            <div class="mini-label">${escapeHtml(exercise.academicYear)} · ${escapeHtml(exercise.semester)}. semestre · ${escapeHtml(exercise.month)} · ${escapeHtml(exercise.assessment)}</div>
          </div>
        </header>
        <p>${escapeHtml(cleanExerciseText(exercise.text))}</p>
        ${renderExerciseImages(exercise)}
        <label class="solution-editor">
          Materia desta pergunta
          <input data-topic-edit="${exercise.id}" type="text" value="${escapeHtml(primaryTopic === "Tema por definir" ? "" : primaryTopic)}" placeholder="Ex: RAM e ROM, maquinas de estados, contadores">
        </label>
        <label class="solution-editor">
          Resolucao do aluno
          <textarea data-solution="${exercise.id}" rows="4" placeholder="Escreve aqui a resolucao completa desta pergunta...">${escapeHtml(exercise.solution || "")}</textarea>
        </label>
        <div class="solution-actions">
          <button class="secondary-button" type="button" data-save-solution="${exercise.id}">Guardar resolucao</button>
        </div>
        <div class="prediction-meta">
          <span class="pill">${escapeHtml(exercise.difficulty)}</span>
          <span class="pill">Confianca: ${escapeHtml(exercise.confidence || "Media")}</span>
          ${exercise.confidence === "Baixa" ? `<span class="pill warning-pill">${escapeHtml(exercise.analysisNotes || "Rever separacao")}</span>` : ""}
          <span class="pill">${escapeHtml(primaryTopic)}</span>
        </div>
      `;
      list.append(card);
    });

    els.historyList.append(group);
  }
}

function renderExerciseImages(exercise) {
  const images = Array.isArray(exercise.images) ? exercise.images : [];
  if (!images.length) return "";

  const rendered = images.slice(0, 4).map((image, index) => {
    const src = image?.src || "";
    if (!src) return "";
    return `<figure class="exercise-figure"><img src="${escapeHtml(src)}" alt="Figura da pergunta ${index + 1}" loading="lazy"><figcaption>${escapeHtml(image.caption || "Figura")}</figcaption></figure>`;
  }).join("");

  return rendered ? `<div class="exercise-figures">${rendered}</div>` : "";
}

function buildExampleTest(subject, mode = "frequent") {
  const predictions = calculatePredictions(subject);
  if (!predictions.length) {
    return "Sem dados suficientes para gerar teste. Importa mais exames primeiro.";
  }

  const newestYear = Math.max(...subject.exercises.map((exercise) => exercise.yearStart || 0));
  const ranked = mode === "overdue"
    ? [...predictions].sort((a, b) => {
      const ageA = Math.max(0, newestYear - (a.lastSeen || newestYear));
      const ageB = Math.max(0, newestYear - (b.lastSeen || newestYear));
      return ageB - ageA || b.score - a.score;
    })
    : [...predictions].sort((a, b) => b.score - a.score);

  const selected = ranked.slice(0, 6);
  const title = mode === "overdue"
    ? `Teste exemplo - Materias mais atrasadas (${subject.name})`
    : `Teste exemplo - Materias mais frequentes (${subject.name})`;

  const intro = mode === "overdue"
    ? "Selecao focada em temas que nao aparecem ha mais tempo no historico."
    : "Selecao focada em temas com maior frequencia/probabilidade no historico.";

  const questions = selected.map((item, index) => {
    const age = Math.max(0, newestYear - (item.lastSeen || newestYear));
    const evidence = item.examples?.[0]?.text ? clip(cleanExerciseText(item.examples[0].text), 360) : "Sem pergunta real suficiente.";
    const reason = mode === "overdue"
      ? `Atraso: ${age} ano(s) sem aparecer.`
      : `Probabilidade estimada: ${item.score}%.`;
    return `${index + 1}. ${item.topic}\nPergunta real de referencia: ${evidence}\nJustificacao: ${reason} Baseado apenas no historico guardado.`;
  });

  return [title, intro, "", ...questions].join("\n\n");
}

function generateExampleTest(mode) {
  const subject = getSubject();
  const output = buildExampleTest(subject, mode);
  if (els.generatedTestOutput) {
    els.generatedTestOutput.value = output;
  }
  els.analysisPreview.textContent = "Teste exemplo gerado com base no historico.";
  activateTab("themes");
}

function generateTopicExample(topicName) {
  const subject = getSubject();
  const prediction = calculatePredictions(subject).find((item) => item.topic === topicName);
  if (!prediction) return;

  const evidence = prediction.examples?.slice(0, 3)
    .map((exercise, index) => `${index + 1}. ${clip(cleanExerciseText(exercise.text), 260)}`)
    .join("\n\n");
  const output = [
    `Exemplo provavel - ${prediction.topic}`,
    "Tipo: simulacao informada por perguntas reais anteriores.",
    buildPredictionExplanation(prediction),
    "",
    "Perguntas reais usadas como base:",
    evidence || prediction.likelyExercise.evidence,
  ].join("\n");

  if (els.generatedTestOutput) {
    els.generatedTestOutput.value = output;
  }
  els.analysisPreview.textContent = "Exemplo provavel gerado para o tema escolhido.";
  activateTab("themes");
}

function getDocumentKey(exercise) {
  return [
    exercise.sourceName || "manual",
    exercise.academicYear || "",
    exercise.assessment || "",
    exercise.createdAt ? exercise.createdAt.slice(0, 10) : "",
  ].join("|");
}

function getDocumentLabel(exercise) {
  const source = exercise.sourceName ? exercise.sourceName.replace(/\.[^.]+$/, "") : "Perguntas coladas";
  const assessment = exercise.assessment || exercise.sourceType || "Documento";
  const year = exercise.academicYear || "";
  return `${assessment} ${year}`.trim() + (source ? ` · ${source}` : "");
}

function clip(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function cleanExerciseText(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/([a-z])\s(?=[a-z]\s[a-z]\s)/gi, "$1")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active-panel", panel.id === `${tabName}-panel`);
  });
}

function openSubjectModal() {
  renderSubjectManager();
  els.subjectManagerNote.textContent = "";
  els.subjectModal.classList.add("open");
  els.subjectModal.setAttribute("aria-hidden", "false");
}

function closeSubjectModal() {
  els.subjectModal.classList.remove("open");
  els.subjectModal.setAttribute("aria-hidden", "true");
}

function saveExerciseSolution(exerciseId) {
  const subject = getSubject();
  const exercise = subject.exercises.find((item) => item.id === exerciseId);
  const textarea = els.historyList.querySelector(`[data-solution="${CSS.escape(exerciseId)}"]`);
  const topicInput = els.historyList.querySelector(`[data-topic-edit="${CSS.escape(exerciseId)}"]`);

  if (!exercise || !textarea) return;

  const topicName = normalizeManualTopicName(topicInput?.value || "");
  if (topicName) {
    exercise.topics = [ensureManualTopic(subject, topicName)];
  }
  exercise.solution = textarea.value.trim();
  persist();
  render();
  activateTab("questions");
  els.analysisPreview.textContent = "Pergunta atualizada.";
}

async function clearCurrentSubjectData() {
  const subject = getSubject();
  if (!subject) return;

  const confirmed = confirm(`Limpar todas as perguntas, temas identificados e conselhos de "${subject.name}"?`);
  if (!confirmed) return;

  els.clearSubject.disabled = true;
  els.clearSubject.textContent = "A limpar...";

  try {
    if (supabaseClient && cloudReady) {
      const { error: exerciseError } = await supabaseClient.from("exercises").delete().eq("subject_id", subject.id);
      if (exerciseError) throw exerciseError;

      const { error: topicError } = await supabaseClient.from("topics").delete().eq("subject_id", subject.id);
      if (topicError) throw topicError;

      const { error: subjectError } = await supabaseClient.from("subjects").update({ advice: "" }).eq("id", subject.id);
      if (subjectError) throw subjectError;
    }

    subject.exercises = [];
    subject.customTopics = [];
    subject.advice = "";
    persist();
    render();
    activateTab("import");
    els.analysisPreview.textContent = "Dados de teste limpos. Podes importar ou colar novamente.";
  } catch (error) {
    els.analysisPreview.textContent = `Nao consegui limpar na Supabase: ${error.message}`;
  } finally {
    els.clearSubject.disabled = false;
    els.clearSubject.textContent = "Limpar dados de teste";
  }
}

function addSampleData() {
  const subject = getSubject();
  const years = ["2021/2022", "2022/2023", "2023/2024", "2024/2025"];
  years.forEach((year, index) => {
    addExercisesFromForm({
      academicYear: year,
      semester: "1",
      month: index % 2 ? "Junho" : "Janeiro",
      assessment: index % 2 ? "Recurso" : "Exame",
      exerciseText: SAMPLE_EXERCISES,
    });
  });
  selectedSubjectId = subject.id;
  render();
  activateTab("themes");
}

els.subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.newSubject.value.trim();
  if (!name) return;

  const subject = {
    id: crypto.randomUUID(),
    name,
    advice: "",
    customTopics: [],
    exercises: [],
  };
  state.subjects.push(subject);
  selectedSubjectId = subject.id;
  els.newSubject.value = "";
  render();
});

els.generateAdvice.addEventListener("click", generateSubjectAdvice);

els.saveAdvice.addEventListener("click", saveSubjectAdvice);

els.documentFiles.addEventListener("change", () => {
  const files = [...(els.documentFiles.files || [])];
  if (!files.length) {
    els.documentFileStatus.textContent = "PDF ou imagem. Ao escolher, a pagina de selecao abre automaticamente.";
    return;
  }

  const names = files.map((file) => file.name).join(", ");
  els.documentFileStatus.textContent = `${files.length} ficheiro${files.length > 1 ? "s" : ""} escolhido${files.length > 1 ? "s" : ""}: ${names}`;
  els.analysisPreview.textContent = "Ficheiro escolhido. A abrir selecao de perguntas...";
  openManualSelection();
});

els.manualQuestionMode.addEventListener("click", () => setManualMode("question"));
els.manualAnnexMode.addEventListener("click", () => setManualMode("annex"));
els.manualUndo.addEventListener("click", undoManualSelection);
els.manualClear.addEventListener("click", clearManualSelections);
els.manualSave.addEventListener("click", saveManualSelections);
els.manualPageViewer.addEventListener("mousedown", startManualDrag);
document.addEventListener("mousemove", updateManualDrag);
document.addEventListener("mouseup", finishManualDrag);

els.manageSubjectsButton.addEventListener("click", openSubjectModal);

els.closeSubjectModal.addEventListener("click", closeSubjectModal);

els.subjectModal.addEventListener("click", (event) => {
  if (event.target === els.subjectModal) {
    closeSubjectModal();
  }
});

els.subjectManagerList.addEventListener("click", (event) => {
  const subjectToOpen = event.target.dataset.openSubject;

  if (subjectToOpen) {
    selectedSubjectId = subjectToOpen;
    render();
    closeSubjectModal();
  }
});

els.exerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(els.exerciseForm).entries());
  const added = addExercisesFromForm(formData);

  if (!added.length) {
    els.analysisPreview.textContent = "Separa as perguntas por linhas em branco ou por numeracao.";
    return;
  }

  const topics = [...new Set(added.flatMap((exercise) => exercise.topics))].join(", ");
  els.analysisPreview.textContent = `${added.length} perguntas reais guardadas. Temas identificados: ${topics}.`;
  els.exerciseForm.reset();
  render();
  activateTab("themes");
});

document.querySelector(".tabs").addEventListener("click", (event) => {
  if (event.target.matches(".tab")) {
    activateTab(event.target.dataset.tab);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-go-tab], [data-filter-topic], [data-generate-topic], [data-open-document]");
  if (!target) return;

  if (target.dataset.goTab) {
    activateTab(target.dataset.goTab);
  }

  if (target.dataset.filterTopic) {
    activateTab("questions");
    if (els.filters.topic) {
      els.filters.topic.value = target.dataset.filterTopic;
      renderExercisesByDocument(getSubject());
    }
  }

  if (target.dataset.generateTopic) {
    generateTopicExample(target.dataset.generateTopic);
  }

  if (target.dataset.openDocument) {
    activateTab("questions");
    renderExercisesByDocument(getSubject(), target.dataset.openDocument);
    const firstGroup = els.historyList.querySelector(".document-group");
    if (firstGroup) firstGroup.open = true;
  }
});

Object.values(els.filters).forEach((select) => {
  select?.addEventListener("change", () => renderExercisesByDocument(getSubject()));
});

els.historyList.addEventListener("click", (event) => {
  const solutionId = event.target.dataset.saveSolution;
  if (solutionId) {
    saveExerciseSolution(solutionId);
  }
});

els.seedButton.addEventListener("click", addSampleData);

els.clearSubject.addEventListener("click", clearCurrentSubjectData);
els.generateFrequentTest?.addEventListener("click", () => generateExampleTest("frequent"));
els.generateOverdueTest?.addEventListener("click", () => generateExampleTest("overdue"));

render();
initSupabaseSync();
