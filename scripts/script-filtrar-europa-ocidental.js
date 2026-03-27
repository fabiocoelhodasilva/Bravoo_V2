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
  "England",
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

  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

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