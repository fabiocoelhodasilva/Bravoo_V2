const fs = require("fs");
const path = require("path");

// Caminhos
const inputPath = path.join(__dirname, "../public/dados/countries.geojson");
const outputPath = path.join(
  __dirname,
  "../public/dados/europa-simplified.geojson"
);

// Países da Europa com aliases aceitos
const EUROPA_ALIASES = {
  Albania: ["Albania"],
  Austria: ["Austria"],
  Belarus: ["Belarus"],
  Belgium: ["Belgium"],
  "Bosnia and Herzegovina": ["Bosnia and Herzegovina"],
  Bulgaria: ["Bulgaria"],
  Croatia: ["Croatia"],
  Cyprus: ["Cyprus"],
  Czechia: ["Czechia", "Czech Republic"],
  Denmark: ["Denmark"],
  Estonia: ["Estonia"],
  Finland: ["Finland"],
  France: ["France"],
  Germany: ["Germany"],
  Greece: ["Greece"],
  Hungary: ["Hungary"],
  Iceland: ["Iceland"],
  Ireland: ["Ireland"],
  Italy: ["Italy"],
  Kosovo: ["Kosovo"],
  Latvia: ["Latvia"],
  Lithuania: ["Lithuania"],
  Luxembourg: ["Luxembourg"],
  Moldova: ["Moldova", "Republic of Moldova"],
  Montenegro: ["Montenegro"],
  Netherlands: ["Netherlands"],
  "North Macedonia": ["North Macedonia", "Macedonia"],
  Norway: ["Norway"],
  Poland: ["Poland"],
  Portugal: ["Portugal"],
  Romania: ["Romania"],
  "Russian Federation": ["Russian Federation", "Russia"],
  Serbia: ["Serbia", "Republic of Serbia"],
  Slovakia: ["Slovakia"],
  Slovenia: ["Slovenia"],
  Spain: ["Spain"],
  Sweden: ["Sweden"],
  Switzerland: ["Switzerland"],
  Ukraine: ["Ukraine"],
  "United Kingdom": [
    "United Kingdom",
    "United Kingdom of Great Britain and Northern Ireland",
    "Great Britain",
    "England"
  ]
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

function getCountryName(feature) {
  return (
    feature?.properties?.name ||
    feature?.properties?.ADMIN ||
    feature?.properties?.admin ||
    feature?.properties?.NAME ||
    feature?.properties?.name_en ||
    ""
  );
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

  const aliasesNormalizados = new Set(
    Object.values(EUROPA_ALIASES).flat().map(normalizeName)
  );

  const allNames = (geojson.features || []).map(getCountryName);

  const filteredFeatures = (geojson.features || [])
    .filter((feature) => {
      const nome = getCountryName(feature);
      return aliasesNormalizados.has(normalizeName(nome));
    })
    .map(cloneFeatureWithOriginalCoordinates);

  const foundNames = filteredFeatures.map((f) => getCountryName(f));

  const missingCountries = Object.entries(EUROPA_ALIASES)
    .filter(([, aliases]) => {
      return !aliases.some((alias) =>
        foundNames.some(
          (found) => normalizeName(found) === normalizeName(alias)
        )
      );
    })
    .map(([paisCanonico]) => paisCanonico);

  const output = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };

  const jsonFinal = JSON.stringify(output, null, 2);

  fs.writeFileSync(outputPath, jsonFinal, "utf8");

  const savedContent = fs.readFileSync(outputPath, "utf8");

  console.log("✅ Arquivo gerado com sucesso:");
  console.log(outputPath);
  console.log("🌍 Total de países:", filteredFeatures.length);
  console.log("📦 Tamanho em bytes:", Buffer.byteLength(savedContent, "utf8"));
  console.log("📌 Países encontrados:", foundNames);

  if (missingCountries.length > 0) {
    console.log("⚠️ Países NÃO encontrados no countries.geojson:", missingCountries);
  } else {
    console.log("✅ Todos os países da lista foram encontrados.");
  }

  console.log("🔎 Primeiros 200 caracteres do arquivo salvo:");
  console.log(savedContent.slice(0, 200));

  console.log(
    "🔎 Conferência de nomes no GeoJSON:",
    allNames.filter((name) =>
      /england|united kingdom|great britain|serbia|macedonia|czech|russia|moldova/i.test(
        name
      )
    )
  );
} catch (error) {
  console.error("❌ Erro ao gerar arquivo:");
  console.error(error);
}