# Super Pro Performance — kit para gerar o APK

App de vendas, metas e reconhecimento para os tablets das unidades.
Este kit gera o **APK de teste** automaticamente pelo GitHub (não precisa instalar nada no computador).

**Desenvolvedor:** William R. Pedroso · contato (51) 9896-4590

## Como gerar o APK (passo a passo)

1. No GitHub, clique em **New repository** e crie um repositório (pode ser privado), por exemplo `super-pro-performance`.
2. Envie **todo o conteúdo desta pasta** para o repositório (botão *Add file → Upload files*; arraste os arquivos e pastas, inclusive a pasta oculta `.github`).
   - Dica: se a pasta `.github` não subir pelo navegador, envie com o GitHub Desktop ou pelo Git.
3. Abra a aba **Actions**. Se o GitHub pedir, clique em *I understand my workflows, go ahead and enable them*.
4. Escolha o fluxo **Gerar APK** e clique em **Run workflow**. A compilação leva uns 5 a 10 minutos.
5. Quando ficar verde, abra a execução e baixe, em **Artifacts**, o arquivo `super-pro-performance-apk` (um .zip com o `app-debug.apk`).
6. Copie o `app-debug.apk` para o tablet e instale (permita "instalar apps de fontes desconhecidas" quando o Android pedir).

Se o fluxo ficar vermelho, abra o passo que falhou e envie a mensagem para quem está ajudando no projeto.

## O que tem no kit

| Pasta / arquivo | Para que serve |
|---|---|
| `www/index.html` | o app completo (telas, regras de meta, escala, certificado, corrida) |
| `www/db-local.js` | guarda os dados no próprio tablet (versão 1) |
| `capacitor.config.json` | nome do app e identificação do pacote (`com.superpro.performance`) |
| `package.json` | lista de componentes usados na compilação |
| `assets/` | ícone Gestão PRO e tela de abertura (geram os ícones do Android) |
| `.github/workflows/android-apk.yml` | receita que compila o APK no GitHub |
| `supabase/schema.sql` | esquema do banco central (para a próxima etapa) |

## Limites desta versão 1 do APK

- **Dados só no tablet:** cada tablet guarda os próprios vendedores, vendas e senhas. O que a gestão cadastra em um tablet **não aparece** nos outros. Serve para testar telas e regras em um tablet (por exemplo, o tablet da gestão e dos vendedores juntos). Para vários tablets verem o mesmo ranking é preciso ligar o Supabase (próxima etapa).
- **Impressão e PDF:** os botões de imprimir / salvar PDF dependem do navegador e podem não funcionar dentro do APK.
- **APK de teste:** é assinado com a chave de teste do Android. Para distribuir oficialmente, é preciso assinar com uma chave própria.
- **Segurança:** os logins da gestão e dos vendedores são conferidos dentro do próprio app. Servem para o piloto interno; o login seguro vem com o Supabase.
- Os acessos iniciais da gestão são os combinados na conversa; troque-os pelo menu *Mais → Senha* no primeiro uso.

## Atualizar o app

Troque o arquivo `www/index.html` no repositório e rode o fluxo **Gerar APK** de novo. O novo APK instala por cima do antigo; os dados do tablet são mantidos.

## Próxima etapa: ligar o Supabase

1. Criar o projeto e rodar `supabase/schema.sql` no SQL Editor.
2. Criar os usuários de gestão e vendedores.
3. Trocar `www/db-local.js` por um adaptador do Supabase e usar a URL e a chave pública do projeto. Nunca coloque a chave *service_role* no app.
