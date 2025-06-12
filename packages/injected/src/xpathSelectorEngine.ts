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

import type { SelectorEngine, SelectorRoot } from './selectorEngine';

export const XPathEngine: SelectorEngine = {
  queryAll(root: SelectorRoot, selector: string): Element[] {
    if (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      console.log('Got CSR:', root);
      const result: Element[] = [];
      // Custom ClosedShadowRoot XPath Engine
      const parser = new DOMParser();
      // Function to (recursively) get all elements in the shadowRoot
      function getAllChildElements(node) {
        const elements = [];
        const traverse = (currentNode) => {
          if (currentNode.nodeType === Node.ELEMENT_NODE) elements.push(currentNode);
          currentNode.childNodes?.forEach(traverse);
        };
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
          traverse(node);
        }

        return elements;
      }

      // Setting innerHTMl and childElements (all, recursive) to avoid race conditions
      const csrHTMLContent = root.innerHTML;
      const csrChildElements = getAllChildElements(root);
      const htmlDoc = parser.parseFromString(csrHTMLContent, 'text/html');
      const rootDiv = htmlDoc.body
      const rootDivChildElements = getAllChildElements(rootDiv);
      // Use the namespace prefix in the XPath expression
      const it = htmlDoc.evaluate(selector, htmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
      for (let node = it.iterateNext(); node; node = it.iterateNext()) {
        // -1 for the body element
        const nodeIndex = rootDivChildElements.indexOf(node) - 1;
        if (nodeIndex >= 0) {
          const originalNode = csrChildElements[nodeIndex];
          if (originalNode.nodeType === Node.ELEMENT_NODE)
            result.push(originalNode as Element);
        }

      }

      return result;
    }

    
    if (selector.startsWith('/') && root.nodeType !== Node.DOCUMENT_NODE)
      selector = '.' + selector;
    const result: Element[] = [];
    const document = root.ownerDocument || root;
    if (!document)
      return result;
    const it = document.evaluate(selector, root, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    for (let node = it.iterateNext(); node; node = it.iterateNext()) {
      if (node.nodeType === Node.ELEMENT_NODE)
        result.push(node as Element);
    }
    return result;
  }
};
