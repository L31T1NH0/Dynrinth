# Design improvements - 2026-06-15

Objetivo avaliado: baixar mods da forma mais facil possivel.

Base usada: design wiki local (`/home/leite/design-wiki/`), principalmente hierarquia antes de beleza, clareza antes de novidade, tarefa define interface, feedback reduz ansiedade, complexidade progressiva e defaults como design invisivel.

## Como voltar ao estado anterior

Este levantamento foi aplicado em arquivos versionados. Para voltar tudo como era antes desta rodada, use o controle de versao:

```bash
git diff
git restore app/page.tsx app/globals.css components/CustomSelect.tsx locales/en.ts locales/pt.ts locales/es.ts locales/de.ts locales/tr.ts docs/design-improvements-2026-06-15.md
```

Se quiser reverter apenas uma melhoria, use as secoes abaixo para localizar o trecho correspondente.

## 1. Busca antes dos filtros no mobile

Antes: o mobile abria com logo, abas, links e todos os filtros em sequencia antes da busca. No codigo, isso ficava dentro do header mobile em `app/page.tsx`, com a linha de filtros sempre renderizada logo apos as abas.

Codigo anterior, em resumo:

```tsx
<div className="md:hidden border-b border-line-subtle shrink-0">
  <div className="flex items-center gap-5 px-5 py-2 overflow-x-auto scrollbar-none">
    ...
  </div>
  <div className="flex items-center gap-3 px-5 py-2 flex-wrap">
    <CustomSelect value={filters.source} ... />
    <CustomSelect value={filters.version} ... />
    <PillToggle ... />
  </div>
</div>
```

Depois: os filtros mobile entram em um painel progressivo controlado por estado (`mobileFiltersOpen`). A busca aparece como bloco principal logo depois do header compacto, e o botao `Filtros` abre o painel quando necessario.

Razao: para o comportamento-alvo "achar e baixar", a primeira acao deve ser pesquisar. Filtros sao importantes, mas a maioria dos usuarios pode comecar com os defaults e ajustar quando perceber necessidade.

Validacao sugerida: em mobile, medir se usuarios iniciantes conseguem fazer a primeira busca sem perguntar onde clicar.

## 2. Campo de busca mais dominante

Antes: o campo de busca tinha `h-7`, texto `text-xs` e o botao era um quadrado pequeno de `w-7 h-7`.

Codigo anterior:

```tsx
className="w-full h-7 pl-8 pr-2 rounded text-ink-primary text-xs ..."
className="h-7 w-7 rounded-md bg-brand ..."
```

Depois: o input passou para `h-9`, `text-sm`, espacamento maior e botao de busca `h-9 w-9`.

Razao: a busca e o principal gatilho de acao. A hierarquia visual agora aponta mais claramente para o primeiro passo do fluxo.

Validacao sugerida: comparar tempo ate a primeira pesquisa antes/depois.

## 3. Copy da busca mais concreta

Antes: o placeholder dizia "Search items..." / "Pesquisar itens...", que e generico.

Codigo anterior:

```ts
placeholder: 'Search items...'
placeholder: 'Pesquisar itens...'
```

Depois: o placeholder virou "Search mods, shaders, or packs..." / "Buscar mods, shaders ou packs...".

Razao: texto concreto reduz interpretacao desnecessaria e confirma que o usuario esta no lugar certo para a tarefa.

Validacao sugerida: observar se usuarios entendem que shaders e resource packs tambem podem ser buscados.

## 4. Download como acao primaria da fila

Antes: Exportar, Importar, Compartilhar e Dynrinth apareciam antes do botao de download no rodape da fila.

Codigo anterior:

```tsx
<div className="flex gap-2 mb-2.5">
  <button>{t.footer.export}</button>
  <button>{t.footer.import}</button>
  <button>{t.footer.share}</button>
</div>
...
<button>{t.footer.downloadFile}</button>
```

Depois: o botao de download foi promovido para o topo do rodape e aumentado para `h-11`. As outras acoes continuam visiveis em uma toolbar secundaria logo abaixo.

Razao: no momento da decisao final, a interface deve reforcar a acao que conclui o objetivo. Exportar/importar/compartilhar continuam acessiveis para usuarios experientes, mas sem disputar o mesmo peso visual do download.

Validacao sugerida: medir cliques equivocados em compartilhar/exportar e tempo entre item pronto e download.

## 5. Acoes secundarias preservadas para usuarios experientes

Antes: acoes secundarias competiam visualmente com o download, todas aparecendo antes da acao principal.

Depois: `Exportar`, `Importar`, `Compartilhar` e `Dynrinth` continuam visiveis, mas abaixo do botao de download.

Razao: facilidade nao deve atrapalhar usabilidade. O iniciante ve primeiro a acao de baixar; o usuario experiente ainda tem import/export/share sem precisar abrir menu.

Risco: em filas muito pequenas, o rodape continua denso. A densidade aqui foi mantida de proposito porque o produto tambem atende power users.

Validacao sugerida: observar usuarios iniciantes e experientes no mesmo fluxo; a melhora so vale se iniciantes acharem o download mais rapido sem aumentar o tempo de usuarios recorrentes.

## 6. Feedback e acessibilidade do select customizado

Antes: `CustomSelect` era visualmente um select, mas nao expunha estado semantico como `aria-expanded`, `aria-controls`, `role=listbox` e `role=option`.

Codigo anterior:

```tsx
<button onClick={() => setIsOpen(!isOpen)}>
...
<div className="absolute ...">
  <button ...>{opt.label}</button>
</div>
```

Depois: o controle declara `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `role="listbox"` e `role="option"`, alem de fechar/abrir por teclado basico.

Razao: padroes familiares precisam funcionar por teclado e tecnologia assistiva. Isso tambem melhora o uso rapido por usuarios recorrentes.

Validacao sugerida: testar Tab, Enter, Espaco e Escape nos selects.

## 7. Reduced motion

Antes: resultados, fila, spinners e view transitions tinham animacoes sem alternativa global para `prefers-reduced-motion`.

Codigo anterior:

```css
@keyframes fadeIn { ... }
@keyframes slideIn { ... }
::view-transition-new(results-list) { animation: 0.2s ease-out both fadeIn; }
```

Depois: `app/globals.css` tem um bloco `@media (prefers-reduced-motion: reduce)` que reduz duracao de animacoes e transicoes.

Razao: motion deve comunicar estado sem obrigar todos os usuarios a assistir animacoes. Isso e uma exigencia de conforto e acessibilidade.

Validacao sugerida: ativar reduced motion no sistema e conferir que a tela continua funcional.

## 8. Localizacao do link "Get the mod"

Antes: havia texto fixo em ingles dentro da UI:

```tsx
Get the mod ↗
```

Depois: o texto usa `t.minecraft.getMod` nos arquivos de locale.

Razao: a interface ja e internacionalizada; texto hardcoded quebra consistencia e confianca.

Validacao sugerida: alternar locale e conferir a area do codigo Dynrinth.

## 9. Ajustes tecnicos para conseguir testar

Antes: `npm install` falhava porque `devDependencies.postcss` estava em `^8.5.12`, mas `overrides.postcss` fixava `8.5.10`.

Depois: `package.json` e `package-lock.json` foram alinhados para `postcss: 8.5.10`, o mesmo valor do override.

Razao: sem instalar dependencias, nao era possivel rodar lint, build ou dev server.

Antes: `app/api/scrapers/route.ts` detectava automaticamente `.venv-scrapers/bin/python` e `.venv/bin/python` com `existsSync`.

Codigo anterior:

```ts
const python = process.env.SCRAPER_PYTHON
  ?? (existsSync(path.join(process.cwd(), '.venv-scrapers', 'bin', 'python'))
    ? path.join(process.cwd(), '.venv-scrapers', 'bin', 'python')
    : existsSync(path.join(process.cwd(), '.venv', 'bin', 'python'))
      ? path.join(process.cwd(), '.venv', 'bin', 'python')
      : 'python3');
```

Depois: a rota usa `SCRAPER_PYTHON` quando existir, senao `python3`.

Razao: o Turbopack tentava rastrear o symlink local de `.venv-scrapers/bin/python` durante `next build` e quebrava o build antes de compilar a UI. Para usar uma venv especifica, defina `SCRAPER_PYTHON`.

## 10. Alinhamento da linha superior

Antes: a sidebar usava `h-12`, mas a barra de busca tinha altura resultante maior por causa de `h-9` somado a `py-2.5`, e o cabecalho da fila usava `py-3.5`. Isso criava um degrau visual no divisor horizontal superior.

Codigo anterior, em resumo:

```tsx
<Link className="... h-12" />
<div className="... py-2.5 border-b ...">
  <input className="h-9 ..." />
</div>
<div className="... py-3.5 border-b ...">
```

Depois: no desktop, a barra de busca e o cabecalho da fila tambem usam `h-12`; o input fica `md:h-8` para caber dentro da mesma linha. No mobile, o input continua maior (`h-9`).

Razao: grid e alinhamento reduzem atrito visual. A linha superior deve parecer uma unica regua estrutural entre sidebar, busca e fila.

## Resultado esperado

O app continua com a mesma identidade escura, densa e orientada a power user, mas o caminho padrao ficou mais comportamentalmente alinhado ao objetivo:

1. Buscar primeiro.
2. Ajustar filtros quando necessario.
3. Adicionar itens.
4. Baixar pela acao mais evidente.
5. Usar import/export/share apenas quando o contexto pedir.
