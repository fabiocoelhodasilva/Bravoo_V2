const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// caminhos
const inputPath = path.join(
  __dirname,
  "../public/dados/brazil-states.geojson"
);

const tempPath = path.join(
  os.tmpdir(),
  "brasil-estados-com-regiao.geojson"
);

const outputPath = path.join(
  __dirname,
  "../public/dados/brasil-regioes-simplified.geojson"
);

// estado → região
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

function getStateName(feature) {
  return (
    feature?.properties?.name ||
    feature?.properties?.nome ||
    feature?.properties?.NM_UF ||
    feature?.properties?.UF ||
    feature?.properties?.estado ||
    ""
  );
}

try {
  const raw = fs.readFileSync(inputPath, "utf8");
  const geojson = JSON.parse(raw);

  const features = geojson.features.map((feature) => {
    const estado = getStateName(feature);
    const regiao = ESTADO_PARA_REGIAO[estado];

    return {
      ...feature,
      properties: {
        ...feature.properties,
        regiao,
      },
    };
  });

  const tempGeo = {
    type: "FeatureCollection",
    features,
  };

  fs.writeFileSync(tempPath, JSON.stringify(tempGeo));

  console.log("🔧 Dissolvendo estados em regiões e simplificando...");

  execSync(
    `npx mapshaper "${tempPath}" -dissolve regiao -simplify weighted 8% keep-shapes -clean -o format=geojson "${outputPath}"`,
    { stdio: "inherit" }
  );

  const saved = fs.readFileSync(outputPath, "utf8");

  console.log("✅ Arquivo criado:");
  console.log(outputPath);
  console.log("📦 Tamanho:", Buffer.byteLength(saved, "utf8"), "bytes");
} catch (err) {
  console.error("❌ erro:", err);
}