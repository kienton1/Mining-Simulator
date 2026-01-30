const fs = require("fs");
const path = require("path");

// Check if livereload mode is enabled via command line arg
const isLivereload = process.argv.includes("--livereload");

const outputContent = [];

function includeContent(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: File not found: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(fullPath, "utf8");
  outputContent.push(`<!-- Included from: ${filePath} -->\n${content}`);
}

// Include UI components for Mining Simulator
// Data helpers must come early (CDN, font loading, player ID)
includeContent("./components/data/CDN.html");
includeContent("./components/data/PlayerId.html");

// Core utilities (formatNumber, state object, etc.)
includeContent("./core.html");

// SceneUI templates (training prompts, egg labels, shop labels)
includeContent("./components/SceneUITemplates.html");

// Setup functions and event handlers
includeContent("./components/SetupAndEventHandlers.html");

// Loading screen
includeContent("./components/LoadingScreen.html");

// Mobile controls
includeContent("./components/MobileControls.html");

// Tutorial panel
includeContent("./components/TutorialUI.html");

// Player HUD (stats display)
includeContent("./components/StatsHUD.html");

// Left-side action buttons
includeContent("./components/LeftActions.html");

// Modal windows
includeContent("./components/MinerModal.html");
includeContent("./components/PickaxeModal.html");
includeContent("./components/RebirthModal.html");
includeContent("./components/EggModal.html");
includeContent("./components/RewardModal.html");
includeContent("./components/PetsModal.html");
includeContent("./components/MapsModal.html");

// Training prompt
includeContent("./components/TrainingPrompt.html");

// Power gain floating text layer
includeContent("./components/PowerGainLayer.html");

// Mining-related UI
includeContent("./components/MineResetTimer.html");
includeContent("./components/BlockHealthBar.html");
includeContent("./components/MiningHUD.html");

// Proximity-based UI panels
includeContent("./components/MerchantUI.html");
includeContent("./components/MineResetUpgradeUI.html");
includeContent("./components/GemTraderUI.html");

// Progress bar
includeContent("./components/ProgressBar.html");

// Mining and auto controls
includeContent("./components/MiningControls.html");
includeContent("./components/AutoControls.html");

// Styles (base + themed)
includeContent("./components/Styles.html");
includeContent("./components/ThemeStyles.html");

// Build a single index.html file
let html = outputContent.join("\n\n");

// Inject livereload script in development mode
if (isLivereload) {
  const livereloadScript = `
<!-- Livereload - Development Only -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'http://localhost:35729/livereload.js?snipver=1';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  html += livereloadScript;
  console.log("Livereload script injected");
}

const fullOutputPath = path.join(__dirname, "index.html");
fs.writeFileSync(fullOutputPath, html);

console.log(`Built index.html with ${outputContent.length} components`);
