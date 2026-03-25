const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../public/dados/countries.geojson");
const outputPath = path.join(__dirname, "../public/dados/america-sul-simplified.geojson");

const SOUTH_AMERICA = new Set([
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Guyana",
  "Paraguay",
  "Peru",
  "Suriname",
  "Uruguay",
  "Venezuela",
  "French Guiana",
  "France",
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

  const filteredFeatures = (geojson.features || [])
    .filter((feature) => SOUTH_AMERICA.has(getCountryName(feature)))
    .map(simplifyFeature);

  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log("Arquivo gerado com sucesso:", outputPath);
  console.log("Total de países:", filteredFeatures.length);
} catch (error) {
  console.error("Erro ao gerar arquivo simplificado:");
  console.error(error);
}