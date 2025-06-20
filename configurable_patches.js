import fs from "node:fs/promises";
import { Project, SyntaxKind, IndentationText } from "ts-morph";
import YAML from "yaml";

const project = new Project({
  manipulationSettings: {
    indentationText: IndentationText.TwoSpaces,
  },
});

// ========================================
// CONFIGURATION - Toggle patches ON/OFF
// ========================================
const PATCHES = {
  // Chrome launch arguments
  REMOVE_HEADLESS_NEW_FLAG: true,              // Remove the conditional headless flag
  FIX_USER_AGENT: true,                        // Remove HeadlessChrome from UA
  ADD_WINDOW_SIZE: true,                       // Add window size
  ADD_ANTI_DETECT_ARGS: true,                  // Add various anti-detection arguments
  
  // Chrome switches removal
  REMOVE_ENABLE_AUTOMATION: true,              // Remove --enable-automation
  REMOVE_BASIC_SWITCHES: true,                 // Remove popup blocking, component update, etc.
  REMOVE_EXTENDED_SWITCHES: true,              // Remove more switches
  ADD_DISABLE_BLINK_FEATURES: true,            // Add --disable-blink-features=AutomationControlled
  
  // Service worker and init scripts
  BLOCK_SERVICE_WORKER_SIMPLE: true,           // Simple service worker block
  INJECT_STEALTH_SCRIPTS: true,                // Comprehensive stealth scripts in service worker block
  
  // Network modifications
  DISABLE_NETWORK_CACHE: true,                 // Force disable cache (DNS leak prevention)
  
  // CDP modifications
  REMOVE_RUNTIME_ENABLE: true,                 // Remove Runtime.enable from CDP
  
  // Page modifications
  FIX_INIT_SCRIPT_SOURCE: true,                // Fix InitScript source formatting
  
  // Frame modifications (from original patch - often breaks recorder)
  MODIFY_FRAME_CONTEXT: true,                 // Custom context creation
  MODIFY_EXPOSEDBINDING: true,                // Binding modifications
};

console.log("🔧 Applying configurable patches...");
console.log("\n📋 Patch configuration:");
Object.entries(PATCHES).forEach(([key, value]) => {
  console.log(`  ${value ? '✅' : '❌'} ${key}`);
});

// ========================================
// PATCH IMPLEMENTATIONS
// ========================================

// ----------------------------
// Chrome launch arguments
// ----------------------------
if (PATCHES.REMOVE_HEADLESS_NEW_FLAG || PATCHES.FIX_USER_AGENT || PATCHES.ADD_WINDOW_SIZE || PATCHES.ADD_ANTI_DETECT_ARGS) {
  console.log("\n📋 Modifying Chrome launch arguments...");
  const chromiumSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/chromium.ts",
  );
  const chromiumClass = chromiumSourceFile.getClass("Chromium");
  const innerDefaultArgsMethod = chromiumClass.getMethod("_innerDefaultArgs");
  
  if (PATCHES.REMOVE_HEADLESS_NEW_FLAG) {
    console.log("  ✓ Removing headless new flag condition");
    const innerDefaultArgsMethodStatements =
      innerDefaultArgsMethod.getDescendantsOfKind(SyntaxKind.IfStatement);
    innerDefaultArgsMethodStatements.forEach((ifStatement) => {
      const condition = ifStatement.getExpression().getText();
      if (condition.includes("process.env.PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW")) {
        ifStatement.replaceWithText("chromeArguments.push('--headless=new');");
      }
    });
  }
  
  const methodBody = innerDefaultArgsMethod.getBody();
  let additionalCode = "";
  
  if (PATCHES.FIX_USER_AGENT) {
    console.log("  ✓ Fixing user agent");
    additionalCode += `
  // Ensure user agent doesn't contain HeadlessChrome
  const uaIndex = chromeArguments.findIndex(arg => arg.startsWith('--user-agent='));
  if (uaIndex !== -1) {
    chromeArguments[uaIndex] = chromeArguments[uaIndex].replace('HeadlessChrome', 'Chrome');
  }
`;
  }
  
  if (PATCHES.ADD_WINDOW_SIZE) {
    console.log("  ✓ Adding window size");
    additionalCode += `
  // Add window size to prevent headless detection
  if (!chromeArguments.some(arg => arg.startsWith('--window-size'))) {
    chromeArguments.push('--window-size=1920,1080');
  }
`;
  }
  
  if (PATCHES.ADD_ANTI_DETECT_ARGS) {
    console.log("  ✓ Adding anti-detection arguments");
    additionalCode += `
  // Add anti-detection arguments
  const antiDetectArgs = [
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-features=site-per-process,TranslateUI,BlinkGenPropertyTrees',
    '--flag-switches-begin',
    '--flag-switches-end',
  ];
  
  antiDetectArgs.forEach(arg => {
    if (!chromeArguments.includes(arg)) {
      chromeArguments.push(arg);
    }
  });
`;
  }
  
  if (additionalCode) {
    methodBody.addStatements(additionalCode);
  }
}

// ----------------------------
// Chrome switches modifications
// ----------------------------
if (PATCHES.REMOVE_ENABLE_AUTOMATION || PATCHES.REMOVE_BASIC_SWITCHES || PATCHES.REMOVE_EXTENDED_SWITCHES || PATCHES.ADD_DISABLE_BLINK_FEATURES) {
  console.log("\n📋 Modifying Chrome switches...");
  const chromiumSwitchesSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/chromiumSwitches.ts",
  );
  const chromiumSwitchesArray = chromiumSwitchesSourceFile
    .getVariableDeclarationOrThrow("chromiumSwitches")
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

  let switchesToRemove = [];
  
  if (PATCHES.REMOVE_ENABLE_AUTOMATION) {
    console.log("  ✓ Removing --enable-automation");
    switchesToRemove.push("'--enable-automation'");
  }
  
  if (PATCHES.REMOVE_BASIC_SWITCHES) {
    console.log("  ✓ Removing basic switches");
    switchesToRemove.push(
      "'--disable-popup-blocking'",
      "'--disable-component-update'",
      "'--disable-default-apps'",
      "'--disable-extensions'",
      "'--disable-client-side-phishing-detection'",
      "'--disable-component-extensions-with-background-pages'"
    );
  }
  
  if (PATCHES.REMOVE_EXTENDED_SWITCHES) {
    console.log("  ✓ Removing extended switches");
    switchesToRemove.push(
      "'--allow-pre-commit-input'",
      "'--disable-ipc-flooding-protection'",
      "'--metrics-recording-only'",
      "'--unsafely-disable-devtools-self-xss-warnings'",
      "'--disable-back-forward-cache'",
      "'--disable-backgrounding-occluded-windows'",
      "'--disable-renderer-backgrounding'",
      "'--disable-features=Translate,BackForwardCache,AvoidUnnecessaryBeforeUnloadCheckSync'",
      "'--password-store=basic'",
      "'--use-mock-keychain'"
    );
  }
  
  chromiumSwitchesArray.getElements().forEach((element) => {
    if (switchesToRemove.some(s => element.getText().includes(s.replace(/'/g, '')))) {
      chromiumSwitchesArray.removeElement(element);
    }
  });
  
  if (PATCHES.ADD_DISABLE_BLINK_FEATURES) {
    console.log("  ✓ Adding --disable-blink-features=AutomationControlled");
    const hasDisableBlink = chromiumSwitchesArray.getElements().some(el => 
      el.getText().includes('--disable-blink-features=AutomationControlled')
    );
    if (!hasDisableBlink) {
      chromiumSwitchesArray.addElement("'--disable-blink-features=AutomationControlled'");
    }
  }
}

// ----------------------------
// Service worker and init scripts
// ----------------------------
if (PATCHES.BLOCK_SERVICE_WORKER_SIMPLE || PATCHES.INJECT_STEALTH_SCRIPTS) {
  console.log("\n📋 Modifying browser context...");
  const browserContextSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/browserContext.ts",
  );
  const browserContextClass = browserContextSourceFile.getClass("BrowserContext");
  const initializeMethod = browserContextClass.getMethod("_initialize");
  
  const initializeMethodCall = initializeMethod
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      return (
        call.getExpression().getText().includes("addInitScript") &&
        call
          .getArguments()
          .some((arg) =>
            arg.getText().includes("navigator.serviceWorker.register"),
          )
      );
    });
    
  if (initializeMethodCall) {
    if (PATCHES.INJECT_STEALTH_SCRIPTS) {
      console.log("  ✓ Injecting comprehensive stealth scripts");
      initializeMethodCall
        .getArguments()[0]
        .replaceWithText(`\`
      // Block service worker registration
      navigator.serviceWorker.register = async () => { };
      
      // Core webdriver fixes
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete navigator.__proto__.webdriver;
      
      // Chrome object fixes
      if (!window.chrome) {
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };
      }
      
      // Plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const arr = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client Executable' }
          ];
          arr.item = i => arr[i];
          arr.namedItem = name => arr.find(p => p.name === name);
          arr.refresh = () => {};
          return arr;
        }
      });
      
      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
      });
      
      // Vendor
      Object.defineProperty(navigator, 'vendor', {
        get: () => 'Google Inc.'
      });
      
      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission });
        }
        return originalQuery(parameters);
      };
      
      // WebGL Vendor/Renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, parameter);
      };
      
      if (typeof WebGL2RenderingContext !== 'undefined') {
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return 'Intel Inc.';
          if (parameter === 37446) return 'Intel Iris OpenGL Engine';
          return getParameter2.call(this, parameter);
        };
      }
      
      // Connection properties
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          rtt: 50,
          saveData: false,
          effectiveType: '4g',
          downlink: 10.0,
          downlinkMax: undefined
        })
      });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    \``);
    } else if (PATCHES.BLOCK_SERVICE_WORKER_SIMPLE) {
      console.log("  ✓ Simple service worker block");
      initializeMethodCall
        .getArguments()[0]
        .replaceWithText("`navigator.serviceWorker.register = async () => { };`");
    }
  }
}

// ----------------------------
// Network modifications
// ----------------------------
if (PATCHES.DISABLE_NETWORK_CACHE) {
  console.log("\n📋 Modifying network manager...");
  console.log("  ✓ Disabling network cache");
  const crNetworkManagerSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/crNetworkManager.ts",
  );
  const crNetworkManagerClass = crNetworkManagerSourceFile.getClass("CRNetworkManager");
  const updateMethod = crNetworkManagerClass.getMethod("_updateProtocolRequestInterceptionForSession");
  
  if (updateMethod) {
    updateMethod.getStatements().forEach((statement) => {
      const text = statement.getText();
      if (text.includes('const cachePromise = info.session.send(\'Network.setCacheDisabled\', { cacheDisabled: enabled });')) {
        statement.replaceWithText('const cachePromise = info.session.send(\'Network.setCacheDisabled\', { cacheDisabled: true });');
      }
    });
  }
}

// ----------------------------
// CDP modifications
// ----------------------------
if (PATCHES.REMOVE_RUNTIME_ENABLE) {
  console.log("\n📋 Modifying CDP...");
  console.log("  ✓ Removing Runtime.enable");
  const crDevToolsSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/crDevTools.ts",
  );
  const crDevToolsClass = crDevToolsSourceFile.getClass("CRDevTools");
  const installMethod = crDevToolsClass.getMethod("install");
  const promiseAllCalls = installMethod
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === "Promise.all");
  promiseAllCalls.forEach((call) => {
    const arrayLiteral = call.getFirstDescendantByKind(
      SyntaxKind.ArrayLiteralExpression,
    );
    if (arrayLiteral) {
      arrayLiteral.getElements().forEach((element) => {
        if (element.getText().includes("session.send('Runtime.enable'")) {
          arrayLiteral.removeElement(element);
        }
      });
    }
  });
}

// ----------------------------
// Page modifications
// ----------------------------
if (PATCHES.FIX_INIT_SCRIPT_SOURCE) {
  console.log("\n📋 Modifying page...");
  console.log("  ✓ Fixing InitScript source");
  const pageSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/page.ts",
  );
  const initScriptClass = pageSourceFile.getClass("InitScript");
  const initScriptConstructor = initScriptClass.getConstructors()[0];
  const initScriptConstructorAssignment = initScriptConstructor
    .getBody()
    ?.getStatements()
    .find(
      (statement) =>
        statement.getKind() === SyntaxKind.ExpressionStatement &&
        statement.getText().includes("this.source = `(() => {"),
    );
  if (initScriptConstructorAssignment) {
    initScriptConstructorAssignment.replaceWithText(
      `this.source = \`(() => { \${source} })();\`;`,
    );
  }
}

// ----------------------------
// Frame modifications (often breaks recorder)
// ----------------------------
if (PATCHES.MODIFY_FRAME_CONTEXT || PATCHES.MODIFY_EXPOSEDBINDING) {
  console.log("\n📋 ⚠️  Applying frame modifications (may break recorder)...");
  
  if (PATCHES.MODIFY_EXPOSEDBINDING) {
    console.log("  ⚠️  Modifying exposed bindings");
    const browserContextSourceFile = project.addSourceFileAtPath(
      "packages/playwright-core/src/server/browserContext.ts",
    );
    const browserContextClass = browserContextSourceFile.getClass("BrowserContext");
    
    // Modify exposeBinding method
    const exposeBindingMethod = browserContextClass.getMethod("exposeBinding");
    if (exposeBindingMethod) {
      exposeBindingMethod.getStatements().forEach((statement) => {
        const text = statement.getText();
        if (text.includes("this.doAddInitScript(binding.initScript)"))
          statement.replaceWithText("await this.doExposeBinding(binding);");
        else if (
          text.includes("this.pages().map(page => page.frames()).flat()") ||
          text.includes("frame.evaluateExpression(binding.initScript.source)")
        )
          statement.remove();
      });
    }
  }
  
  // Add more frame modifications as needed...
}

// Save all changes
project.saveSync();

console.log("\n✅ Patches applied!");
console.log("\n🚀 Next steps:");
console.log("  1. Build: npm run build");
console.log("  2. Test security: node test-security-detailed.js");
console.log("  3. Test recorder: npx playwright codegen https://example.com");
console.log("  4. Adjust PATCHES configuration based on results"); 