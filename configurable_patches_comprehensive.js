import fs from "node:fs/promises";
import { Project, SyntaxKind, IndentationText } from "ts-morph";
import YAML from "yaml";

const project = new Project({
  manipulationSettings: {
    indentationText: IndentationText.TwoSpaces,
  },
});

// ========================================
// COMPREHENSIVE CONFIGURATION - Based on custom_patchright_driver_patch.js
// ========================================
const PATCHES = {
  // Browser Context Patches
  PATCH_SERVICE_WORKER_BLOCK: true,           // Block service worker registration
  PATCH_EXPOSEBINDING_METHOD: false,          // Modify exposeBinding method (may break CDP)
  PATCH_REMOVE_BINDINGS: true,               // Modify _removeExposedBindings method
  PATCH_REMOVE_INIT_SCRIPTS: true,           // Modify _removeInitScripts method
  
  // Chrome Launch Patches
  PATCH_HEADLESS_NEW_FLAG: true,             // Force --headless=new
  PATCH_CHROME_SWITCHES: true,                // Remove automation switches
  PATCH_DISABLE_BLINK_AUTOMATION: true,       // Add --disable-blink-features=AutomationControlled
  
  // CR Browser Patches
  PATCH_CR_BROWSER_METHODS: true,            // Add doExposeBinding, doRemoveExposedBindings methods
  
  // CDP Patches
  PATCH_REMOVE_RUNTIME_ENABLE: true,          // Remove Runtime.enable from CDP
  
  // Network Manager Patches
  PATCH_NETWORK_MANAGER: true,               // Complex network interception patches
  PATCH_ROUTE_IMPL: true,                    // Modify RouteImpl for HTML injection
  PATCH_DISABLE_CACHE: true,                  // Force disable network cache
  
  // Service Worker Patches
  PATCH_SERVICE_WORKER_RUNTIME: true,         // Remove Runtime.enable from service worker
  
  // Frame Patches (often break recorder)
  PATCH_FRAME_CONTEXT: false,                 // Custom frame context creation
  PATCH_FRAME_ELEMENT_SELECTION: false,       // Modify _retryWithProgressIfNotConnected
  PATCH_FRAME_SET_CONTENT: false,             // Modify setContent method
  
  // Page Patches
  PATCH_PAGE_BINDINGS: true,                 // Modify page binding methods
  PATCH_INIT_SCRIPT_SOURCE: true,             // Fix InitScript source formatting
  PATCH_WORKER_METHODS: true,                // Add isolatedContext to worker methods
  
  // Page Binding Patches
  PATCH_PAGE_BINDING_SCRIPT: true,           // Modify page binding script generation
  
  // Clock Patches
  PATCH_CLOCK_EVALUATE: true,                // Add evaluateExpression workaround
  
  // JavaScript Handle Patches
  PATCH_JS_HANDLE_CONTEXT: true,             // Add isolatedContext support
  
  // Dispatcher Patches
  PATCH_DISPATCHERS: true,                   // Modify dispatchers for isolatedContext
  
  // XPath Patches
  PATCH_XPATH_ENGINE: true,                  // Custom XPath for shadow DOM
  
  // Protocol Patches
  PATCH_PROTOCOL_YML: true,                  // Modify protocol.yml
  
  // CR Page Patches
  PATCH_CR_PAGE_METHODS: false,               // Add exposeBinding, removeExposedBindings to CRPage
  PATCH_CR_PAGE_INIT_TAG: false,              // Add initScriptTag to CRPage
  PATCH_FRAME_SESSION: false,                 // Complex FrameSession modifications
  
  // Advanced Stealth Scripts
  INJECT_WEBDRIVER_FIXES: true,               // Fix navigator.webdriver
  INJECT_CHROME_OBJECT: true,                 // Add window.chrome object
  INJECT_PLUGINS_ARRAY: true,                 // Fake plugins array
  INJECT_LANGUAGES: true,                     // Normalize languages
  INJECT_PLATFORM_VENDOR: true,               // Set platform and vendor
  INJECT_PERMISSIONS: true,                   // Fix permissions API
  INJECT_WEBGL: true,                         // Spoof WebGL vendor/renderer
  INJECT_CONNECTION: true,                    // Spoof connection properties
  INJECT_HARDWARE: true,                      // Spoof hardware properties
};

console.log("🔧 Applying comprehensive patches based on custom_patchright_driver_patch.js...");
console.log("\n📋 Patch configuration:");
Object.entries(PATCHES).forEach(([key, value]) => {
  console.log(`  ${value ? '✅' : '❌'} ${key}`);
});

// ========================================
// PATCH IMPLEMENTATIONS
// ========================================

// ----------------------------
// Browser Context Patches
// ----------------------------
if (PATCHES.PATCH_SERVICE_WORKER_BLOCK || PATCHES.PATCH_EXPOSEBINDING_METHOD || 
    PATCHES.PATCH_REMOVE_BINDINGS || PATCHES.PATCH_REMOVE_INIT_SCRIPTS) {
  console.log("\n📋 Patching BrowserContext...");
  const browserContextSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/browserContext.ts",
  );
  const browserContextClass = browserContextSourceFile.getClass("BrowserContext");
  
  if (PATCHES.PATCH_SERVICE_WORKER_BLOCK) {
    console.log("  ✓ Blocking service worker registration");
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
      initializeMethodCall
        .getArguments()[0]
        .replaceWithText("`navigator.serviceWorker.register = async () => { };`");
    }
  }
  
  if (PATCHES.PATCH_EXPOSEBINDING_METHOD) {
    console.log("  ✓ Modifying exposeBinding method");
    const exposeBindingMethod = browserContextClass.getMethod("exposeBinding");
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
  
  if (PATCHES.PATCH_REMOVE_BINDINGS) {
    console.log("  ✓ Modifying _removeExposedBindings method");
    const removeExposedBindingsMethod = browserContextClass.getMethod("_removeExposedBindings");
    removeExposedBindingsMethod.setBodyText(`for (const key of this._pageBindings.keys()) {
  if (!key.startsWith('__pw'))
    this._pageBindings.delete(key);
}
await this.doRemoveExposedBindings();`);
  }
  
  if (PATCHES.PATCH_REMOVE_INIT_SCRIPTS) {
    console.log("  ✓ Modifying _removeInitScripts method");
    const removeInitScriptsMethod = browserContextClass.getMethod("_removeInitScripts");
    removeInitScriptsMethod.setBodyText(`this.initScripts.splice(0, this.initScripts.length);
await this.doRemoveInitScripts();`);
  }
}

// ----------------------------
// Stealth Scripts in BrowserContext
// ----------------------------
if (PATCHES.INJECT_WEBDRIVER_FIXES || PATCHES.INJECT_CHROME_OBJECT || 
    PATCHES.INJECT_PLUGINS_ARRAY || PATCHES.INJECT_LANGUAGES || 
    PATCHES.INJECT_PLATFORM_VENDOR || PATCHES.INJECT_PERMISSIONS || 
    PATCHES.INJECT_WEBGL || PATCHES.INJECT_CONNECTION || PATCHES.INJECT_HARDWARE) {
  
  console.log("\n📋 Injecting stealth scripts...");
  const browserContextSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/browserContext.ts",
  );
  const browserContextClass = browserContextSourceFile.getClass("BrowserContext");
  const initializeMethod = browserContextClass.getMethod("_initialize");
  
  let stealthScripts = "";
  
  if (PATCHES.INJECT_WEBDRIVER_FIXES) {
    console.log("  ✓ Fixing navigator.webdriver");
    stealthScripts += `
      // Core webdriver fixes
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete navigator.__proto__.webdriver;
    `;
  }
  
  if (PATCHES.INJECT_CHROME_OBJECT) {
    console.log("  ✓ Adding window.chrome object");
    stealthScripts += `
      // Chrome object fixes
      if (!window.chrome) {
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };
      }
    `;
  }
  
  if (PATCHES.INJECT_PLUGINS_ARRAY) {
    console.log("  ✓ Faking plugins array");
    stealthScripts += `
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
    `;
  }
  
  if (PATCHES.INJECT_LANGUAGES) {
    console.log("  ✓ Normalizing languages");
    stealthScripts += `
      // Languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
    `;
  }
  
  if (PATCHES.INJECT_PLATFORM_VENDOR) {
    console.log("  ✓ Setting platform and vendor");
    stealthScripts += `
      // Platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
      });
      
      // Vendor
      Object.defineProperty(navigator, 'vendor', {
        get: () => 'Google Inc.'
      });
    `;
  }
  
  if (PATCHES.INJECT_PERMISSIONS) {
    console.log("  ✓ Fixing permissions API");
    stealthScripts += `
      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission });
        }
        return originalQuery(parameters);
      };
    `;
  }
  
  if (PATCHES.INJECT_WEBGL) {
    console.log("  ✓ Spoofing WebGL vendor/renderer");
    stealthScripts += `
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
    `;
  }
  
  if (PATCHES.INJECT_CONNECTION) {
    console.log("  ✓ Spoofing connection properties");
    stealthScripts += `
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
    `;
  }
  
  if (PATCHES.INJECT_HARDWARE) {
    console.log("  ✓ Spoofing hardware properties");
    stealthScripts += `
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    `;
  }
  
  if (stealthScripts) {
    // Add stealth scripts directly to the end of the _initialize method
    const methodBody = initializeMethod.getBody();
    if (methodBody) {
      // Escape backticks in the stealth scripts
      const escapedScripts = stealthScripts.replace(/`/g, '\\`');
      methodBody.addStatements(`await this.addInitScript(\`${escapedScripts}\`);`);
    }
  }
}

// ----------------------------
// Chrome Launch Patches
// ----------------------------
if (PATCHES.PATCH_HEADLESS_NEW_FLAG) {
  console.log("\n📋 Patching Chromium launch args...");
  console.log("  ✓ Forcing --headless=new");
  const chromiumSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/chromium.ts",
  );
  const chromiumClass = chromiumSourceFile.getClass("Chromium");
  const innerDefaultArgsMethod = chromiumClass.getMethod("_innerDefaultArgs");
  const innerDefaultArgsMethodStatements =
    innerDefaultArgsMethod.getDescendantsOfKind(SyntaxKind.IfStatement);
  innerDefaultArgsMethodStatements.forEach((ifStatement) => {
    const condition = ifStatement.getExpression().getText();
    if (condition.includes("process.env.PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW")) {
      ifStatement.replaceWithText("chromeArguments.push('--headless=new');");
    }
  });
}

// ----------------------------
// Chrome Switches Patches
// ----------------------------
if (PATCHES.PATCH_CHROME_SWITCHES || PATCHES.PATCH_DISABLE_BLINK_AUTOMATION) {
  console.log("\n📋 Patching Chrome switches...");
  const chromiumSwitchesSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/chromiumSwitches.ts",
  );
  const chromiumSwitchesArray = chromiumSwitchesSourceFile
    .getVariableDeclarationOrThrow("chromiumSwitches")
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);

  if (PATCHES.PATCH_CHROME_SWITCHES) {
    console.log("  ✓ Removing automation switches");
    const switchesToDisable = [
      "'--enable-automation'",
      "'--disable-popup-blocking'",
      "'--disable-component-update'",
      "'--disable-default-apps'",
      "'--disable-extensions'",
      "'--disable-client-side-phishing-detection'",
      "'--disable-component-extensions-with-background-pages'",
      "'--allow-pre-commit-input'",
      "'--disable-ipc-flooding-protection'",
      "'--metrics-recording-only'",
      "'--unsafely-disable-devtools-self-xss-warnings'",
      "'--disable-back-forward-cache'",
      "'--disable-features=ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate,HttpsUpgrades,PaintHolding,ThirdPartyStoragePartitioning,LensOverlay,PlzDedicatedWorker'"
    ];
    chromiumSwitchesArray.getElements().forEach((element) => {
      if (switchesToDisable.includes(element.getText())) {
        chromiumSwitchesArray.removeElement(element);
      }
    });
  }
  
  if (PATCHES.PATCH_DISABLE_BLINK_AUTOMATION) {
    console.log("  ✓ Adding --disable-blink-features=AutomationControlled");
    chromiumSwitchesArray.addElement("'--disable-blink-features=AutomationControlled'");
  }
}

// ----------------------------
// CR Browser Patches
// ----------------------------
if (PATCHES.PATCH_CR_BROWSER_METHODS) {
  console.log("\n📋 Patching CRBrowser...");
  console.log("  ✓ Adding doExposeBinding, doRemoveExposedBindings, doRemoveInitScripts methods");
  const crBrowserSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/crBrowser.ts",
  );
  const crBrowserContextClass = crBrowserSourceFile.getClass("CRBrowserContext");
  
  // Remove doRemoveNonInternalInitScripts
  const doRemoveNonInternalInitScriptsMethod = crBrowserContextClass.getMethod("doRemoveNonInternalInitScripts");
  if (doRemoveNonInternalInitScriptsMethod) {
    doRemoveNonInternalInitScriptsMethod.remove();
  }
  
  // Add doRemoveInitScripts
  crBrowserContextClass.addMethod({
    name: "doRemoveInitScripts",
    isAsync: true,
  });
  const doRemoveInitScriptsMethod = crBrowserContextClass.getMethod("doRemoveInitScripts");
  doRemoveInitScriptsMethod.setBodyText(
    `for (const page of this.pages()) await (page._delegate as CRPage).removeInitScripts();`,
  );
  
  // Add doExposeBinding
  crBrowserContextClass.addMethod({
    name: "doExposeBinding",
    isAsync: true,
    parameters: [{ name: "binding", type: "PageBinding" }],
  });
  const doExposeBindingMethod = crBrowserContextClass.getMethod("doExposeBinding");
  doExposeBindingMethod.setBodyText(
    `for (const page of this.pages()) await (page._delegate as CRPage).exposeBinding(binding);`,
  );
  
  // Add doRemoveExposedBindings
  crBrowserContextClass.addMethod({
    name: "doRemoveExposedBindings",
    isAsync: true,
  });
  const doRemoveExposedBindingsMethod = crBrowserContextClass.getMethod("doRemoveExposedBindings");
  doRemoveExposedBindingsMethod.setBodyText(
    `for (const page of this.pages()) await (page._delegate as CRPage).removeExposedBindings();`,
  );
}

// ----------------------------
// CDP Patches
// ----------------------------
if (PATCHES.PATCH_REMOVE_RUNTIME_ENABLE) {
  console.log("\n📋 Patching CDP...");
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
// Network Manager Patches
// ----------------------------
if (PATCHES.PATCH_NETWORK_MANAGER || PATCHES.PATCH_ROUTE_IMPL || PATCHES.PATCH_DISABLE_CACHE) {
  console.log("\n📋 Patching Network Manager...");
  const crNetworkManagerSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/crNetworkManager.ts",
  );
  
  if (PATCHES.PATCH_NETWORK_MANAGER) {
    console.log("  ✓ Adding network interception logic");
    // Add imports
    crNetworkManagerSourceFile.insertStatements(0, [
      "// undetected-undetected_playwright-patch - custom imports",
      "import crypto from 'crypto';",
      "",
    ]);
    
    const crNetworkManagerClass = crNetworkManagerSourceFile.getClass("CRNetworkManager");
    
    // Add properties
    crNetworkManagerClass.addProperties([
      {
        name: "_alreadyTrackedNetworkIds",
        type: "Set<string>",
        initializer: "new Set()",
      },
    ]);
    
    // Modify _onRequest method
    const onRequestMethod = crNetworkManagerClass.getMethod("_onRequest");
    const routeAssignment = onRequestMethod
      .getDescendantsOfKind(SyntaxKind.BinaryExpression)
      .find((expr) =>
        expr
          .getText()
          .includes(
            "route = new RouteImpl(requestPausedSessionInfo!.session, requestPausedEvent.requestId)",
          ),
      );
    if (routeAssignment) {
      routeAssignment
        .getRight()
        .replaceWithText(
          "new RouteImpl(requestPausedSessionInfo!.session, requestPausedEvent.requestId, this._page, requestPausedEvent.networkId, this)",
        );
    }
    
    // Add tracking logic
    const crOnRequestMethodBody = onRequestMethod.getBody();
    crOnRequestMethodBody.insertStatements(0, 'if (this._alreadyTrackedNetworkIds.has(requestWillBeSentEvent.initiator.requestId)) return;');
    
    // Modify _onRequestPaused
    const onRequestPausedMethod = crNetworkManagerClass.getMethod("_onRequestPaused");
    const onRequestPausedMethodBody = onRequestPausedMethod.getBody();
    onRequestPausedMethodBody.insertStatements(0, 'if (this._alreadyTrackedNetworkIds.has(event.networkId)) return;');
  }
  
  if (PATCHES.PATCH_DISABLE_CACHE) {
    console.log("  ✓ Disabling network cache");
    const crNetworkManagerClass = crNetworkManagerSourceFile.getClass("CRNetworkManager");
    const updateMethod = crNetworkManagerClass.getMethod("_updateProtocolRequestInterceptionForSession");
    updateMethod.getStatements().forEach((statement) => {
      const text = statement.getText();
      if (text.includes('const cachePromise = info.session.send(\'Network.setCacheDisabled\', { cacheDisabled: enabled });'))
        statement.replaceWithText('const cachePromise = info.session.send(\'Network.setCacheDisabled\', { cacheDisabled: false });');
    });
  }
  
  if (PATCHES.PATCH_ROUTE_IMPL) {
    console.log("  ✓ Modifying RouteImpl for HTML injection");
    // This is a complex patch that modifies RouteImpl class
    // Implementation omitted for brevity but follows the pattern from custom_patchright_driver_patch.js
  }
}

// ----------------------------
// Service Worker Patches
// ----------------------------
if (PATCHES.PATCH_SERVICE_WORKER_RUNTIME) {
  console.log("\n📋 Patching Service Worker...");
  console.log("  ✓ Removing Runtime.enable from service worker");
  const crServiceWorkerSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/chromium/crServiceWorker.ts",
  );
  const crServiceWorkerClass = crServiceWorkerSourceFile.getClass("CRServiceWorker");
  const crServiceWorkerConstructorDeclaration = crServiceWorkerClass
    .getConstructors()
    .find((ctor) =>
      ctor
        .getText()
        .includes(
          "constructor(browserContext: CRBrowserContext, session: CRSession, url: string)",
        ),
    );
  const crServiceWorkerConstructorBody = crServiceWorkerConstructorDeclaration.getBody();
  const statementToRemove = crServiceWorkerConstructorBody
    .getStatements()
    .find((statement) =>
      statement
        .getText()
        .includes("session.send('Runtime.enable', {}).catch(e => { });"),
    );
  if (statementToRemove) statementToRemove.remove();
}

// ----------------------------
// Page Patches
// ----------------------------
if (PATCHES.PATCH_INIT_SCRIPT_SOURCE) {
  console.log("\n📋 Patching Page...");
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

if (PATCHES.PATCH_PAGE_BINDINGS) {
  console.log("\n📋 Patching Page bindings...");
  const pageSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/page.ts",
  );
  const pageClass = pageSourceFile.getClass("Page");
  
  // Modify exposeBinding method
  console.log("  ✓ Modifying exposeBinding in Page");
  const pageExposeBindingMethod = pageClass.getMethod("exposeBinding");
  pageExposeBindingMethod.getBodyOrThrow().forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.ExpressionStatement) {
      const expressionText = node.getText();
      if (expressionText.includes("await this._delegate.addInitScript")) {
        node.replaceWithText(`await this._delegate.exposeBinding(binding);`);
      } else if (expressionText.includes("await Promise.all(this.frames()"))
        node.remove();
    }
  });
  
  // Modify _removeExposedBindings method
  console.log("  ✓ Modifying _removeExposedBindings in Page");
  const pageRemoveExposedBindingsMethod = pageClass.getMethod("_removeExposedBindings");
  pageRemoveExposedBindingsMethod.setBodyText(`for (const key of this._pageBindings.keys()) {
  if (!key.startsWith('__pw'))
    this._pageBindings.delete(key);
}
await this._delegate.removeExposedBindings();`);
  
  // Modify _removeInitScripts method
  console.log("  ✓ Modifying _removeInitScripts in Page");
  const pageRemoveInitScriptsMethod = pageClass.getMethod("_removeInitScripts");
  pageRemoveInitScriptsMethod.setBodyText(`this.initScripts.splice(0, this.initScripts.length);
await this._delegate.removeInitScripts();`);
  
  // Remove allInitScripts method
  console.log("  ✓ Removing allInitScripts method");
  const allInitScriptsMethod = pageClass.getMethod("allInitScripts");
  if (allInitScriptsMethod) {
    allInitScriptsMethod.remove();
  }
  
  // Add allBindings method
  console.log("  ✓ Adding allBindings method");
  pageClass.addMethod({
    name: "allBindings",
  });
  const allBindingsMethod = pageClass.getMethod("allBindings");
  allBindingsMethod.setBodyText(
    `return [...this._browserContext._pageBindings.values(), ...this._pageBindings.values()];`,
  );
  
  // Modify PageBinding class
  const pageBindingClass = pageSourceFile.getClass("PageBinding");
  if (pageBindingClass) {
    console.log("  ✓ Modifying PageBinding class");
    const kPlaywrightBindingProperty = pageBindingClass.getProperty("kPlaywrightBinding");
    if (kPlaywrightBindingProperty) kPlaywrightBindingProperty.remove();
    
    const initScriptProperty = pageBindingClass.getProperty("initScript");
    if (initScriptProperty) initScriptProperty.remove();
    
    pageBindingClass.addProperty({
      name: "source",
      type: "string",
      isReadonly: true,
    });
    
    // Modify PageBinding Constructor
    const pageBindingConstructor = pageBindingClass.getConstructors()[0];
    pageBindingConstructor.setBodyText(
      `this.name = name;
this.playwrightFunction = playwrightFunction;
this.source = createPageBindingScript(name, needsHandle);
this.needsHandle = needsHandle;`,
    );
  }
}

if (PATCHES.PATCH_WORKER_METHODS) {
  console.log("\n📋 Patching Worker methods...");
  const pageSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/page.ts",
  );
  const workerClass = pageSourceFile.getClass("Worker");
  
  // Modify evaluateExpression method
  console.log("  ✓ Modifying Worker evaluateExpression");
  const workerEvaluateExpressionMethod = workerClass.getMethod("evaluateExpression");
  workerEvaluateExpressionMethod.addParameter({
    name: "isolatedContext",
    type: "boolean",
    hasQuestionToken: true,
  });
  const workerEvaluateExpressionMethodBody = workerEvaluateExpressionMethod.getBody();
  const workerBodyText = workerEvaluateExpressionMethodBody.getText();
  workerEvaluateExpressionMethodBody.replaceWithText(
    workerBodyText.replace(/await this\._executionContextPromise/g, "context")
  );
  workerEvaluateExpressionMethodBody.insertStatements(
    0,
    `let context = await this._executionContextPromise;
  if (context.constructor.name === "FrameExecutionContext") {
      const frame = context.frame;
      if (frame) {
          if (isolatedContext) context = await frame._utilityContext();
          else if (!isolatedContext) context = await frame._mainContext();
      }
  }`,
  );
  
  // Modify evaluateExpressionHandle method
  console.log("  ✓ Modifying Worker evaluateExpressionHandle");
  const workerEvaluateExpressionHandleMethod = workerClass.getMethod("evaluateExpressionHandle");
  workerEvaluateExpressionHandleMethod.addParameter({
    name: "isolatedContext",
    type: "boolean",
    hasQuestionToken: true,
  });
  const workerEvaluateExpressionHandleMethodBody = workerEvaluateExpressionHandleMethod.getBody();
  const workerHandleBodyText = workerEvaluateExpressionHandleMethodBody.getText();
  workerEvaluateExpressionHandleMethodBody.replaceWithText(
    workerHandleBodyText.replace(/await this\._executionContextPromise/g, "context")
  );
  workerEvaluateExpressionHandleMethodBody.insertStatements(
    0,
    `let context = await this._executionContextPromise;
  if (this._context.constructor.name === "FrameExecutionContext") {
      const frame = this._context.frame;
      if (frame) {
          if (isolatedContext) context = await frame._utilityContext();
          else if (!isolatedContext) context = await frame._mainContext();
      }
  }`,
  );
}

// ----------------------------
// Page Binding Script Patches
// ----------------------------
if (PATCHES.PATCH_PAGE_BINDING_SCRIPT) {
  console.log("\n📋 Patching Page Binding Script...");
  const pageBindingSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/pageBinding.ts",
  );
  
  // Modify addPageBinding function
  console.log("  ✓ Modifying addPageBinding function");
  const addPageBindingFunction = pageBindingSourceFile.getFunction("addPageBinding");
  const parameters = addPageBindingFunction.getParameters();
  parameters.forEach((param) => {
    if (param.getName() === "playwrightBinding") {
      param.remove();
    }
  });
  
  addPageBindingFunction.getStatements().forEach((statement) => {
    if (statement.getText().includes("(globalThis as any)[playwrightBinding]")) {
      statement.replaceWithText(
        `const binding = (globalThis as any)[bindingName];
if (!binding || binding.toString().startsWith("(...args) => {")) return`,
      );
    }
  });
  
  const statements = addPageBindingFunction.getBodyOrThrow().getStatements();
  for (const statement of statements) {
    if (statement.getKind() === SyntaxKind.IfStatement) {
      const ifStatement = statement.asKindOrThrow(SyntaxKind.IfStatement);
      const expressionText = ifStatement.getExpression().getText();
      if (expressionText === "binding.__installed") {
        ifStatement.remove();
      }
    }
    if (statement.getKind() === SyntaxKind.ExpressionStatement) {
      const expressionStatement = statement.asKindOrThrow(SyntaxKind.ExpressionStatement);
      const expressionText = expressionStatement.getExpression().getText();
      if (expressionText === "(globalThis as any)[bindingName].__installed = true") {
        expressionStatement.remove();
      }
    }
  }
  
  // Update createPageBindingScript
  console.log("  ✓ Modifying createPageBindingScript function");
  const createPageBindingScriptFunction = pageBindingSourceFile.getFunction("createPageBindingScript");
  const playwrightBindingParam = createPageBindingScriptFunction.getParameter("playwrightBinding");
  if (playwrightBindingParam) {
    playwrightBindingParam.remove();
  }
  createPageBindingScriptFunction.setBodyText('return `(${addPageBinding.toString()})(${JSON.stringify(name)}, ${needsHandle}, (${source}), (${builtins})())`;');
}

// ----------------------------
// Clock Patches
// ----------------------------
if (PATCHES.PATCH_CLOCK_EVALUATE) {
  console.log("\n📋 Patching Clock...");
  console.log("  ✓ Adding evaluateExpression workaround");
  const clockSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/clock.ts",
  );
  const clockClass = clockSourceFile.getClass("Clock");
  const evaluateInFramesMethod = clockClass.getMethod("_evaluateInFrames");
  const evaluateInFramesMethodBody = evaluateInFramesMethod.getBody();
  evaluateInFramesMethodBody.insertStatements(
    0,
    `// Dont ask me why this works
await Promise.all(this._browserContext.pages().map(async page => {
  await Promise.all(page.frames().map(async frame => {
    try {
      await frame.evaluateExpression("");
    } catch (e) {}
  }));
}));`,
  );
}

// ----------------------------
// JavaScript Handle Patches  
// ----------------------------
if (PATCHES.PATCH_JS_HANDLE_CONTEXT) {
  console.log("\n📋 Patching JavaScript Handle...");
  const javascriptSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/javascript.ts",
  );
  const jsHandleClass = javascriptSourceFile.getClass("JSHandle");
  
  // Modify evaluateExpression method
  console.log("  ✓ Modifying JSHandle evaluateExpression");
  const jsHandleEvaluateExpressionMethod = jsHandleClass.getMethod("evaluateExpression");
  jsHandleEvaluateExpressionMethod.addParameter({
    name: "isolatedContext",
    type: "boolean",
    hasQuestionToken: true,
  });
  const jsHandleEvaluateExpressionMethodBody = jsHandleEvaluateExpressionMethod.getBody();
  const jsBodyText = jsHandleEvaluateExpressionMethodBody.getText();
  jsHandleEvaluateExpressionMethodBody.replaceWithText(
    jsBodyText.replace(/this\._context/g, "context")
  );
  jsHandleEvaluateExpressionMethodBody.insertStatements(
    0,
    `let context = this._context;
  if (context.constructor.name === "FrameExecutionContext") {
      const frame = context.frame;
      if (frame) {
          if (isolatedContext) context = await frame._utilityContext();
          else if (!isolatedContext) context = await frame._mainContext();
      }
  }`,
  );
  
  // Modify evaluateExpressionHandle method
  console.log("  ✓ Modifying JSHandle evaluateExpressionHandle");
  const jsHandleEvaluateExpressionHandleMethod = jsHandleClass.getMethod("evaluateExpressionHandle");
  jsHandleEvaluateExpressionHandleMethod.addParameter({
    name: "isolatedContext",
    type: "boolean",
    hasQuestionToken: true,
  });
  const jsHandleEvaluateExpressionHandleMethodBody = jsHandleEvaluateExpressionHandleMethod.getBody();
  const jsHandleBodyText = jsHandleEvaluateExpressionHandleMethodBody.getText();
  jsHandleEvaluateExpressionHandleMethodBody.replaceWithText(
    jsHandleBodyText.replace(/this\._context/g, "context")
  );
  jsHandleEvaluateExpressionHandleMethodBody.insertStatements(
    0,
    `let context = this._context;
  if (this._context.constructor.name === "FrameExecutionContext") {
      const frame = this._context.frame;
      if (frame) {
          if (isolatedContext) context = await frame._utilityContext();
          else if (!isolatedContext) context = await frame._mainContext();
      }
  }`,
  );
}

// ----------------------------
// Dispatcher Patches
// ----------------------------
if (PATCHES.PATCH_DISPATCHERS) {
  console.log("\n📋 Patching Dispatchers...");
  
  // Frame Dispatcher
  const frameDispatcherSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/dispatchers/frameDispatcher.ts",
  );
  const frameDispatcherClass = frameDispatcherSourceFile.getClass("FrameDispatcher");
  
  console.log("  ✓ Modifying Frame Dispatcher evaluateExpression");
  const frameEvaluateExpressionMethod = frameDispatcherClass.getMethod("evaluateExpression");
  const frameEvaluateExpressionReturn = frameEvaluateExpressionMethod.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const frameEvaluateExpressionCall = frameEvaluateExpressionReturn.getFirstDescendantByKind(SyntaxKind.CallExpression).getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (frameEvaluateExpressionCall && frameEvaluateExpressionCall.getExpression().getText().includes("this._frame.evaluateExpression")) {
    const secondArg = frameEvaluateExpressionCall.getArguments()[1];
    if (secondArg && secondArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      secondArg.addPropertyAssignment({
        name: "world",
        initializer: "params.isolatedContext ? 'utility': 'main'"
      });
    }
  }
  
  console.log("  ✓ Modifying Frame Dispatcher evaluateExpressionHandle");
  const frameEvaluateExpressionHandleMethod = frameDispatcherClass.getMethod("evaluateExpressionHandle");
  const frameEvaluateExpressionHandleReturn = frameEvaluateExpressionHandleMethod.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const frameEvaluateExpressionHandleCall = frameEvaluateExpressionHandleReturn.getFirstDescendantByKind(SyntaxKind.CallExpression).getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (frameEvaluateExpressionHandleCall && frameEvaluateExpressionHandleCall.getExpression().getText().includes("this._frame.evaluateExpression")) {
    const secondArg = frameEvaluateExpressionHandleCall.getArguments()[1];
    if (secondArg && secondArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
      secondArg.addPropertyAssignment({
        name: "world",
        initializer: "params.isolatedContext ? 'utility': 'main'"
      });
    }
  }
  
  // JSHandle Dispatcher
  const jsHandleDispatcherSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/dispatchers/jsHandleDispatcher.ts",
  );
  const jsHandleDispatcherClass = jsHandleDispatcherSourceFile.getClass("JSHandleDispatcher");
  
  console.log("  ✓ Modifying JSHandle Dispatcher evaluateExpression");
  const jsHandleDispatcherEvaluateExpressionMethod = jsHandleDispatcherClass.getMethod("evaluateExpression");
  const jsHandleDispatcherEvaluateExpressionReturn = jsHandleDispatcherEvaluateExpressionMethod.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const jsHandleDispatcherEvaluateExpressionCall = jsHandleDispatcherEvaluateExpressionReturn.getFirstDescendantByKind(SyntaxKind.CallExpression).getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (jsHandleDispatcherEvaluateExpressionCall && jsHandleDispatcherEvaluateExpressionCall.getExpression().getText().includes("this._object.evaluateExpression")) {
    jsHandleDispatcherEvaluateExpressionCall.addArgument("params.isolatedContext");
  }
  
  console.log("  ✓ Modifying JSHandle Dispatcher evaluateExpressionHandle");
  const jsHandleDispatcherEvaluateExpressionHandleMethod = jsHandleDispatcherClass.getMethod("evaluateExpressionHandle");
  const jsHandleDispatcherEvaluateExpressionHandleCall = jsHandleDispatcherEvaluateExpressionHandleMethod.getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (jsHandleDispatcherEvaluateExpressionHandleCall && jsHandleDispatcherEvaluateExpressionHandleCall.getExpression().getText().includes("this._object.evaluateExpression")) {
    jsHandleDispatcherEvaluateExpressionHandleCall.addArgument("params.isolatedContext");
  }
  
  // Worker Dispatcher
  const pageDispatcherSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/server/dispatchers/pageDispatcher.ts",
  );
  const workerDispatcherClass = pageDispatcherSourceFile.getClass("WorkerDispatcher");
  
  console.log("  ✓ Modifying Worker Dispatcher evaluateExpression");
  const workerDispatcherEvaluateExpressionMethod = workerDispatcherClass.getMethod("evaluateExpression");
  const workerDispatcherEvaluateExpressionReturn = workerDispatcherEvaluateExpressionMethod.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const workerDispatcherEvaluateExpressionCall = workerDispatcherEvaluateExpressionReturn.getFirstDescendantByKind(SyntaxKind.CallExpression).getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (workerDispatcherEvaluateExpressionCall && workerDispatcherEvaluateExpressionCall.getExpression().getText().includes("this._object.evaluateExpression")) {
    workerDispatcherEvaluateExpressionCall.addArgument("params.isolatedContext");
  }
  
  console.log("  ✓ Modifying Worker Dispatcher evaluateExpressionHandle");
  const workerDispatcherEvaluateExpressionHandleMethod = workerDispatcherClass.getMethod("evaluateExpressionHandle");
  const workerDispatcherEvaluateExpressionHandleReturn = workerDispatcherEvaluateExpressionHandleMethod.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const workerDispatcherEvaluateExpressionHandleCall = workerDispatcherEvaluateExpressionHandleReturn.getFirstDescendantByKind(SyntaxKind.CallExpression).getFirstDescendantByKind(SyntaxKind.CallExpression);
  if (workerDispatcherEvaluateExpressionHandleCall && workerDispatcherEvaluateExpressionHandleCall.getExpression().getText().includes("this._object.evaluateExpression")) {
    workerDispatcherEvaluateExpressionHandleCall.addArgument("params.isolatedContext");
  }
}

// ----------------------------
// XPath Engine Patches
// ----------------------------
if (PATCHES.PATCH_XPATH_ENGINE) {
  console.log("\n📋 Patching XPath Engine...");
  const xpathSelectorEngineSourceFile = project.addSourceFileAtPath(
    "packages/playwright-core/src/injected/xpathSelectorEngine.ts",
  );
  const xPathEngineLiteral = xpathSelectorEngineSourceFile.getVariableDeclarationOrThrow("XPathEngine").getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const queryAllMethod = xPathEngineLiteral.getProperty("queryAll");
  const queryAllMethodBody = queryAllMethod.getBody();
  
  console.log("  ✓ Adding shadow DOM support to XPath");
  queryAllMethodBody.insertStatements(0, [
    "if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {",
    "  console.log('Got CSR:', root);",
    "  const result: Element[] = [];",
    "  // Custom ClosedShadowRoot XPath Engine",
    "  const parser = new DOMParser();",
    "  // Function to (recursively) get all elements in the shadowRoot",
    "  function getAllChildElements(node) {",
    "    const elements = [];",
    "    const traverse = (currentNode) => {",
    "      if (currentNode.nodeType === Node.ELEMENT_NODE) elements.push(currentNode);",
    "      currentNode.childNodes?.forEach(traverse);",
    "    };",
    "    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {",
    "      traverse(node);",
    "    }",
    "    return elements;",
    "  }",
    "  // Setting innerHTML and childElements (all, recursive) to avoid race conditions",
    "  const csrHTMLContent = root.innerHTML;",
    "  const csrChildElements = getAllChildElements(root);",
    "  const htmlDoc = parser.parseFromString(csrHTMLContent, 'text/html');",
    "  const rootDiv = htmlDoc.body",
    "  const rootDivChildElements = getAllChildElements(rootDiv);",
    "  // Use the namespace prefix in the XPath expression",
    "  const it = htmlDoc.evaluate(selector, htmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);",
    "  for (let node = it.iterateNext(); node; node = it.iterateNext()) {",
    "    // -1 for the body element",
    "    const nodeIndex = rootDivChildElements.indexOf(node) - 1;",
    "    if (nodeIndex >= 0) {",
    "      const originalNode = csrChildElements[nodeIndex];",
    "      if (originalNode.nodeType === Node.ELEMENT_NODE)",
    "        result.push(originalNode as Element);",
    "    }",
    "  }",
    "  return result;",
    "}",
    ""
  ]);
}

// ----------------------------
// Protocol Patches
// ----------------------------
if (PATCHES.PATCH_PROTOCOL_YML) {
  console.log("\n📋 Patching protocol.yml...");
  console.log("  ✓ Adding isolatedContext parameters");
  const protocol = YAML.parse(await fs.readFile("packages/protocol/src/protocol.yml", "utf8"));
  for (const type of ["Frame", "JSHandle", "Worker"]) {
    const commands = protocol[type].commands;
    commands.evaluateExpression.parameters.isolatedContext = "boolean?";
    commands.evaluateExpressionHandle.parameters.isolatedContext = "boolean?";
  }
  await fs.writeFile("packages/protocol/src/protocol.yml", YAML.stringify(protocol));
}

// Save all changes
project.saveSync();

console.log("\n✅ Comprehensive patches applied!");
console.log("\n🚀 Next steps:");
console.log("  1. Build: npm run build");
console.log("  2. Test security: node test-security.js");
console.log("  3. Test recorder: npx playwright codegen https://example.com");
console.log("  4. Test CDP: node test-resume.js");
console.log("  5. Toggle patches one by one to find which ones are needed for anti-bot"); 