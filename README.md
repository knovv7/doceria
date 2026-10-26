# Doce & Cia — pronto para GitHub e Vercel

Site de confeitaria em HTML, CSS e JavaScript, com montagem de bolo em 3D, escolha de docinhos, formulário de encomenda e contatos. Imagens, fontes e Three.js estão incluídos no projeto.

## 1. Enviar para o GitHub

1. Crie um repositório vazio no GitHub, por exemplo `doce-e-cia`.
2. Use **uploading an existing file** ou **Add file → Upload files**.
3. Arraste **o conteúdo desta pasta** para o repositório, mantendo as pastas `assets`, `vendor` e `scripts` com seus arquivos.
4. Confirme em **Commit changes**.

Na raiz do repositório devem aparecer `index.html`, `package.json`, `package-lock.json` e `vercel.json`. Não envie o ZIP como se fosse o site: extraia-o e envie os arquivos. A pasta `dist` é gerada automaticamente e não precisa ser enviada.

## 2. Publicar na Vercel

1. Na Vercel, crie um projeto e importe esse repositório do GitHub.
2. Use a raiz do repositório como **Root Directory**.
3. O arquivo `vercel.json` já define estas opções:

| Configuração | Valor |
| --- | --- |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Clique em **Deploy**. Depois, abra o endereço gerado pela Vercel.

O site não precisa de banco de dados, chave de API ou variáveis de ambiente. O servidor `server.mjs` é apenas para prévia local; a Vercel publica os arquivos estáticos gerados em `dist`.

## Personalizar os dados

Edite `data.js`:

- `whatsapp`: seu número com país e DDD, somente dígitos. Exemplo de formato no Brasil: `55` + DDD + número. O envio final da mensagem é feito pelo visitante.
- `instagram`: seu perfil, sem `@`.
- `pickup`: endereço de retirada.
- `builder`, `sweets` e `ordering`: tamanhos, sabores, preços, quantidades e condições.

O pacote mantém o endereço fictício e os preços demonstrativos da versão aprovada. Sem WhatsApp configurado, é possível copiar a solicitação; o Instagram vazio mostra “Em breve”. Para uma publicação comercial, substitua os dados e ajuste os avisos de demonstração nos textos de `index.html` e `ordering.js`.

## Testar no computador

Com Node.js 22 ou mais recente:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run dev
```

Abra `http://localhost:3000`. Não abra `index.html` diretamente pelo Explorador: a prévia 3D usa módulos JavaScript e deve ser acessada por HTTP.

## Estrutura

```text
assets/           imagens, fontes e licenças das fontes
vendor/three/     biblioteca 3D e licença MIT
scripts/build.mjs geração da pasta pública dist
index.html        página principal
data.js           configurações comerciais
*.css, *.js, *.mjs estilos, animações e funcionalidades
vercel.json       configuração automática de publicação
```

Documentação oficial: [upload de arquivos no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [configuração da Vercel](https://vercel.com/docs/project-configuration/vercel-json), [integração com GitHub](https://vercel.com/docs/git/vercel-for-github).
