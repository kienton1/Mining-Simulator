const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'assets', 'ui', 'pets');
const databasePath = path.join(rootDir, 'src', 'Pets', 'PetDatabase.ts');
const visualsPath = path.join(rootDir, 'src', 'Pets', 'PetVisuals.ts');

const THUMBNAIL_SIZE = 256;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const parsePetIds = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const start = content.indexOf('export const PET_IDS');
  if (start === -1) return new Map();
  const block = content.slice(start, content.indexOf('} as const', start));
  const map = new Map();
  const regex = /([A-Z0-9_]+):\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(block)) !== null) {
    map.set(match[1], match[2]);
  }
  return map;
};

const parsePetVisuals = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  const entryRegex = /\[PET_IDS\.([A-Z0-9_]+)\]:\s*\{([\s\S]*?)\}\s*,?/g;
  let match;

  const readProp = (block, prop) => {
    const propRegex = new RegExp(`${prop}\\s*:\\s*['\"]([^'\"]+)['\"]`);
    const propMatch = propRegex.exec(block);
    return propMatch ? propMatch[1] : null;
  };

  while ((match = entryRegex.exec(content)) !== null) {
    const block = match[2];
    map.set(match[1], {
      modelFolder: readProp(block, 'modelFolder'),
      gltfFile: readProp(block, 'gltfFile'),
      textureFile: readProp(block, 'textureFile'),
      modelPath: readProp(block, 'modelPath'),
      texturePath: readProp(block, 'texturePath'),
    });
  }
  return map;
};

const buildHtml = (threeUrl, loaderUrl) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Pet Thumbnail Renderer</title>
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
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

      const ambient = new THREE.AmbientLight(0xffffff, 0.95);
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
      keyLight.position.set(2.5, 2.5, 3);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
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
        cameraZ *= 1.15;

        camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.2, center.z + cameraZ);
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

      window.renderPet = async (modelUrl, textureUrl) => {
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

        // Face the camera (most models face -Z, so flip 180° on Y).
        root.rotation.set(0.08, Math.PI, 0);
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
  const petIds = parsePetIds(databasePath);
  const modelMap = parsePetVisuals(visualsPath);

  ensureDir(outputDir);

  const threeModuleUrl = pathToFileURL(path.join(rootDir, 'node_modules', 'three', 'build', 'three.module.js')).href;
  const loaderUrl = pathToFileURL(
    path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'loaders', 'GLTFLoader.js')
  ).href;

  const htmlPath = path.join(os.tmpdir(), 'pet-thumbnail-renderer.html');
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
      console.log(`[pet-thumbnails:browser] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      console.error('[pet-thumbnails:browser] pageerror:', error.message);
    });

    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.renderPet === 'function', { timeout: 60000 });

    const canvas = await page.$('#render');
    if (!canvas) {
      throw new Error('Renderer canvas not found.');
    }

    for (const [constName, petId] of petIds.entries()) {
      const mapping = modelMap.get(constName);
      if (!mapping) {
        console.warn(`[pet-thumbnails] Missing model mapping for ${constName}.`);
        continue;
      }

      if (!mapping.modelPath && (!mapping.modelFolder || !mapping.gltfFile)) {
        console.warn(`[pet-thumbnails] Missing model info for ${constName}.`);
        continue;
      }

      const modelPath = mapping.modelPath
        ? path.join(rootDir, 'assets', mapping.modelPath)
        : path.join(rootDir, 'assets', 'models', 'Pets', mapping.modelFolder, mapping.gltfFile);

      const texturePath = mapping.texturePath
        ? path.join(rootDir, 'assets', mapping.texturePath)
        : (mapping.modelFolder && mapping.textureFile
          ? path.join(rootDir, 'assets', 'models', 'Pets', mapping.modelFolder, 'Textures', mapping.textureFile)
          : null);

      if (!fs.existsSync(modelPath)) {
        console.warn(`[pet-thumbnails] Missing model file: ${modelPath}`);
        continue;
      }

      const modelUrl = pathToFileURL(modelPath).href;
      const textureUrl = texturePath && fs.existsSync(texturePath) ? pathToFileURL(texturePath).href : null;

      await page.evaluate((mUrl, tUrl) => window.renderPet(mUrl, tUrl), modelUrl, textureUrl);

      const outputPath = path.join(outputDir, `${petId}.png`);
      await canvas.screenshot({ path: outputPath, omitBackground: true });
      console.log(`[pet-thumbnails] Wrote ${outputPath}`);
    }
  } finally {
    await browser.close();
  }

  console.log('[pet-thumbnails] Done.');
};

main().catch((error) => {
  console.error('[pet-thumbnails] Failed:', error);
  process.exitCode = 1;
});
