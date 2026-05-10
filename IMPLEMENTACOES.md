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
- Deteccao e classificacao de questoes por tema, tipo, dificuldade e keywords.

### Importacao e analise

- Importacao de documentos (`pdf`, `docx`, `txt`, `md`, imagens).
- OCR com `tesseract.js` para imagens e PDFs digitalizados.
- Separacao automatica de questoes com heuristicas de marcadores e espacos visuais grandes.
- Deteccao de tipo de documento (teste/exame, caderno, apontamentos).
- Deteccao de duplicados por assinatura.
- Metadata por pergunta:
  - confianca da separacao (`Alta`, `Media`, `Baixa`);
  - notas de analise;
  - numero de pergunta;
  - estrutura sugerida de resposta.

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
- Templates de pergunta por tipo (definicao, comparacao, calculo, interpretacao, explicacao).

### UX orientada ao estudante

- Linguagem trocada de "exercicios" para "perguntas reais" onde isso evita ambiguidade.
- Ranking de temas agora mostra explicacao, nao apenas percentagem.
- Pagina de perguntas reais tem filtros por tema, ano, avaliacao, estado da resolucao, imagem e confianca baixa.
- Pagina de documentos analisados mostra origem, ano, tipo, numero de perguntas, temas e perguntas a rever.
- Plano de estudo estruturado com prioridade, ordem sugerida, proximos passos, metas semanais, temas fortes e temas ausentes.

### Documentacao

- `README.md` criado e atualizado.
- Planeamento consolidado neste documento (`IMPLEMENTACOES.md`).

## Futuras

### Decisao de produto (confirmada)

Modelo hibrido:

1. A app assinala automaticamente as questoes.
2. O aluno faz verificacao final manual.
3. O aluno corrige apenas excecoes (dividir/juntar/rejeitar/reatribuir imagem).

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
  - antes de criar tema novo, compara similaridade global com temas existentes.
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
