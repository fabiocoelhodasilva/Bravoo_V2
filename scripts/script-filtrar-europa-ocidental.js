const fs = require("fs");
const path = require("path");

// Caminhos
const inputPath = path.join(__dirname, "../public/dados/countries.geojson");
const outputPath = path.join(
  __dirname,
  "../public/dados/europa-ocidental-simplified.geojson"
);

// Países da Europa Ocidental
const EUROPA_OCIDENTAL = new Set([
  "Portugal",
  "Spain",
  "France",
  "Italy",
  "Germany",
  "England", // importante no seu geojson
]);

// Função para pegar nome do país
function getCountryName(feature) {
  return feature?.properties?.name || feature?.properties?.ADMIN || "";
}

// 🔥 AJUSTE PRINCIPAL: usar 4 casas decimais
function simplifyCoordinates(coords, decimals = 4) {
  if (!Array.isArray(coords)) return coords;

  // caso base: ponto [lng, lat]
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    return [
      Number(coords[0].toFixed(decimals)),
      Number(coords[1].toFixed(decimals)),
    ];
  }

  return coords.map((item) => simplifyCoordinates(item, decimals));
}

// Simplifica um país inteiro
function simplifyFeature(feature) {
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: simplifyCoordinates(feature.geometry.coordinates, 4), // 🔥 aqui também
    },
  };
}

try {
  // Ler arquivo original
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const allNames = (geojson.features || []).map(getCountryName);

  // Filtrar países
  const filteredFeatures = (geojson.features || [])
    .filter((feature) => EUROPA_OCIDENTAL.has(getCountryName(feature)))
    .map(simplifyFeature);

  // Novo arquivo
  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  // Salvar
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🌍 Total de países:", filteredFeatures.length);

  console.log(
    "📌 Países encontrados:",
    filteredFeatures.map((f) => getCountryName(f))
  );

  console.log(
    "🔎 Conferência de nomes no GeoJSON:",
    allNames.filter((name) =>
      /portugal|spain|france|italy|germany|england/i.test(name)
    )
  );
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}