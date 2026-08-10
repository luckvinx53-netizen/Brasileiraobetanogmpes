// =========================================================
// FANTASY / "CARTOLA DO BRASILEIRÃO"
// =========================================================
// Este arquivo cuida do CÁLCULO de pontuação dos jogadores reais em
// cada rodada, gravado em fantasy_pontuacoes. A tela de escalação e
// mercado ficam em fantasy.html/fantasy.js (a UI, separada deste).
//
// Pontuação (simplificada, baseada só no que o sistema já registra
// hoje — sem desarme/finalização/defesa, que não existem como evento):
//   Gol marcado           : +8
//   Assistência           : +5
//   Cartão amarelo         : -2
//   Cartão vermelho        : -5
//   Time do jogador venceu : +5
//   Time do jogador empatou: +2
//   Time do jogador perdeu : +0
//   SG (não sofreu gol)     : +5  (só some ao bônus de vitória/empate)
//   Capitão (fantasy_escalacoes.capitao = true): pontos em dobro,
//   aplicado na hora de SOMAR a pontuação do time de fantasy, não aqui
//   — aqui só calculamos a pontuação "crua" do jogador real.
//
// Importante: como não existe escalação titular confiável (ver
// escalacoes_jogo, hoje vazia), o bônus de resultado de time (vitória/
// empate/SG) é aplicado a QUALQUER jogador do elenco que tenha pelo
// menos 1 evento (gol/assistência/cartão) registrado naquele jogo —
// ou seja, só quem "apareceu" na partida ganha o bônus de resultado.
// Jogadores do elenco que não tiveram nenhum evento no jogo não pontuam
// nele (nem positivo nem negativo), simplesmente não entram no cálculo.

const FANTASY_PONTOS = {
  gol: 8,
  assistencia: 5,
  cartaoAmarelo: -2,
  cartaoVermelho: -5,
  vitoria: 5,
  empate: 2,
  derrota: 0,
  sg: 5,
};

// Calcula e grava em fantasy_pontuacoes a pontuação de todos os
// jogadores que tiveram algum evento no jogo informado. Chamada a
// partir de reaplicarEstatisticasEventosDoJogo (utils.js), logo depois
// que gols/assistências/cartões/valor de mercado já foram atualizados
// — ou seja, roda tanto no encerramento manual quanto automático (90').
//
// jogo precisa ter: id, rodada, time_casa_id, time_fora_id,
// placar_casa, placar_fora, temporada_id.
async function fantasyCalcularPontuacaoJogo(jogo) {
  if (!jogo || jogo.rodada == null || !jogo.temporada_id) {
    return { ok: false, error: "Jogo sem rodada ou temporada_id, não é possível pontuar o fantasy." };
  }

  const { data: eventos, error: erroEventos } = await supabaseClient
    .from("eventos_jogo")
    .select("*")
    .eq("jogo_id", jogo.id);

  if (erroEventos) return { ok: false, error: erroEventos };
  if (!eventos || eventos.length === 0) return { ok: true, jogadoresPontuados: 0 };

  const pc = jogo.placar_casa ?? 0;
  const pf = jogo.placar_fora ?? 0;
  const casaSofreuGol = pf > 0;
  const foraSofreuGol = pc > 0;

  const resultadoCasa = pc > pf ? "vitoria" : pc === pf ? "empate" : "derrota";
  const resultadoFora = pf > pc ? "vitoria" : pc === pf ? "empate" : "derrota";

  // Mapa jogador_id -> { pontos, detalhes, timeId }
  const mapa = {};

  function garantirJogador(jogadorId, timeId) {
    if (!mapa[jogadorId]) {
      mapa[jogadorId] = {
        pontos: 0,
        timeId,
        detalhes: { gols: 0, assistencias: 0, cartoes_amarelos: 0, cartoes_vermelhos: 0 },
      };
    }
    return mapa[jogadorId];
  }

  eventos.forEach(e => {
    if ((e.tipo === "Gol" || e.tipo === "Pênalti Marcado") && e.jogador_id) {
      const j = garantirJogador(e.jogador_id, e.time_id);
      j.pontos += FANTASY_PONTOS.gol;
      j.detalhes.gols += 1;
    }
    if (e.tipo === "Gol" && e.jogador_secundario_id) {
      const j = garantirJogador(e.jogador_secundario_id, e.time_id);
      j.pontos += FANTASY_PONTOS.assistencia;
      j.detalhes.assistencias += 1;
    }
    if (e.tipo === "Cartão Amarelo" && e.jogador_id) {
      const j = garantirJogador(e.jogador_id, e.time_id);
      j.pontos += FANTASY_PONTOS.cartaoAmarelo;
      j.detalhes.cartoes_amarelos += 1;
    }
    if (e.tipo === "Cartão Vermelho" && e.jogador_id) {
      const j = garantirJogador(e.jogador_id, e.time_id);
      j.pontos += FANTASY_PONTOS.cartaoVermelho;
      j.detalhes.cartoes_vermelhos += 1;
    }
  });

  // Bônus de resultado de time + SG, só pra quem já apareceu no jogo
  // (tem alguma entrada em mapa).
  Object.keys(mapa).forEach(jogadorId => {
    const j = mapa[jogadorId];
    const eDoTimeCasa = j.timeId === jogo.time_casa_id;
    const eDoTimeFora = j.timeId === jogo.time_fora_id;

    const resultado = eDoTimeCasa ? resultadoCasa : eDoTimeFora ? resultadoFora : null;
    if (resultado) {
      j.pontos += FANTASY_PONTOS[resultado];
      j.detalhes.resultado = resultado;
    }

    const sofreuGol = eDoTimeCasa ? casaSofreuGol : eDoTimeFora ? foraSofreuGol : true;
    if (!sofreuGol) {
      j.pontos += FANTASY_PONTOS.sg;
      j.detalhes.sg = true;
    } else {
      j.detalhes.sg = false;
    }
  });

  const linhas = Object.keys(mapa).map(jogadorId => ({
    temporada_id: jogo.temporada_id,
    rodada: jogo.rodada,
    jogador_id: jogadorId,
    pontos: Math.round(mapa[jogadorId].pontos * 100) / 100,
    detalhes: mapa[jogadorId].detalhes,
    atualizado_em: new Date().toISOString(),
  }));

  const { error: erroUpsert } = await supabaseClient
    .from("fantasy_pontuacoes")
    .upsert(linhas, { onConflict: "temporada_id,rodada,jogador_id" });

  if (erroUpsert) return { ok: false, error: erroUpsert };

  return { ok: true, jogadoresPontuados: linhas.length };
}

// Zera a pontuação fantasy dos jogadores deste jogo/rodada (usado ao
// descomputar um jogo, espelhando desfazerEstatisticasEventosDoJogo).
// Não dá pra "subtrair" pontuação com segurança porque um jogador pode
// ter jogado mais de uma partida na mesma rodada em casos raros de
// remarcação — então preferimos RECALCULAR do zero somando só os jogos
// daquela rodada que continuam computados, em vez de tentar reverter
// matematicamente.
async function fantasyRecalcularPontuacaoRodada(temporadaId, rodada) {
  const { data: jogosDaRodada, error: erroJogos } = await supabaseClient
    .from("jogos")
    .select("*")
    .eq("temporada_id", temporadaId)
    .eq("rodada", rodada)
    .eq("computado", true);

  if (erroJogos) return { ok: false, error: erroJogos };

  // Zera tudo da rodada primeiro, pra jogadores que não têm mais evento
  // nenhum computado nela (ex: jogo foi descomputado) saírem do zero.
  const { error: erroDelete } = await supabaseClient
    .from("fantasy_pontuacoes")
    .delete()
    .eq("temporada_id", temporadaId)
    .eq("rodada", rodada);

  if (erroDelete) return { ok: false, error: erroDelete };

  for (const jogo of jogosDaRodada || []) {
    const resultado = await fantasyCalcularPontuacaoJogo(jogo);
    if (!resultado.ok) return resultado;
  }

  return { ok: true };
}
