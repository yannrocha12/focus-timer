# Foco — Timer Pomodoro

Timer de produtividade estilo Pomodoro, 100% front-end (HTML/CSS/JS puro, sem dependências).

## Como abrir

Basta abrir `index.html` no navegador — não precisa de servidor nem instalação.

Se preferir servir localmente (ex.: para evitar restrições de `file://` em alguns navegores):

```bash
npx serve .
```

## O que ele faz

- Três modos: **Foco** (25 min), **Pausa curta** (5 min), **Pausa longa** (15 min) — cada duração é configurável nos campos abaixo do timer.
- Anel de progresso animado em SVG mostrando quanto falta do ciclo atual.
- Ao terminar um ciclo de foco, toca um som suave (gerado via Web Audio API, sem arquivo externo) e avança automaticamente: pausa curta nos 3 primeiros ciclos, pausa longa a cada 4º ciclo — depois volta pro foco.
- Histórico de sessões de foco concluídas **hoje**, salvo em `localStorage` (some ao trocar de dia ou ao limpar manualmente).
- Sem build, sem dependências externas — um único projeto estático.

## Arquivos

- `index.html` — estrutura da página
- `style.css` — visual (tema escuro com gradiente, cores por modo)
- `script.js` — lógica do timer, histórico e som
