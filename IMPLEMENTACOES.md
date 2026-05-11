# Implementacoes - ExamPulse

Documento vivo para acompanhar alteracoes do projeto.

Regra: sempre que houver uma mudanca relevante no sistema, atualizar este ficheiro com:

- o que ja foi feito;
- o que ainda falta fazer.

## Ja feitas

### Base do produto

- Estrutura principal da app com disciplinas, metricas, previsoes e historico.
- Arquitetura de navegacao reorganizada para a jornada do aluno:
  - Dashboard da disciplina;
  - Importar documentos;
  - Documentos analisados;
  - Perguntas reais;
  - Temas provaveis;
  - Plano de estudo.
- Persistencia local com `localStorage`.
- Sync com Supabase para `subjects`, `topics` e `exercises`.
- Deteccao de questoes por tema quando existe correspondencia clara; caso contrario ficam como `Tema por definir` para correcao manual.

### Importacao e analise

- Importacao de documentos (`pdf`, `docx`, `txt`, `md`, imagens).
- OCR com `tesseract.js` para imagens e PDFs digitalizados.
- Separacao manual de questoes por caixas desenhadas sobre o PDF/imagem importado.
- Deteccao de tipo de documento (teste/exame, caderno, apontamentos).
- Deteccao de duplicados por assinatura.
- Metadata por pergunta:
  - confianca da separacao (`Alta`, `Media`, `Baixa`);
  - notas de analise;
  - numero de pergunta.

### Imagens por questao

- Associacao de imagens a cada questao durante importacao OCR.
- Renderizacao de imagens dentro do exercicio correspondente no historico.
- Persistencia de imagens de questoes:
  - upload para Supabase Storage (`exercise-images`);
  - referencia guardada em `exercises.images` (jsonb).
- Schema atualizado com coluna `images` e configuracao de bucket/policies.

### Robustez e compatibilidade

- Fallback de sync quando a coluna `images` nao existe no Supabase:
  - app continua a sincronizar sem imagens;
  - mensagem de aviso para atualizar schema.
- Fallback de sync quando metadados novos ainda nao existem no Supabase.

### Geracao de testes exemplo

- Botao para gerar teste por materias mais frequentes.
- Botao para gerar teste por materias mais atrasadas.
- Texto de teste gerado com justificacao e evidencias do historico.
- Testes exemplo baseados em perguntas reais de referencia, sem apresentar enunciados inventados como previsao.

### UX orientada ao estudante

- Linguagem trocada de "exercicios" para "perguntas reais" onde isso evita ambiguidade.
- Ranking de temas agora mostra explicacao, nao apenas percentagem.
- Pagina de perguntas reais tem filtros por tema, ano, avaliacao, estado da resolucao, imagem e confianca baixa.
- Filtros completados com semestre, respondidas/nao respondidas, imagem e confianca baixa.
- Cada pergunta real pode guardar resolucao do aluno.
- Cada pergunta real permite corrigir manualmente a materia/tema usada no ranking.
- Pagina de documentos analisados mostra origem, ano, tipo, numero de perguntas, temas e perguntas a rever.
- Cada tema provavel tem acao para ver perguntas reais associadas e gerar um exemplo provavel desse tema.
- Plano de estudo estruturado com prioridade, ordem sugerida, proximos passos, metas semanais, temas fortes e temas ausentes.
- Funcoes antigas de historico por "exercicios" foram removidas para evitar regressao de linguagem e fluxo.
- Modo de selecao manual:
  - renderiza PDF/imagem para o aluno desenhar caixas;
  - cada caixa de pergunta recebe numeracao sequencial;
  - anexos podem ser marcados e ficam ligados a ultima pergunta;
  - permite desfazer a ultima selecao, limpar selecoes e guardar perguntas selecionadas;
  - recorta as areas selecionadas e usa OCR no recorte da pergunta.
- Fluxo de importacao simplificado:
  - ao escolher um documento, abre logo a selecao manual;
  - a opcao de analise automatica deixou de estar disponivel na interface;
  - tipos de avaliacao reduzidos a Frequencia 1, Frequencia 2, Exame e Recurso.
- Fluxo de selecao manual afinado:
  - removida a area para colar perguntas manualmente;
  - removido o botao antigo de analisar texto colado;
  - anexos passaram a ser anexos gerais do documento/teste, nao anexos da ultima pergunta;
  - guardar perguntas selecionadas continua a guardar o recorte da imagem mesmo quando o OCR falha.
- Interface limpa:
  - removidos campos de notas de estudo e estrutura sugerida de resposta;
  - removida apresentacao de conceitos/tokens frequentes;
  - removida atribuicao automatica da data atual quando falta data/ano do teste.

### Documentacao

- `README.md` criado e atualizado.
- Planeamento consolidado neste documento (`IMPLEMENTACOES.md`).

## Futuras

### Decisao de produto (confirmada)

Modelo manual:

1. O aluno importa o documento.
2. O aluno seleciona as perguntas reais por caixas.
3. O aluno marca anexos/imagens ligados a cada pergunta.
4. O aluno define ou corrige a materia/tema quando necessario.

### Upgrade do motor de classificacao e previsao (feito parcialmente)

Implementado agora no motor atual:

- Pre-processamento mais robusto:
  - normalizacao,
  - limpeza de ruido,
  - filtragem de stopwords e termos genericos,
  - normalizacao leve de variacoes morfologicas.
- Extracao de n-grams (uni, bi e trigramas) com prioridade a expressoes compostas.
- Scoring hibrido por tema:
  - keywords fortes,
  - keywords medias,
  - sinonimos,
  - subtemas,
  - verbos de acao,
  - similaridade aproximada.
- Prevencao melhor de temas duplicados:
  - a app deixou de criar temas novos a partir de palavras soltas;
  - novos temas entram por escolha manual do aluno.
- Separacao mais clara entre:
  - conteudo tematico (identificacao do tema),
  - verbos de acao (tipo de pergunta).
- Enriquecimento da previsao:
  - inclui metrica de ausencia em anos (`absenceYears`).

### Select Tool para verificacao manual

- Aprovar bloco.
- Rejeitar bloco.
- Dividir bloco.
- Juntar blocos.
- Reatribuir imagem para outra questao.
- Editar texto OCR antes de guardar.
- Guardar apenas blocos aprovados.

### Solucoes dos alunos (texto + imagem)

Requisito confirmado:

- alunos podem enviar solucao em texto;
- alunos podem enviar solucao em imagem;
- fluxo de exercicios deve funcionar por documentos/imagens importados (sem exigir escrita manual dos enunciados).

Implementar:

1. Campo `solution_images` em `exercises` (ou tabela dedicada de solucoes por versao).
2. Bucket `exercise-solutions` no Supabase Storage.
3. Upload de imagens de solucao com metadata.
4. UI no exercicio para anexar/remover imagens da solucao.
5. Galeria de imagens da solucao no historico.

### Qualidade do parser e OCR

- Melhorar casos de multi-coluna e tabelas em PDF.
- Medir confianca por bloco (alta/media/baixa).
- Guardar estatisticas de correcao manual para evoluir heuristicas.

### Metas de qualidade

- >= 85% blocos corretos sem intervencao manual.
- <= 10% casos a dividir/juntar.
- >= 95% imagens associadas corretamente apos validacao final.
