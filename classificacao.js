// =========================================================
// CLASSIFICAÇÃO COMPLETA
// =========================================================

async function carregarTabela() {
  const tabela = document.getElementById("tabelaCompleta");

  const temporada = await getTemporadaAtiva();
  if (!temporada) {
    tabela.innerHTML = `<tr><td colspan="10">Nenhuma temporada ativa.</td></tr>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("times")
    .select("*")
    .eq("temporada_id", temporada.id)
    .order("pontos", { ascending: false })
    .order("saldo", { ascending: false })
    .order("gols_pro", { ascending: false });

  if (error) {
    tabela.innerHTML = `<tr><td colspan="10">Erro ao carregar tabela.</td></tr>`;
    console.error(error);
    return;
  }

  tabela.innerHTML = (data || []).map((time, index) => {
    let classeZona = "";
    if (index < 4) classeZona = "zona-g4";
    else if (index === 4) classeZona = "zona-pre-libertadores";
    else if (index >= 5 && index <= 11) classeZona = "zona-sul-americana";
    else if (index >= (data.length - 4)) classeZona = "zona-rebaixamento";

    const aproveitamento = time.jogos > 0
      ? Math.round((time.pontos / (time.jogos * 3)) * 100)
      : 0;

    return `
      <tr class="${classeZona}">
        <td>${index + 1}</td>
        <td>${escudoHtml(time).replace('class="escudo"', 'class="escudo" style="width:22px;height:22px;"')} ${time.nome}</td>
        <td>${time.pontos}</td>
        <td>${time.jogos}</td>
        <td>${time.vitorias}</td>
        <td>${time.empates}</td>
        <td>${time.derrotas}</td>
        <td>${time.gols_pro}</td>
        <td>${time.gols_contra}</td>
        <td>${time.saldo}</td>
        <td>${aproveitamento}%</td>
      </tr>
    `;
  }).join("");
}

carregarTabela();
