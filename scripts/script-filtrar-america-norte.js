const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../public/dados/countries.geojson");
const outputPath = path.join(__dirname, "../public/dados/america-norte-simplified.geojson");

const NORTH_AMERICA_NAMES = new Set([
  "Canada",
  "United States of America",
  "United States",
  "USA",
  "Mexico",
]);

function getCountryName(feature) {
  return feature?.properties?.name || feature?.properties?.ADMIN || "";
}

function simplifyCoordinates(coords, decimals = 2) {
  if (!Array.isArray(coords)) return coords;

  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    return [
      Number(coords[0].toFixed(decimals)),
      Number(coords[1].toFixed(decimals)),
    ];
  }

  return coords.map((item) => simplifyCoordinates(item, decimals));
}

function simplifyFeature(feature) {
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: simplifyCoordinates(feature.geometry.coordinates, 2),
    },
  };
}

try {
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const allNames = (geojson.features || []).map(getCountryName);

  const filteredFeatures = (geojson.features || [])
    .filter((feature) => NORTH_AMERICA_NAMES.has(getCountryName(feature)))
    .map(simplifyFeature);

  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🌎 Total de países:", filteredFeatures.length);
  console.log(
    "📌 Países encontrados:",
    filteredFeatures.map((f) => getCountryName(f))
  );

  console.log(
    "🔎 Possíveis nomes de EUA no arquivo original:",
    allNames.filter((name) => /united|usa|states/i.test(name))
  );
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}