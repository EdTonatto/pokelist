# Pokélist

Aplicação web para organizar coleções e listas de troca e venda de cartas Pokémon TCG.

**Acesse:** [edtonatto.github.io/tcg-wishlist](https://edtonatto.github.io/tcg-wishlist/)

## O que dá para fazer

- Criar listas de **Coleção** ou **Troca/Venda**.
- Buscar cartas pelo nome, pelo número impresso ou explorando sets físicos do Pokémon TCG.
- Em listas de coleção, definir quantas cópias deseja e acompanhar quantas já conseguiu.
- Em listas de troca e venda, registrar quantas cópias estão disponíveis e o preço opcional de cada carta.
- Personalizar a capa da lista com uma cor, uma foto ou a imagem de uma carta.
- Ampliar as imagens das cartas e alternar entre os temas claro e escuro.
- Compartilhar listas pelo WhatsApp ou exportar cartas como JPG e PDF em uma grade de até 3 × 3 por página.
- Enviar sugestões ou relatar problemas pelo formulário do site. O GitHub abre uma issue preenchida para revisão e confirmação.
- Exportar e importar um backup JSON.

## Como executar localmente

Requisitos: Node.js 20 ou superior e npm.

```sh
npm install
npm run dev
```

Para gerar a versão de produção e testá-la localmente:

```sh
npm run build
npm run preview
```

## Publicação

O projeto usa GitHub Actions para publicar a pasta `dist` no GitHub Pages sempre que há um push para a branch `main`. Também é possível iniciar o workflow manualmente pela aba **Actions**.

Para configurar o Pages no repositório, abra **Settings → Pages** e escolha **GitHub Actions** como fonte de publicação.

## Dados e privacidade

As listas ficam no IndexedDB do navegador e não são enviadas a um servidor pelo Pokélist. Isso significa que elas não são sincronizadas entre dispositivos. Use **Dados e backup** para exportar um arquivo JSON e guarde uma cópia fora do navegador.

A importação de um backup substitui as listas salvas naquele navegador e pede confirmação antes de concluir.

## Catálogo de cartas

As buscas e os sets são fornecidos pelo [TCGdex](https://tcgdex.net/). A aplicação consulta esse catálogo público diretamente do navegador e não exige uma chave de API.

## Tecnologias

- React e TypeScript
- Vite
- React Router
- IndexedDB, acessado por `idb`
- [TCGdex API](https://tcgdex.net/)

## Sugestões e problemas

O formulário de sugestões prepara uma issue no repositório. Como o site é estático, a pessoa precisa estar conectada ao GitHub e confirmar a publicação da issue; o Pokélist não solicita nem armazena credenciais.
