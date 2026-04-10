const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Caminhos
const inputPath = path.join(
  __dirname,
  "../public/dados/brazil-states.geojson"
);

const tempPath = path.join(
  os.tmpdir(),
  "brasil-estados-filtrados.geojson"
);

const outputPath = path.join(
  __dirname,
  "../public/dados/brasil-estados-simplified.geojson"
);

// Estados do Brasil com aliases aceitos
const BRASIL_ESTADOS_ALIASES = {
  Acre: ["Acre"],
  Alagoas: ["Alagoas"],
  Amapa: ["Amapá", "Amapa"],
  Amazonas: ["Amazonas"],
  Bahia: ["Bahia"],
  Ceara: ["Ceará", "Ceara"],
  "Distrito Federal": ["Distrito Federal", "DF"],
  "Espirito Santo": ["Espírito Santo", "Espirito Santo"],
  Goias: ["Goiás", "Goias"],
  Maranhao: ["Maranhão", "Maranhao"],
  "Mato Grosso": ["Mato Grosso"],
  "Mato Grosso do Sul": ["Mato Grosso do Sul"],
  "Minas Gerais": ["Minas Gerais"],
  Para: ["Pará", "Para"],
  Paraiba: ["Paraíba", "Paraiba"],
  Parana: ["Paraná", "Parana"],
  Pernambuco: ["Pernambuco"],
  Piaui: ["Piauí", "Piaui"],
  "Rio de Janeiro": ["Rio de Janeiro"],
  "Rio Grande do Norte": ["Rio Grande do Norte"],
  "Rio Grande do Sul": ["Rio Grande do Sul"],
  Rondonia: ["Rondônia", "Rondonia"],
  Roraima: ["Roraima"],
  "Santa Catarina": ["Santa Catarina"],
  "Sao Paulo": ["São Paulo", "Sao Paulo"],
  Sergipe: ["Sergipe"],
  Tocantins: ["Tocantins"],
};

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

function getCanonicalStateName(foundName) {
  const nomeNormalizado = normalizeName(foundName);

  for (const [canonico, aliases] of Object.entries(BRASIL_ESTADOS_ALIASES)) {
    if (aliases.some((alias) => normalizeName(alias) === nomeNormalizado)) {
      return aliases[0];
    }
  }

  return foundName;
}

try {
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const aliasesNormalizados = new Set(
    Object.values(BRASIL_ESTADOS_ALIASES).flat().map(normalizeName)
  );

  const allNames = (geojson.features || []).map(getStateName);

  const filteredFeatures = (geojson.features || [])
    .filter((feature) => {
      const nome = getStateName(feature);
      return aliasesNormalizados.has(normalizeName(nome));
    })
    .map((feature) => {
      const nomeOriginal = getStateName(feature);
      const nomeCanonico = getCanonicalStateName(nomeOriginal);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          name: nomeCanonico,
        },
      };
    });

  const foundNames = filteredFeatures.map((f) => getStateName(f));

  const missingStates = Object.entries(BRASIL_ESTADOS_ALIASES)
    .filter(([, aliases]) => {
      return !aliases.some((alias) =>
        foundNames.some(
          (found) => normalizeName(found) === normalizeName(alias)
        )
      );
    })
    .map(([estadoCanonico]) => estadoCanonico);

  const tempGeoJSON = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  fs.writeFileSync(tempPath, JSON.stringify(tempGeoJSON), "utf8");

  console.log("🔧 Simplificando geometria dos estados...");

  execSync(
    `npx mapshaper "${tempPath}" -simplify weighted 6% keep-shapes -clean -o format=geojson "${outputPath}"`,
    { stdio: "inherit" }
  );

  const savedContent = fs.readFileSync(outputPath, "utf8");
  const savedGeoJSON = JSON.parse(savedContent);

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🗺️ Total de estados:", savedGeoJSON.features.length);
  console.log("📦 Tamanho em bytes:", Buffer.byteLength(savedContent, "utf8"));
  console.log(
    "📌 Estados encontrados:",
    savedGeoJSON.features.map((f) => f?.properties?.name || "(sem nome)")
  );

  if (missingStates.length > 0) {
    console.log("⚠️ Estados NÃO encontrados no geojson:", missingStates);
  } else {
    console.log("✅ Todos os estados da lista foram encontrados.");
  }

  console.log("🔎 Primeiros 200 caracteres do arquivo salvo:");
  console.log(savedContent.slice(0, 200));

  console.log("🔎 Conferência geral de nomes no GeoJSON original:", allNames);
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}