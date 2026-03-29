const fs = require("fs");
const path = require("path");

// Caminhos
const inputPath = path.join(__dirname, "../public/dados/countries.geojson");
const outputPath = path.join(
  __dirname,
  "../public/dados/europa-ocidental-simplified.geojson"
);

// Países da Europa Ocidental (bloco didático do lado esquerdo do mapa)
const EUROPA_OCIDENTAL = new Set([
  "Portugal",
  "Spain",
  "France",
  "Belgium",
  "Netherlands",
  "Luxembourg",
  "Germany",
  "Switzerland",
  "Austria",
  "Italy",
  "England",
  "Ireland",
]);

function getCountryName(feature) {
  return feature?.properties?.name || feature?.properties?.ADMIN || "";
}

function cloneFeatureWithOriginalCoordinates(feature) {
  return {
    ...feature,
    geometry: feature?.geometry
      ? {
          ...feature.geometry,
          coordinates: feature.geometry.coordinates,
        }
      : feature.geometry,
  };
}

try {
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const allNames = (geojson.features || []).map(getCountryName);

  const filteredFeatures = (geojson.features || [])
    .filter((feature) => EUROPA_OCIDENTAL.has(getCountryName(feature)))
    .map(cloneFeatureWithOriginalCoordinates);

  const foundNames = filteredFeatures.map((f) => getCountryName(f));
  const missingNames = [...EUROPA_OCIDENTAL].filter(
    (name) => !foundNames.includes(name)
  );

  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🌍 Total de países:", filteredFeatures.length);
  console.log("📌 Países encontrados:", foundNames);

  if (missingNames.length > 0) {
    console.log("⚠️ Países NÃO encontrados no countries.geojson:", missingNames);
  } else {
    console.log("✅ Todos os 12 países foram encontrados no countries.geojson.");
  }

  console.log(
    "🔎 Conferência de nomes no GeoJSON:",
    allNames.filter((name) =>
      /portugal|spain|france|belgium|netherlands|luxembourg|germany|switzerland|austria|italy|england|ireland/i.test(
        name
      )
    )
  );
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}