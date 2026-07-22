# Brasileirão PES 2026 — App do campeonato

Site estático (HTML/CSS/JS puro) + Supabase, no estilo "Copa Fácil": moderno,
minimalista, com painel admin protegido por login real.

## 1. Criar o novo Supabase

1. Crie um projeto novo em https://supabase.com.
2. Vá em **SQL Editor** e rode, **nesta ordem**, os 3 arquivos da pasta `sql/`:
   - `01_schema.sql` → cria as tabelas, triggers e funções.
   - `02_rls.sql` → ativa a segurança (RLS): leitura pública, escrita só admin.
   - `03_seed.sql` → cria a temporada 2026 e os 20 times iniciais.
3. Em **Project Settings > API**, copie:
   - **Project URL**
   - **anon / public key**
4. Cole essas duas informações no arquivo `supabase-config.js` do site,
   nas variáveis `SUPABASE_URL` e `SUPABASE_KEY`.

## 2. Criar seu usuário admin

1. No painel do Supabase, vá em **Authentication > Users > Add user**
   e crie seu usuário (e-mail + senha) — ou crie uma tela de cadastro,
   se preferir (não incluída aqui por segurança, mas pode pedir).
2. Copie o **UUID** desse usuário.
3. No **SQL Editor**, rode:
   ```sql
   insert into admins (user_id, nome)
   values ('COLE_O_UUID_AQUI', 'Seu nome');
   ```
4. Pronto — esse login agora tem permissão de escrita no `admin.html`.

## 3. Subir no Vercel / GitHub

1. Suba esta pasta (`site/`) para um repositório no GitHub.
2. Importe o repositório no Vercel como projeto estático (sem build step —
   é HTML puro, o Vercel serve direto).
3. Configure o domínio como preferir.

## Estrutura do banco

- **temporadas** — permite ter mais de um campeonato/ano; só uma fica "ativa".
- **times** — nome, sigla, escudo (URL), estatísticas (pontos, jogos, saldo...).
- **jogos** — vinculados por `time_casa_id`/`time_fora_id` (chave estrangeira
  de verdade, não mais por nome como no site antigo).
- **jogadores** — vinculados a um time.
- **gols_jogo** — eventos de gol de uma partida específica.
- **noticias** — para a aba de notícias.
- **admins** — quem tem permissão de escrita (ligado ao Supabase Auth).

## Fluxo de "computar jogo"

Quando você marca um jogo como **Encerrado** no admin, o sistema soma
automaticamente pontos/vitórias/saldo aos dois times na tabela de
classificação (`computado = true`). Se precisar corrigir um placar já
computado, use o botão **Descomputar** antes de editar — isso desfaz o
efeito na tabela para não duplicar contagem.

## Páginas

| Arquivo               | Descrição                                  |
|------------------------|---------------------------------------------|
| `index.html`           | Início — resumo, próximos jogos, top 5      |
| `jogos.html` / `jogo.html` | Lista de jogos por rodada + detalhes    |
| `classificacao.html`  | Tabela completa com G-4 e Z-4 destacados    |
| `times.html` / `time.html` | Lista de times + elenco de cada um      |
| `artilharia.html`      | Ranking de artilheiros                      |
| `noticias.html`        | Notícias publicadas pelo admin              |
| `admin.html`           | Painel de gestão (login obrigatório)        |
