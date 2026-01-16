const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'assets', 'ui', 'pickaxes');
const databasePath = path.join(rootDir, 'src', 'Pickaxe', 'PickaxeDatabase.ts');
const managerPath = path.join(rootDir, 'src', 'Pickaxe', 'PickaxeManager.ts');

const THUMBNAIL_SIZE = 128;

const decodeTsString = (raw) => {
  try {
    return JSON.parse(`"${raw.replace(/"/g, '\\"')}"`);
  } catch (error) {
    return raw;
  }
};

const parsePickaxeDatabase = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = [];
  const regex = /tier:\s*(\d+),[\s\S]*?name:\s*'([^']+)'/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const tier = Number(match[1]);
    const name = decodeTsString(match[2]);
    entries.push({ tier, name });
  }

  return entries.sort((a, b) => a.tier - b.tier);
};

const parsePickaxeModelMap = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  const regex = /'([^']+)':\s*\{\s*modelFolder:\s*'([^']+)',\s*gltfFile:\s*'([^']+)'\s*\}/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const name = decodeTsString(match[1]);
    const modelFolder = decodeTsString(match[2]);
    const gltfFile = decodeTsString(match[3]);
    map.set(name, { modelFolder, gltfFile });
  }

  return map;
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const buildHtml = (threeUrl, loaderUrl) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Pickaxe Thumbnail Renderer</title>
    <script type="importmap">
      {
        "imports": {
          "three": "${threeUrl}"
        }
      }
    </script>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      canvas {
        display: block;
      }
    </style>
  </head>
  <body>
    <canvas id="render" width="${THUMBNAIL_SIZE}" height="${THUMBNAIL_SIZE}"></canvas>
    <script type="module">
      import * as THREE from '${threeUrl}';
      import { GLTFLoader } from '${loaderUrl}';

      const canvas = document.getElementById('render');
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(${THUMBNAIL_SIZE}, ${THUMBNAIL_SIZE}, false);
      renderer.setPixelRatio(1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
      keyLight.position.set(2.5, 2.5, 3);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(-2, 1.5, -3);
      scene.add(ambient, keyLight, fillLight);

      const loader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();
      let currentRoot = null;

      const fitCameraToObject = (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        cameraZ *= 1.7;

        camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.55, center.z + cameraZ);
        camera.near = Math.max(0.01, maxDim / 100);
        camera.far = maxDim * 15;
        camera.updateProjectionMatrix();
        camera.lookAt(center);
      };

      const applyTexture = (root, texture) => {
        root.traverse((obj) => {
          if (!obj.isMesh) return;
          const material = obj.material?.clone ? obj.material.clone() : obj.material;
          if (!material) return;
          material.map = texture;
          material.needsUpdate = true;
          obj.material = material;
        });
      };

      window.renderPickaxe = async (modelUrl, textureUrl) => {
        if (currentRoot) {
          scene.remove(currentRoot);
          currentRoot = null;
        }

        const gltf = await loader.loadAsync(modelUrl);
        const root = gltf.scene;

        if (textureUrl) {
          const texture = await textureLoader.loadAsync(textureUrl);
          texture.flipY = false;
          applyTexture(root, texture);
        }

        root.rotation.set(-0.45, Math.PI / 4, 0.1);
        scene.add(root);
        currentRoot = root;

        fitCameraToObject(root);
        renderer.render(scene, camera);

        await new Promise(requestAnimationFrame);
      };
    </script>
  </body>
</html>`;

const main = async () => {
  const pickaxes = parsePickaxeDatabase(databasePath);
  const modelMap = parsePickaxeModelMap(managerPath);

  ensureDir(outputDir);

  const threeModuleUrl = pathToFileURL(path.join(rootDir, 'node_modules', 'three', 'build', 'three.module.js')).href;
  const loaderUrl = pathToFileURL(
    path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'loaders', 'GLTFLoader.js')
  ).href;

  const htmlPath = path.join(os.tmpdir(), 'pickaxe-thumbnail-renderer.html');
  fs.writeFileSync(htmlPath, buildHtml(threeModuleUrl, loaderUrl), 'utf8');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--allow-file-access-from-files', '--disable-web-security'],
    defaultViewport: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      deviceScaleFactor: 1,
    },
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      console.log(`[thumbnails:browser] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      console.error('[thumbnails:browser] pageerror:', error.message);
    });

    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.renderPickaxe === 'function', { timeout: 60000 });

    const canvas = await page.$('#render');
    if (!canvas) {
      throw new Error('Renderer canvas not found.');
    }

    for (const pickaxe of pickaxes) {
      const mapping = modelMap.get(pickaxe.name);
      if (!mapping) {
        console.warn(`[thumbnails] Missing model mapping for "${pickaxe.name}".`);
        continue;
      }

      const modelPath = path.join(
        rootDir,
        'assets',
        'models',
        'Pickaxes',
        mapping.modelFolder,
        mapping.gltfFile
      );
      const texturePath = path.join(
        rootDir,
        'assets',
        'models',
        'Pickaxes',
        mapping.modelFolder,
        'Textures',
        `${pickaxe.name}.png`
      );

      if (!fs.existsSync(modelPath)) {
        console.warn(`[thumbnails] Missing model file: ${modelPath}`);
        continue;
      }

      const modelUrl = pathToFileURL(modelPath).href;
      const textureUrl = fs.existsSync(texturePath) ? pathToFileURL(texturePath).href : null;

      await page.evaluate((mUrl, tUrl) => window.renderPickaxe(mUrl, tUrl), modelUrl, textureUrl);

      const outputPath = path.join(outputDir, `tier-${pickaxe.tier}.png`);
      await canvas.screenshot({ path: outputPath, omitBackground: true });
      console.log(`[thumbnails] Wrote ${outputPath}`);
    }
  } finally {
    await browser.close();
  }

  console.log('[thumbnails] Done.');
};

main().catch((error) => {
  console.error('[thumbnails] Failed:', error);
  process.exitCode = 1;
});
