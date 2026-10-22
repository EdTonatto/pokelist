# Pokélist — Pokémon TCG Wishlist

Aplicação client-side para organizar wishlists e objetivos de coleção Pokémon TCG. React + TypeScript + Vite, dados locais em IndexedDB e catálogo público TCGdex.

## Desenvolvimento

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Publicação no GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica a pasta `dist` em cada push para `main`. Em Settings → Pages, selecione **GitHub Actions** como source.

## Dados

As listas ficam no navegador. Use **Dados e backup** para exportar/importar o snapshot JSON (schemaVersion 1). A importação valida o arquivo e pede confirmação antes de substituir os dados atuais. Não há sincronização entre dispositivos.
