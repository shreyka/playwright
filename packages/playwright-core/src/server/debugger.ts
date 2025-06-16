/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventEmitter } from 'events';

import { debugMode, isUnderTest, monotonicTime } from '../utils';
import { BrowserContext } from './browserContext';
import { commandsWithTracingSnapshots, pausesBeforeInputActions, slowMoActions } from '../protocol/debug';
import { Recorder } from './recorder';
import { RecorderApp } from './recorder/recorderApp';

import type { CallMetadata, InstrumentationListener, SdkObject } from './instrumentation';

const symbol = Symbol('Debugger');

export class Debugger extends EventEmitter implements InstrumentationListener {
  private _pauseOnNextStatement = false;
  private _pausedCallsMetadata = new Map<CallMetadata, { resolve: () => void, sdkObject: SdkObject }>();
  private _enabled: boolean;
  private _context: BrowserContext;
  private _outputFile: string | undefined;
  private _clickXPathData: Array<{selector: string, xpath: string, timestamp: number}> = [];

  static Events = {
    PausedStateChanged: 'pausedstatechanged'
  };
  private _muted = false;
  private _slowMo: number | undefined;

  constructor(context: BrowserContext) {
    super();
    this._context = context;
    (this._context as any)[symbol] = this;
    this._enabled = debugMode() === 'inspector';
    if (this._enabled)
      this.pauseOnNextStatement();
    context.instrumentation.addListener(this, context);
    this._context.once(BrowserContext.Events.Close, () => {
      this._context.instrumentation.removeListener(this);
    });
    this._slowMo = this._context._browser.options.slowMo;
  }

  _setOutputFile(outputFile: string) {
    this._outputFile = outputFile;
    console.log('🐛 [DEBUG] Setting output file to:', outputFile);
  }

  async setMuted(muted: boolean) {
    this._muted = muted;
  }

  async onBeforeCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void> {
    if (this._muted)
      return;
    
    // For pause calls, extract outputFile from params and set it immediately
    if (shouldPauseOnCall(sdkObject, metadata) && metadata.params?.outputFile) {
      this._outputFile = metadata.params.outputFile;
      console.log('🐛 [DEBUG] Setting output file from metadata params:', metadata.params.outputFile);
    }
    
    if (shouldPauseOnCall(sdkObject, metadata) || (this._pauseOnNextStatement && shouldPauseBeforeStep(metadata)))
      await this.pause(sdkObject, metadata);
  }

  async _doSlowMo() {
    await new Promise(f => setTimeout(f, this._slowMo));
  }

  async onAfterCall(sdkObject: SdkObject, metadata: CallMetadata): Promise<void> {
    if (this._slowMo && shouldSlowMo(metadata))
      await this._doSlowMo();
  }

  async onBeforeInputAction(sdkObject: SdkObject, metadata: CallMetadata): Promise<void> {
    if (this._muted)
      return;
    if (this._enabled && this._pauseOnNextStatement)
      await this.pause(sdkObject, metadata);
  }

  async pause(sdkObject: SdkObject, metadata: CallMetadata) {
    if (this._muted)
      return;
    this._enabled = true;
    
    // Clear xpath data at start of each pause (like codegen script clears)
    this._clickXPathData = [];
    
    // Auto-enable recording when pause() is called, similar to codegen
    if (shouldPauseOnCall(sdkObject, metadata)) {
      try {
        const recorder = await Recorder.show(this._context, RecorderApp.factory(this._context), {
          mode: 'recording',
          language: 'python',
          testIdAttributeName: undefined,
          handleSIGINT: false,
        });
        // Explicitly set mode to 'recording' in case we're reusing an existing recorder
        recorder.setMode('recording');
        // Clear any previous script to start fresh
        recorder.clearScript();
        
        // Set output file if provided
        if (this._outputFile) {
          recorder.setOutput('python', this._outputFile);
        }

        // Set up xpath capture for clicks
        this._setupClickXPathCapture(recorder);
        
      } catch (error) {
        // Ignore recording activation errors and continue with pause
      }
    }
    
    metadata.pauseStartTime = monotonicTime();
    const result = new Promise<void>(resolve => {
      this._pausedCallsMetadata.set(metadata, { resolve, sdkObject });
    });
    this.emit(Debugger.Events.PausedStateChanged);
    return result;
  }

  resume(step: boolean) {
    if (!this.isPaused())
      return;

    this._pauseOnNextStatement = step;
    const endTime = monotonicTime();
    for (const [metadata, { resolve }] of this._pausedCallsMetadata) {
      metadata.pauseEndTime = endTime;
      resolve();
    }
    this._pausedCallsMetadata.clear();
    
    // Flush any pending recorder output before writing xpath data
    this._flushRecorderOutput();
    
    // Write xpath data to file when recording ends
    this._writeXPathDataToFile();
    
    this.emit(Debugger.Events.PausedStateChanged);
  }

  pauseOnNextStatement() {
    this._pauseOnNextStatement = true;
  }

  isPaused(metadata?: CallMetadata): boolean {
    if (metadata)
      return this._pausedCallsMetadata.has(metadata);
    return !!this._pausedCallsMetadata.size;
  }

  pausedDetails(): { metadata: CallMetadata, sdkObject: SdkObject }[] {
    const result: { metadata: CallMetadata, sdkObject: SdkObject }[] = [];
    for (const [metadata, { sdkObject }] of this._pausedCallsMetadata)
      result.push({ metadata, sdkObject });
    return result;
  }

  private _setupClickXPathCapture(recorder: any) {
    // Hook into click actions only
    const originalOnBeforeCall = recorder.onBeforeCall?.bind(recorder);
    if (originalOnBeforeCall) {
      recorder.onBeforeCall = async (sdkObject: any, metadata: any) => {
        // Capture xpath for click actions only
        if (metadata.method === 'click' && metadata.params?.selector) {
          await this._captureClickXPath(metadata.params.selector, sdkObject.attribution?.page);
        }
        return originalOnBeforeCall(sdkObject, metadata);
      };
    }
  }

  private async _captureClickXPath(selector: string, page: any) {
    console.log('🐛 [DEBUG] Capturing xpath for click on selector:', selector);
    try {
      const xpath = await page?.mainFrame()?.evaluateExpression(`
        (() => {
          const element = document.querySelector('${selector}');
          if (!element) return null;
          
          function getXPath(el) {
            if (el.id) return '//*[@id="' + el.id + '"]';
            if (el === document.body) return '/html/body';
            
            let ix = 0;
            const siblings = el.parentNode?.childNodes || [];
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i];
              if (sibling === el) {
                return getXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
              }
              if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
            }
          }
          
          return getXPath(element);
        })()
      `);
      
      if (xpath) {
        this._clickXPathData.push({
          selector,
          xpath,
          timestamp: Date.now()
        });
        console.log('🐛 [DEBUG] Captured xpath:', xpath, 'for selector:', selector);
      } else {
        console.log('🐛 [DEBUG] No xpath captured for selector:', selector);
      }
    } catch (e) {
      console.log('🐛 [DEBUG] Error capturing xpath:', e.message);
    }
  }

  private _writeXPathDataToFile() {
    console.log('🐛 [DEBUG] Writing xpath data to file. OutputFile:', this._outputFile, 'Data length:', this._clickXPathData.length);
    if (!this._outputFile || this._clickXPathData.length === 0) {
      console.log('🐛 [DEBUG] Skipping xpath file write - no output file or no data');
      return;
    }
    
    try {
      const fs = require('fs');
      
      // Auto-derive xpath filename from existing outputFile
      const xpathFile = this._outputFile.replace(/\.py$/, '_xpaths.json');
      console.log('🐛 [DEBUG] Writing xpath file to:', xpathFile);
      
      const xpathOutput = {
        clickXPaths: this._clickXPathData,
        generatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(xpathFile, JSON.stringify(xpathOutput, null, 2));
      console.log('🐛 [DEBUG] Successfully wrote xpath file');
    } catch (e) {
      console.log('🐛 [DEBUG] Error writing xpath file:', e.message);
    }
  }

  private _flushRecorderOutput() {
    try {
      // Get the current recorder for this context
      const recorder = (this._context as any).recorderAppForTest;
      if (recorder && recorder._contextRecorder) {
        // Access the throttled output file and flush it
        const contextRecorder = recorder._contextRecorder;
        if (contextRecorder._throttledOutputFile) {
          console.log('🐛 [DEBUG] Flushing recorder output before writing xpath file');
          contextRecorder._throttledOutputFile.flush();
        }
      }
    } catch (e) {
      console.log('🐛 [DEBUG] Error flushing recorder output:', e.message);
    }
  }
}

function shouldPauseOnCall(sdkObject: SdkObject, metadata: CallMetadata): boolean {
  if (sdkObject.attribution.playwright.options.isServer)
    return false;
  if (!sdkObject.attribution.browser?.options.headful && !isUnderTest())
    return false;
  return metadata.method === 'pause';
}

function shouldPauseBeforeStep(metadata: CallMetadata): boolean {
  // Don't stop on internal.
  if (!metadata.apiName)
    return false;
  // Always stop on 'close'
  if (metadata.method === 'close')
    return true;
  if (metadata.method === 'waitForSelector' || metadata.method === 'waitForEventInfo' || metadata.method === 'querySelector' || metadata.method === 'querySelectorAll')
    return false;  // Never stop on those, primarily for the test harness.
  const step = metadata.type + '.' + metadata.method;
  // Stop before everything that generates snapshot. But don't stop before those marked as pausesBeforeInputActions
  // since we stop in them on a separate instrumentation signal.
  return commandsWithTracingSnapshots.has(step) && !pausesBeforeInputActions.has(metadata.type + '.' + metadata.method);
}

export function shouldSlowMo(metadata: CallMetadata): boolean {
  return slowMoActions.has(metadata.type + '.' + metadata.method);
}
