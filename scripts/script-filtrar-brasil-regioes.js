const fs = require("fs");
const path = require("path");

// Caminhos
const inputPath = path.join(
  __dirname,
  "../public/dados/brazil-states.geojson"
);

const outputPath = path.join(
  __dirname,
  "../public/dados/brasil-regioes-simplified.geojson"
);

// Mapeamento: estado -> região
const ESTADO_PARA_REGIAO = {
  Acre: "Norte",
  Alagoas: "Nordeste",
  Amapá: "Norte",
  Amazonas: "Norte",
  Bahia: "Nordeste",
  Ceará: "Nordeste",
  "Distrito Federal": "Centro-Oeste",
  "Espírito Santo": "Sudeste",
  Goiás: "Centro-Oeste",
  Maranhão: "Nordeste",
  "Mato Grosso": "Centro-Oeste",
  "Mato Grosso do Sul": "Centro-Oeste",
  "Minas Gerais": "Sudeste",
  Pará: "Norte",
  Paraíba: "Nordeste",
  Paraná: "Sul",
  Pernambuco: "Nordeste",
  Piauí: "Nordeste",
  "Rio de Janeiro": "Sudeste",
  "Rio Grande do Norte": "Nordeste",
  "Rio Grande do Sul": "Sul",
  Rondônia: "Norte",
  Roraima: "Norte",
  "Santa Catarina": "Sul",
  "São Paulo": "Sudeste",
  Sergipe: "Nordeste",
  Tocantins: "Norte",
};

// Ordem final desejada
const ORDEM_REGIOES = [
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
];

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getStateName(feature) {
  return (
    feature?.properties?.name ||
    feature?.properties?.nome ||
    feature?.properties?.NM_UF ||
    feature?.properties?.UF ||
    feature?.properties?.estado ||
    feature?.properties?.NAME ||
    ""
  );
}

// Converte Polygon ou MultiPolygon em uma lista única de polígonos,
// para no final montar uma geometria MultiPolygon por região.
function extractPolygons(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return [];
}

try {
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const features = geojson.features || [];

  const regioesMap = new Map();

  for (const nomeRegiao of ORDEM_REGIOES) {
    regioesMap.set(nomeRegiao, []);
  }

  const estadosEncontrados = [];
  const estadosSemRegiao = [];

  for (const feature of features) {
    const estadoNome = getStateName(feature);
    const regiao = ESTADO_PARA_REGIAO[estadoNome];

    if (!regiao) {
      estadosSemRegiao.push(estadoNome || "(sem nome)");
      continue;
    }

    const polygons = extractPolygons(feature.geometry);

    if (polygons.length === 0) {
      console.log(`⚠️ Estado sem geometria compatível: ${estadoNome}`);
      continue;
    }

    regioesMap.get(regiao).push(...polygons);
    estadosEncontrados.push(estadoNome);
  }

  const regionFeatures = ORDEM_REGIOES.map((regiao) => {
    const multipolygonCoordinates = regioesMap.get(regiao) || [];

    return {
      type: "Feature",
      properties: {
        name: regiao,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: multipolygonCoordinates,
      },
    };
  });

  const regioesEncontradas = regionFeatures
    .filter(
      (feature) =>
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length > 0
    )
    .map((feature) => feature.properties.name);

  const regioesFaltantes = ORDEM_REGIOES.filter(
    (regiao) => !regioesEncontradas.includes(regiao)
  );

  const output = {
    type: "FeatureCollection",
    features: regionFeatures,
  };

  const jsonFinal = JSON.stringify(output, null, 2);

  fs.writeFileSync(outputPath, jsonFinal, "utf8");

  const savedContent = fs.readFileSync(outputPath, "utf8");

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🧭 Total de regiões:", regionFeatures.length);
  console.log("📦 Tamanho em bytes:", Buffer.byteLength(savedContent, "utf8"));
  console.log("📌 Regiões encontradas:", regioesEncontradas);
  console.log("📌 Estados usados para montar as regiões:", estadosEncontrados);

  if (regioesFaltantes.length > 0) {
    console.log("⚠️ Regiões sem geometria:", regioesFaltantes);
  } else {
    console.log("✅ Todas as regiões foram montadas com geometria.");
  }

  if (estadosSemRegiao.length > 0) {
    console.log("⚠️ Estados sem região mapeada:", estadosSemRegiao);
  } else {
    console.log("✅ Todos os estados encontrados foram mapeados em uma região.");
  }

  console.log("🔎 Primeiros 200 caracteres do arquivo salvo:");
  console.log(savedContent.slice(0, 200));

  console.log(
    "🔎 Conferência geral de nomes no GeoJSON de estados:",
    features.map(getStateName)
  );
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}