// Proxy server-side do painel: valida a senha e busca os registros na API Python
// mantendo a chave de acesso fora do navegador.
export async function POST(req) {
  let senha = "";
  try {
    ({ senha } = await req.json());
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!process.env.PAINEL_SENHA || senha !== process.env.PAINEL_SENHA) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const base = (process.env.OUVIDORIA_API_URL || "").replace(/\/$/, "");
  const chave = process.env.OUVIDORIA_ACCESS_KEY;
  if (!base || !chave) {
    return Response.json(
      { error: "Painel não configurado (OUVIDORIA_API_URL / OUVIDORIA_ACCESS_KEY)." },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch(`${base}/api/registros`, {
      headers: { "X-Access-Key": chave },
      cache: "no-store",
    });
    if (!resp.ok) {
      return Response.json(
        { error: `A API respondeu ${resp.status}.` },
        { status: 502 }
      );
    }
    const dados = await resp.json();
    return Response.json({ dados });
  } catch {
    return Response.json({ error: "Não foi possível falar com a API." }, { status: 502 });
  }
}
