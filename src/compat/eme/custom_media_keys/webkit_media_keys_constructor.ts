/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ICompatHTMLMediaElement } from "../../browser_compatibility_types";
import isNode from "../../is_node";

type IWebKitMediaKeys = unknown;

interface IWebKitMediaKeysConstructor {
  new(keySystem: string) : IWebKitMediaKeys;
  isTypeSupported: (keyType: string) => boolean;
}

let WebKitMediaKeysConstructor: undefined|IWebKitMediaKeysConstructor;

if (!isNode) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  const { WebKitMediaKeys } = (window as Window & {
    WebKitMediaKeys? : IWebKitMediaKeysConstructor;
  });

  if (WebKitMediaKeys !== undefined &&
      typeof WebKitMediaKeys.isTypeSupported === "function" &&
      typeof WebKitMediaKeys.prototype.createSession === "function" &&
      typeof (HTMLMediaElement.prototype as ICompatHTMLMediaElement)
        .webkitSetMediaKeys === "function") {
    WebKitMediaKeysConstructor = WebKitMediaKeys;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}

export {
  WebKitMediaKeysConstructor,
  IWebKitMediaKeys,
};
