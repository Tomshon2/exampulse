const STORAGE_KEY = "exampulse.v1";
const ANALYZER_VERSION = 2;

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
  documentFiles: document.querySelector("#document-file"),
  documentFileStatus: document.querySelector("#document-file-status"),
  documentImportButton: document.querySelector("#document-import-button"),
  localFilePath: document.querySelector("#local-file-path"),
  pathImportButton: document.querySelector("#path-import-button"),
  pathImportStatus: document.querySelector("#path-import-status"),
  exerciseForm: document.querySelector("#exercise-form"),
  analysisPreview: document.querySelector("#analysis-preview"),
  topicPreview: document.querySelector("#topic-preview"),
  quickPriority: document.querySelector("#quick-priority"),
  predictionList: document.querySelector("#prediction-list"),
  exerciseSuggestions: document.querySelector("#exercise-suggestions"),
  historyList: document.querySelector("#history-list"),
  seedButton: document.querySelector("#seed-button"),
  clearSubject: document.querySelector("#clear-subject"),
  exportButton: document.querySelector("#export-button"),
  importFile: document.querySelector("#import-file"),
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

  return {
    analyzerVersion: ANALYZER_VERSION,
    selectedSubjectId: "sub-sistemas-digitais",
    subjects: [
      {
        id: "sub-sistemas-digitais",
        name: "Sistemas Digitais",
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
}

function getSubject() {
  return state.subjects.find((subject) => subject.id === selectedSubjectId) || state.subjects[0];
}

function normalizeState(nextState) {
  nextState.subjects = nextState.subjects.map((subject) => ({
    ...subject,
    customTopics: Array.isArray(subject.customTopics) ? subject.customTopics : [],
    exercises: Array.isArray(subject.exercises) ? subject.exercises : [],
  }));
  return nextState;
}

function reanalyzeState(nextState) {
  for (const subject of nextState.subjects) {
    subject.customTopics = [];
    subject.exercises = subject.exercises.map((exercise) => {
      const analysis = classifyExercise(exercise.text, subject);
      return { ...exercise, ...analysis };
    });
  }
  nextState.analyzerVersion = ANALYZER_VERSION;
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

function addExercisesFromForm(formData) {
  const subject = getSubject();
  const pieces = splitExercises(formData.exerciseText);
  const now = new Date().toISOString();

  const newExercises = pieces.map((text) => {
    const analysis = classifyExercise(text, subject);
    return {
      id: crypto.randomUUID(),
      text,
      academicYear: formData.academicYear,
      yearStart: parseYearStart(formData.academicYear),
      semester: formData.semester,
      month: formData.month,
      assessment: formData.assessment,
      createdAt: now,
      ...analysis,
    };
  });

  subject.exercises.unshift(...newExercises);
  persist();
  return newExercises;
}

async function importDocumentFiles() {
  const files = [...(els.documentFiles.files || [])];
  if (!files.length) {
    showImportMessage("Escolhe primeiro um PDF, Word, TXT ou imagem na caixa de documentos.");
    return;
  }

  const metadata = getExerciseMetadataFromForm();
  if (!metadata.academicYear.trim()) {
    metadata.academicYear = guessCurrentAcademicYear();
  }

  els.documentImportButton.disabled = true;
  els.documentImportButton.textContent = "A analisar...";
  showImportMessage(`A ler ${files.length} ficheiro${files.length > 1 ? "s" : ""}...`);

  try {
    let totalExercises = 0;
    const topicNames = new Set();
    const failedFiles = [];

    for (const file of files) {
      try {
        const text = await extractTextFromFile(file);
        const added = addExercisesFromForm({ ...metadata, exerciseText: text });
        totalExercises += added.length;
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
        : "Nao encontrei exercicios claros no documento.");
      return;
    }

    const failedNote = failedFiles.length ? ` Nao lidos: ${failedFiles.join(", ")}.` : "";
    showImportMessage(`${totalExercises} exercicios importados. Materias detetadas/criadas: ${[...topicNames].join(", ")}.${failedNote}`);
  } finally {
    els.documentImportButton.disabled = false;
    els.documentImportButton.textContent = "Importar e analisar";
  }
}

async function importLocalPath() {
  const filePath = els.localFilePath.value.trim();
  if (!filePath) {
    showPathMessage("Escreve o caminho completo do ficheiro.");
    return;
  }

  const metadata = getExerciseMetadataFromForm();
  if (!metadata.academicYear.trim()) {
    metadata.academicYear = guessCurrentAcademicYear();
  }

  els.pathImportButton.disabled = true;
  els.pathImportButton.textContent = "A importar...";
  showPathMessage("A pedir ao servidor local para ler o ficheiro...");

  try {
    const response = await fetch("http://127.0.0.1:4321/api/import-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath }),
    });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Nao foi possivel importar");
    }

    const added = addExercisesFromForm({ ...metadata, exerciseText: result.text });
    render();
    activateTab(added.length ? "predictions" : "paste");

    if (!added.length) {
      showPathMessage(`Li ${result.name}, mas nao encontrei exercicios separados.`);
      return;
    }

    const topics = [...new Set(added.flatMap((exercise) => exercise.topics))].join(", ");
    showPathMessage(`${added.length} exercicios importados de ${result.name}. Materias: ${topics}.`);
  } catch (error) {
    showPathMessage(`Nao consegui importar por caminho. Abre http://127.0.0.1:4321 e garante que o servidor esta ligado. Detalhe: ${error.message}`);
  } finally {
    els.pathImportButton.disabled = false;
    els.pathImportButton.textContent = "Importar caminho";
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

function showPathMessage(message) {
  els.analysisPreview.textContent = message;
  els.pathImportStatus.textContent = message;
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
  const total = exercises.length;
  const byTopic = new Map();

  for (const exercise of exercises) {
    for (const topic of exercise.topics) {
      if (!byTopic.has(topic)) {
        byTopic.set(topic, {
          topic,
          count: 0,
          years: new Set(),
          recentCount: 0,
          lastSeen: 0,
          examples: [],
          assessments: new Set(),
          keywords: new Map(),
          types: new Map(),
        });
      }

      const bucket = byTopic.get(topic);
      bucket.count += 1;
      bucket.years.add(exercise.yearStart);
      bucket.assessments.add(exercise.assessment);
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
      const frequency = item.count / total;
      const consistency = item.years.size / yearWindow;
      const recency = item.lastSeen ? 1 / (1 + Math.max(0, newestYear - item.lastSeen)) : 0;
      const evidence = Math.min(1, item.count / 4);
      let score = Math.round(18 + evidence * 34 + frequency * 20 + consistency * 16 + recency * 12);
      if (total < 5) score = Math.min(score, 72);
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
  renderPreview(predictions);
  renderPredictions(predictions);
  renderHistory(subject);
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
      <button class="danger-button" type="button" data-remove-subject="${subject.id}">Anular</button>
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
        <button class="delete-button" type="button" data-delete="${exercise.id}">Remover</button>
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

function removeSubject(subjectId) {
  if (state.subjects.length === 1) {
    els.subjectManagerNote.textContent = "Mantem pelo menos uma disciplina criada.";
    return;
  }

  const subject = state.subjects.find((item) => item.id === subjectId);
  const confirmed = confirm(`Anular "${subject?.name || "esta disciplina"}" e remover os exercicios associados?`);
  if (!confirmed) return;

  state.subjects = state.subjects.filter((item) => item.id !== subjectId);

  if (selectedSubjectId === subjectId) {
    selectedSubjectId = state.subjects[0].id;
  }

  render();
  els.subjectManagerNote.textContent = `${subject?.name || "Disciplina"} anulada.`;
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
    id: `sub-${slugify(name)}-${Date.now()}`,
    name,
    customTopics: [],
    exercises: [],
  };
  state.subjects.push(subject);
  selectedSubjectId = subject.id;
  els.newSubject.value = "";
  render();
});

els.documentImportButton.addEventListener("click", importDocumentFiles);

els.pathImportButton.addEventListener("click", importLocalPath);

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
  const subjectToRemove = event.target.dataset.removeSubject;

  if (subjectToOpen) {
    selectedSubjectId = subjectToOpen;
    render();
    closeSubjectModal();
  }

  if (subjectToRemove) {
    removeSubject(subjectToRemove);
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
  const id = event.target.dataset.delete;
  if (!id) return;

  const subject = getSubject();
  subject.exercises = subject.exercises.filter((exercise) => exercise.id !== id);
  render();
});

els.seedButton.addEventListener("click", addSampleData);

els.clearSubject.addEventListener("click", () => {
  const subject = getSubject();
  if (!subject.exercises.length) return;
  subject.exercises = [];
  render();
});

els.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exampulse-dados.json";
  link.click();
  URL.revokeObjectURL(url);
});

els.importFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.subjects)) throw new Error("Formato invalido");
    state.subjects = normalizeState(imported).subjects;
    selectedSubjectId = imported.selectedSubjectId || state.subjects[0].id;
    render();
  } catch {
    els.analysisPreview.textContent = "Esse botao so aceita backups JSON da app. Para exames/PDF/Word/imagens usa Escolher exames/documentos.";
  } finally {
    event.target.value = "";
  }
});

render();
