const STORAGE_KEY = "exampulse.v1";
const ANALYZER_VERSION = 2;
const SUPABASE_URL = "https://woostdadplbikfwfiqjd.supabase.co";
const SUPABASE_KEY = "sb_publishable_7-rfzQ6TU8nYlADkHEkS9Q_zUHPAOKD";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
let cloudReady = false;
let syncTimer = null;

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

const SAMPLE_EXERCISES = `1. Simplifique a funcao logica F(A,B,C,D) usando mapas de Karnaugh e implemente o circuito apenas com portas NAND.

2. Considere um contador sincrono modulo 10 com flip-flops JK. Construa a tabela de estados e indique as entradas dos flip-flops.

3. Uma memoria ROM tem 12 linhas de endereco e palavras de 8 bits. Determine a capacidade total e desenhe a organizacao interna.

4. Projete uma maquina de estados do tipo Mealy que deteta a sequencia 1011 numa entrada serie.

5. Implemente a funcao F com um multiplexer 8:1, indicando as linhas de selecao e as entradas de dados.`;

const state = loadState();
let selectedSubjectId = state.selectedSubjectId || state.subjects[0].id;

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
  documentImportButton: document.querySelector("#document-import-button"),
  exerciseForm: document.querySelector("#exercise-form"),
  analysisPreview: document.querySelector("#analysis-preview"),
  topicPreview: document.querySelector("#topic-preview"),
  quickPriority: document.querySelector("#quick-priority"),
  predictionList: document.querySelector("#prediction-list"),
  exerciseSuggestions: document.querySelector("#exercise-suggestions"),
  historyList: document.querySelector("#history-list"),
  seedButton: document.querySelector("#seed-button"),
  clearSubject: document.querySelector("#clear-subject"),
  metrics: {
    exercises: document.querySelector("#metric-exercises"),
    topics: document.querySelector("#metric-topics"),
    years: document.querySelector("#metric-years"),
    mainTopic: document.querySelector("#metric-main-topic"),
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
  return [...(TOPIC_LIBRARY[subject.name] || []), ...(subject.customTopics || []), ...GENERIC_TOPICS];
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

function splitExamQuestions(rawText) {
  const preparedText = prepareExerciseText(rawText);
  const markers = findQuestionMarkers(preparedText);

  if (markers.length) {
    return markers
      .map((marker, index) => preparedText.slice(marker.index, markers[index + 1]?.index || preparedText.length))
      .map(cleanQuestionCandidate)
      .filter(isLikelyExercise);
  }

  return preparedText
    .split(/\n\s*\n/)
    .map(cleanQuestionCandidate)
    .filter(isLikelyExercise);
}

function prepareExerciseText(rawText) {
  return rawText
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+(\d{1,2}\s*[.)]\s+(?=[A-Za-z]))/g, "\n\n$1")
    .replace(/\s+(\d{1,2}\s*[\-\u2013\u2014]\s+(?=[A-Za-z]))/g, "\n\n$1")
    .replace(/\s+(\d{1,2}\s*\?\s+(?=[A-Za-z]))/g, "\n\n$1")
    .replace(/\s+(\d+\s*[.,]?\s*[a-z]\s*[\).:-]\s+)/gi, "\n\n$1")
    .replace(/\s+((?:quest(?:ao|ão)|exerc(?:icio|ício))\s*\d+(?:[.,]\d+)*(?:\s*[a-z])?\s*[:.)-])/gi, "\n\n$1 ")
    .replace(/\s+(\d+(?:[.,]\d+){1,3}\s*[:.)-]\s+)/g, "\n\n$1")
    .replace(/\s+(\d+\s*[a-z]\s*[:.)-]\s+)/gi, "\n\n$1")
    .replace(/\s+([a-z]\s*[\).]\s+(?=(?:calcule|determine|desenhe|projete|implemente|explique|indique|justifique|represente|construa|considere)\b))/gi, "\n\n$1")
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
    .replace(/^\s*(?:quest(?:ao|ão)|exerc(?:icio|ício))\s*/i, "")
    .replace(/^\s*\d+(?:[.,]\d+)*\s*[a-z]?\s*[:.)\-\u2013\u2014?]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripBoilerplatePrefix(cleaned);
}

function hasQuestionSignal(text) {
  const normalized = normalizeText(text);
  return /(calcule|determine|desenhe|projete|implemente|explique|indique|justifique|represente|construa|considere|dimensione|simplifique|obtenha|apresente|complete|preencha|analise|deduza|mostre)/.test(normalized) || /[A-Za-z]\?/.test(text);
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

function classifyExercise(text, subject) {
  const normalized = normalizeText(text);
  const scored = getTopicSet(subject)
    .map((topic) => {
      const result = scoreTopic(topic, normalized);
      return { name: topic.name, score: result.score, matches: result.matches };
    })
    .filter((topic) => topic.score >= 3 || topic.matches >= 2)
    .sort((a, b) => b.score - a.score);

  const customAndKnown = scored.filter((topic) => !GENERIC_TOPICS.some((generic) => generic.name === topic.name));
  const needsNewTopic = !customAndKnown.length || customAndKnown[0]?.score < 4;
  const inferredTopic = needsNewTopic ? ensureCustomTopic(subject, text) : null;
  const topics = [
    ...(inferredTopic ? [inferredTopic] : []),
    ...customAndKnown.slice(0, 2).map((topic) => topic.name),
  ].slice(0, 2);

  return {
    topics: topics.length ? topics : ["Tema por confirmar"],
    difficulty: estimateDifficulty(normalized, text.length),
    type: estimateType(normalized),
    keywords: extractKeywords(text).slice(0, 10),
  };
}

function scoreTopic(topic, normalizedText) {
  let score = 0;
  let matches = 0;

  for (const keyword of topic.keywords) {
    if (!keywordMatches(normalizedText, keyword)) continue;
    const needle = normalizeText(keyword);
    matches += 1;
    score += Math.max(1.4, Math.min(4, needle.length / 3.5));
  }

  return { score, matches };
}

function keywordMatches(normalizedText, keyword) {
  const needle = normalizeText(keyword).trim();
  if (!needle || needle.length < 3) return false;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (needle.includes(" ")) {
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
  }

  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
}

function ensureCustomTopic(subject, text) {
  const inferred = inferTopicName(text);
  if (!inferred) return null;

  const normalizedName = normalizeText(inferred);
  const existing = [...(subject.customTopics || []), ...(TOPIC_LIBRARY[subject.name] || [])].find((topic) => normalizeText(topic.name) === normalizedName);
  if (existing) return existing.name;

  const keywords = extractKeywords(text).slice(0, 8);
  if (!keywords.length) return null;

  subject.customTopics = subject.customTopics || [];
  subject.customTopics.push({
    name: inferred,
    keywords,
    custom: true,
  });

  return inferred;
}

function inferTopicName(text) {
  const explicit = text.match(/(?:tema|materia|mat[eé]ria|capitulo|cap[ií]tulo|unidade)\s*[:\-]\s*([A-Za-z0-9 \-/]{3,55})/i);
  if (explicit) return titleCase(explicit[1].trim().replace(/[.;:,]+$/, ""));

  const keywords = extractKeywords(text);
  if (!keywords.length) return null;
  return `Materia: ${titleCase(keywords.slice(0, 2).join(" "))}`;
}

function extractKeywords(text) {
  const normalized = normalizeText(text);
  const tokens = normalized.match(/[a-z0-9]{4,}/g) || [];
  const counts = new Map();

  for (const token of tokens) {
    if (STOPWORDS.has(token) || /^\d+$/.test(token)) continue;
    if (token.length < 5 && !/^(ram|rom|mux|fsm)$/i.test(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token)
    .slice(0, 12);
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

function estimateType(normalized) {
  if (/(projete|desenhe|implemente|construa)/.test(normalized)) return "Projeto";
  if (/(calcule|determine|obtenha|resolva)/.test(normalized)) return "Calculo";
  if (/(explique|defina|justifique|compare)/.test(normalized)) return "Teoria";
  return "Exercicio";
}

function parseYearStart(academicYear) {
  const match = academicYear.match(/\d{4}/);
  return match ? Number(match[0]) : new Date().getFullYear();
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
  if (header.includes("frequencia") || /\bfreq/.test(header)) return "Frequencia";
  if (header.includes("teste")) return "Teste";
  if (header.includes("exame")) return "Exame normal";
  return "";
}

function addExercisesFromForm(formData) {
  const subject = getSubject();
  const pieces = splitExamQuestions(formData.exerciseText);
  const now = new Date().toISOString();
  const existingSignatures = new Set(subject.exercises.map((exercise) => getExerciseSignature(exercise.text)));

  const newExercises = [];
  let skippedDuplicates = 0;

  for (const text of pieces) {
    const signature = getExerciseSignature(text);
    if (!signature || existingSignatures.has(signature)) {
      skippedDuplicates += 1;
      continue;
    }

    existingSignatures.add(signature);
    const analysis = classifyExercise(text, subject);
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
      sourceName: formData.sourceName || "",
      solution: "",
      createdAt: now,
      ...analysis,
    });
  }

  subject.exercises.unshift(...newExercises);
  persist();
  newExercises.skippedDuplicates = skippedDuplicates;
  return newExercises;
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
  if (shouldInferAcademicYear) {
    metadata.academicYear = guessCurrentAcademicYear();
  }

  els.documentImportButton.disabled = true;
  els.documentImportButton.textContent = "A analisar...";
  showImportMessage(`A ler ${files.length} ficheiro${files.length > 1 ? "s" : ""}...`);

  try {
    let totalExercises = 0;
    let totalSkipped = 0;
    const topicNames = new Set();
    const sourceTypes = new Set();
    const failedFiles = [];

    for (const file of files) {
      try {
        const text = await extractTextFromFile(file);
        const documentInfo = detectDocumentType(text, file.name);
        const academicYear = shouldInferAcademicYear
          ? inferAcademicYear(text, file.name) || metadata.academicYear
          : metadata.academicYear;
        const added = addExercisesFromForm({
          ...metadata,
          academicYear,
          assessment: documentInfo.assessment || metadata.assessment,
          sourceType: documentInfo.sourceType,
          exerciseText: text,
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
    activateTab(totalExercises ? "predictions" : "paste");

    if (!totalExercises) {
      showImportMessage(failedFiles.length
        ? `Nao consegui extrair exercicios de: ${failedFiles.join(", ")}.`
        : totalSkipped
          ? `Documento ja importado. Ignorei ${totalSkipped} exercicios duplicados.`
          : "Nao encontrei exercicios claros no documento.");
      return;
    }

    const failedNote = failedFiles.length ? ` Nao lidos: ${failedFiles.join(", ")}.` : "";
    const duplicateNote = totalSkipped ? ` Ignorei ${totalSkipped} duplicados.` : "";
    const sourceNote = sourceTypes.size ? ` Tipo detetado: ${[...sourceTypes].join(", ")}.` : "";
    showImportMessage(`${totalExercises} exercicios importados.${sourceNote} Materias detetadas/criadas: ${[...topicNames].join(", ")}.${duplicateNote}${failedNote}`);
  } finally {
    els.documentImportButton.disabled = false;
    els.documentImportButton.textContent = "Importar e analisar";
  }
}

function getExerciseMetadataFromForm() {
  const formData = Object.fromEntries(new FormData(els.exerciseForm).entries());
  return {
    academicYear: formData.academicYear || "",
    semester: formData.semester || "1",
    month: formData.month || "Janeiro",
    assessment: formData.assessment || "Exame normal",
  };
}

function guessCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 8 ? year : year - 1;
  return `${start}/${start + 1}`;
}

function showImportMessage(message) {
  els.analysisPreview.textContent = message;
  els.documentFileStatus.textContent = message;
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
    els.analysisPreview.textContent = "Supabase ligada. Os proximos exercicios ficam guardados online.";
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

  const exercises = state.subjects.flatMap((subject) =>
    subject.exercises.map((exercise) => ({
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
    }))
  );

  const { error: subjectError } = await supabaseClient.from("subjects").upsert(subjects);
  if (subjectError) throw subjectError;

  if (topics.length) {
    const { error: topicError } = await supabaseClient.from("topics").upsert(topics, { onConflict: "subject_id,name" });
    if (topicError) throw topicError;
  }

  if (exercises.length) {
    const { error: exerciseError } = await supabaseClient.from("exercises").upsert(exercises);
    if (exerciseError) throw exerciseError;
  }
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
    for (const topic of exercise.topics) {
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
  const base = examples[0]?.text || "";

  return {
    title: `${type} sobre ${topic}`,
    prompt: `Provavel pergunta: ${verbText} um exercicio sobre ${keywordText}.`,
    evidence: clip(cleanExerciseText(base), 240),
  };
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

function render() {
  const subject = getSubject();
  const predictions = calculatePredictions(subject);

  renderSubjects();
  renderMetrics(subject, predictions);
  renderAdvice(subject, predictions);
  renderPreview(predictions);
  renderPredictions(predictions);
  renderExercisesByDocument(subject);
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
        <span>${subject.exercises.length} exercicios guardados</span>
      </div>
      <button class="secondary-button" type="button" data-open-subject="${subject.id}">Abrir</button>
    `;
    els.subjectManagerList.append(row);
  }
}

function renderMetrics(subject, predictions) {
  const topicCount = new Set(subject.exercises.flatMap((exercise) => exercise.topics)).size;
  const yearCount = new Set(subject.exercises.map((exercise) => exercise.academicYear)).size;

  els.metrics.exercises.textContent = subject.exercises.length;
  els.metrics.topics.textContent = topicCount;
  els.metrics.years.textContent = yearCount;
  els.metrics.mainTopic.textContent = predictions[0]?.topic || "-";
}

function renderAdvice(subject, predictions) {
  els.subjectAdvice.value = subject.advice || "";
  els.subjectAdvice.placeholder = predictions.length
    ? "Ex: treinar primeiro os temas mais frequentes, resolver exames antigos e escrever resolucoes completas..."
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
    const keywords = prediction.topKeywords.slice(0, 3).join(", ");
    return `${index + 1}. ${prediction.topic}: treinar ${prediction.topType.toLowerCase()} e rever ${keywords || "os exercicios guardados"}.`;
  });

  els.subjectAdvice.value = [
    `Para passar ${subject.name}, começa pelos temas que mais aparecem no historico:`,
    ...topicLines,
    "Metodo recomendado: resolver primeiro os exercicios ja guardados, escrever a resolucao completa, comparar padrões de pergunta e repetir os temas com maior percentagem em 'Mais provavel'.",
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
      <p class="prediction-reason">Tokens fortes: ${escapeHtml(prediction.topKeywords.slice(0, 5).join(", ") || "ainda poucos dados")}</p>
    `;
    els.predictionList.append(card);
  }

  const suggestions = predictions.slice(0, 5);

  for (const prediction of suggestions) {
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.innerHTML = `
      <header>
        <strong>${escapeHtml(prediction.likelyExercise.title)}</strong>
        <span class="mini-label">${prediction.score}%</span>
      </header>
      <p>${escapeHtml(prediction.likelyExercise.prompt)}</p>
      <p class="evidence-text">${escapeHtml(prediction.likelyExercise.evidence)}</p>
      <div class="prediction-meta">
        <span class="pill">${prediction.count} exemplos</span>
        <span class="pill">${prediction.years.size} anos</span>
        <span class="pill">${escapeHtml(prediction.sourceTypes.slice(0, 2).join(", "))}</span>
        <span class="pill">${escapeHtml(prediction.topKeywords.slice(0, 2).join(", ") || prediction.topic)}</span>
      </div>
    `;
    els.exerciseSuggestions.append(card);
  }
}

function renderHistory(subject) {
  els.historyList.innerHTML = "";

  if (!subject.exercises.length) {
    els.historyList.append(emptyState());
    return;
  }

  for (const exercise of subject.exercises) {
    const card = document.createElement("article");
    card.className = "history-card";
    card.innerHTML = `
      <header>
        <div>
          <strong>${escapeHtml(exercise.topics.join(" + "))}</strong>
          <div class="mini-label">${escapeHtml(exercise.academicYear)} · ${escapeHtml(exercise.semester)}. semestre · ${escapeHtml(exercise.month)} · ${escapeHtml(exercise.assessment)}</div>
        </div>
      </header>
      <p>${escapeHtml(exercise.text)}</p>
      <div class="prediction-meta">
        <span class="pill">${escapeHtml(exercise.type)}</span>
        <span class="pill">${escapeHtml(exercise.difficulty)}</span>
      </div>
    `;
    els.historyList.append(card);
  }
}

function emptyState() {
  return document.querySelector("#empty-state-template").content.firstElementChild.cloneNode(true);
}

function renderExercisesByDocument(subject) {
  els.historyList.innerHTML = "";

  if (!subject.exercises.length) {
    els.historyList.append(emptyState());
    return;
  }

  const byDocument = new Map();

  for (const exercise of subject.exercises) {
    const key = getDocumentKey(exercise);
    if (!byDocument.has(key)) byDocument.set(key, []);
    byDocument.get(key).push(exercise);
  }

  const sortedGroups = [...byDocument.values()].sort((a, b) => {
    const newestA = Math.max(...a.map((exercise) => exercise.yearStart || 0));
    const newestB = Math.max(...b.map((exercise) => exercise.yearStart || 0));
    return newestB - newestA || getDocumentLabel(a[0]).localeCompare(getDocumentLabel(b[0]));
  });

  for (const exercises of sortedGroups) {
    const firstExercise = exercises[0];
    const topics = [...new Set(exercises.flatMap((exercise) => exercise.topics || []))].slice(0, 5);
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
      const primaryTopic = exercise.topics?.[0] || "Tema por confirmar";
      const card = document.createElement("article");
      card.className = "history-card";
      card.innerHTML = `
        <header>
          <div>
            <strong>Pergunta ${index + 1}</strong>
            <div class="mini-label">${escapeHtml(primaryTopic)} · ${escapeHtml(exercise.type || "Exercicio")}</div>
            <div class="mini-label">${escapeHtml(exercise.academicYear)} · ${escapeHtml(exercise.semester)}. semestre · ${escapeHtml(exercise.month)} · ${escapeHtml(exercise.assessment)}</div>
          </div>
        </header>
        <p>${escapeHtml(cleanExerciseText(exercise.text))}</p>
        <label class="solution-editor">
          Resolucao do exercicio
          <textarea data-solution="${exercise.id}" rows="4" placeholder="Escreve aqui a resolucao completa deste exercicio...">${escapeHtml(exercise.solution || "")}</textarea>
        </label>
        <div class="solution-actions">
          <button class="secondary-button" type="button" data-save-solution="${exercise.id}">Guardar resolucao</button>
        </div>
        <div class="prediction-meta">
          <span class="pill">${escapeHtml(exercise.difficulty)}</span>
          <span class="pill">${escapeHtml(primaryTopic)}</span>
          <span class="pill">${escapeHtml((exercise.keywords || []).slice(0, 3).join(", ") || primaryTopic)}</span>
        </div>
      `;
      list.append(card);
    });

    els.historyList.append(group);
  }
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
  const source = exercise.sourceName ? exercise.sourceName.replace(/\.[^.]+$/, "") : "Exercicios colados";
  const assessment = exercise.assessment || exercise.sourceType || "Documento";
  const year = exercise.academicYear || "";
  return `${assessment} ${year}`.trim() + (source ? ` · ${source}` : "");
}

function renderExercisesByTopic(subject) {
  els.historyList.innerHTML = "";

  if (!subject.exercises.length) {
    els.historyList.append(emptyState());
    return;
  }

  const byTopic = new Map();

  for (const exercise of subject.exercises) {
    const primaryTopic = exercise.topics?.[0] || "Tema por confirmar";
    if (!byTopic.has(primaryTopic)) byTopic.set(primaryTopic, []);
    byTopic.get(primaryTopic).push(exercise);
  }

  const sortedGroups = [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  for (const [topic, exercises] of sortedGroups) {
    const group = document.createElement("section");
    group.className = "topic-group";
    group.innerHTML = `
      <header class="topic-group-header">
        <div>
          <h3>${escapeHtml(topic)}</h3>
          <p>${exercises.length} exercicio${exercises.length > 1 ? "s" : ""} guardado${exercises.length > 1 ? "s" : ""} neste tema</p>
        </div>
      </header>
      <div class="topic-exercises"></div>
    `;

    const list = group.querySelector(".topic-exercises");
    for (const exercise of exercises) {
      const card = document.createElement("article");
      card.className = "history-card";
      card.innerHTML = `
        <header>
          <div>
            <strong>${escapeHtml(exercise.type || "Exercicio")}</strong>
            <div class="mini-label">${escapeHtml(exercise.sourceType || "Documento")}</div>
            <div class="mini-label">${escapeHtml(exercise.academicYear)} · ${escapeHtml(exercise.semester)}. semestre · ${escapeHtml(exercise.month)} · ${escapeHtml(exercise.assessment)}</div>
          </div>
        </header>
        <p>${escapeHtml(cleanExerciseText(exercise.text))}</p>
        <label class="solution-editor">
          Resolucao do exercicio
          <textarea data-solution="${exercise.id}" rows="4" placeholder="Escreve aqui a resolucao completa deste exercicio...">${escapeHtml(exercise.solution || "")}</textarea>
        </label>
        <div class="solution-actions">
          <button class="secondary-button" type="button" data-save-solution="${exercise.id}">Guardar resolucao</button>
        </div>
        <div class="prediction-meta">
          <span class="pill">${escapeHtml(exercise.difficulty)}</span>
          <span class="pill">${escapeHtml(exercise.sourceType || "Documento")}</span>
          <span class="pill">${escapeHtml((exercise.keywords || []).slice(0, 3).join(", ") || topic)}</span>
        </div>
      `;
      list.append(card);
    }

    els.historyList.append(group);
  }
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

  if (!exercise || !textarea) return;

  exercise.solution = textarea.value.trim();
  persist();
  els.analysisPreview.textContent = "Resolucao guardada.";
}

async function clearCurrentSubjectData() {
  const subject = getSubject();
  if (!subject) return;

  const confirmed = confirm(`Limpar todos os exercicios, temas detetados e conselhos de "${subject.name}"?`);
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
    activateTab("paste");
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
      assessment: index % 2 ? "Recurso" : "Exame normal",
      exerciseText: SAMPLE_EXERCISES,
    });
  });
  selectedSubjectId = subject.id;
  render();
  activateTab("predictions");
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

els.documentImportButton.addEventListener("click", importDocumentFiles);

els.generateAdvice.addEventListener("click", generateSubjectAdvice);

els.saveAdvice.addEventListener("click", saveSubjectAdvice);

els.documentFiles.addEventListener("change", () => {
  const files = [...(els.documentFiles.files || [])];
  if (!files.length) {
    els.documentFileStatus.textContent = "PDF, Word, TXT ou imagem. Depois a app analisa automaticamente.";
    return;
  }

  const names = files.map((file) => file.name).join(", ");
  els.documentFileStatus.textContent = `${files.length} ficheiro${files.length > 1 ? "s" : ""} escolhido${files.length > 1 ? "s" : ""}: ${names}`;
  els.analysisPreview.textContent = "Ficheiro escolhido. A app vai importar e analisar automaticamente.";
  importDocumentFiles();
});

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
    els.analysisPreview.textContent = "Separa os exercicios por linhas em branco ou por numeracao.";
    return;
  }

  const topics = [...new Set(added.flatMap((exercise) => exercise.topics))].join(", ");
  els.analysisPreview.textContent = `${added.length} exercicios guardados. Temas detetados: ${topics}.`;
  els.exerciseForm.reset();
  render();
  activateTab("predictions");
});

document.querySelector(".tabs").addEventListener("click", (event) => {
  if (event.target.matches(".tab")) {
    activateTab(event.target.dataset.tab);
  }
});

els.historyList.addEventListener("click", (event) => {
  const solutionId = event.target.dataset.saveSolution;
  if (solutionId) {
    saveExerciseSolution(solutionId);
  }
});

els.seedButton.addEventListener("click", addSampleData);

els.clearSubject.addEventListener("click", clearCurrentSubjectData);

render();
initSupabaseSync();
