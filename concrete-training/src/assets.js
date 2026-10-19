// Renders the vector illustrations and icons to PNG for build.py.
// Usage: node assets.js <outDir>
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const fa = require("react-icons/fa");
const S = require("./svg");

const out = process.argv[2] || path.join(__dirname, "..", "build", "assets");
fs.mkdirSync(out, { recursive: true });

const ICONS = [
  "FaMountain", "FaIndustry", "FaCubes", "FaTruck", "FaHardHat", "FaBuilding", "FaBullseye",
  "FaFlask", "FaSearch", "FaExclamationTriangle", "FaClipboardCheck", "FaBalanceScale",
  "FaThermometerHalf", "FaTint", "FaClock", "FaLayerGroup", "FaWind", "FaSun", "FaShieldAlt",
  "FaUsers", "FaCoins", "FaCheckCircle", "FaTimesCircle", "FaBook", "FaGlobeEurope", "FaFlagUsa",
  "FaCogs", "FaVial", "FaWeightHanging", "FaCompressArrowsAlt", "FaWater", "FaChartLine",
  "FaQuestion", "FaLightbulb", "FaRulerVertical", "FaFire", "FaFilter", "FaRecycle", "FaBolt",
  "FaHourglassHalf", "FaStarOfDavid", "FaGraduationCap", "FaMicroscope", "FaTachometerAlt",
  "FaCertificate", "FaWarehouse", "FaLink", "FaHandPaper", "FaTools", "FaEye", "FaBan",
  "FaSnowflake", "FaArrowDown", "FaArrowUp", "FaUserCheck", "FaGem", "FaDollarSign",
  "FaRulerHorizontal", "FaVials", "FaSyncAlt", "FaListOl", "FaLeaf", "FaTrashAlt",
];
const COLORS = { w: "#FFFFFF", n: "#003973", b: "#0081C8", g: "#6B6B6B", r: "#C62828", k: "#2E7D32" };

const ILLUSTRATIONS = {
  skyline: S.skyline(), aggregates: S.aggregateSection(), hydration: S.hydrationStages(),
  micro: S.microstructure().svg, cube_load: S.cubeLoad(), pores_dense: S.poreSection(false),
  pores_open: S.poreSection(true), chloride: S.chlorideRebar(), slump_cone: S.slumpCone(),
  slump_low: S.slumpShape("low"), slump_ok: S.slumpShape("ok"), slump_high: S.slumpShape("high"),
  density: S.densityContainer(), air_meter: S.airMeter(), spec_cube: S.specimen("cube"),
  spec_cyl: S.specimen("cyl"), spec_core: S.specimen("core"), press: S.compressionMachine(),
  segregation: S.segregation(), bleeding: S.bleeding(), honeycomb: S.honeycomb(),
  plastic: S.plasticCracks(), scaling: S.scaling(), curing: S.curing(),
  tile_ok: S.tile("ok"), tile_clay: S.tile("clay"), tile_lumps: S.tile("lumps"),
  tile_organic: S.tile("organic"), tile_phase: S.tile("phase"),
  sampling: S.sampling(), sand_eq: S.sandEquivalent(), la_drum: S.laDrum(),
  water_plant: S.waterPlant().svg, rca: S.rcaParticles(),
};

(async () => {
  for (const [name, svg] of Object.entries(ILLUSTRATIONS)) {
    await sharp(Buffer.from(svg), { density: 200 }).png().toFile(path.join(out, `${name}.png`));
  }
  for (const icon of ICONS) {
    for (const [ck, col] of Object.entries(COLORS)) {
      const markup = renderToStaticMarkup(React.createElement(fa[icon], { color: col, size: 256 }));
      await sharp(Buffer.from(markup)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png().toFile(path.join(out, `${icon}_${ck}.png`));
    }
  }
  fs.writeFileSync(path.join(out, "micro_anchors.json"), JSON.stringify(S.microstructure().anchors));
  fs.writeFileSync(path.join(out, "water_anchors.json"), JSON.stringify(S.waterPlant().anchors));
  console.log("assets ->", out);
})();
