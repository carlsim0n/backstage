/*
 * Copyright 2020 Spotify AB
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

import { ComponentType } from 'react';
import {
  PluginOutput,
  RoutePath,
  RouteOptions,
  FeatureFlagName,
} from './types';
import { validateBrowserCompat, validateFlagName } from 'api/app/FeatureFlags';
import { Widget } from 'api/widgetView/types';

export type PluginConfig = {
  id: string;
  register?(hooks: PluginHooks): void;
};

export type PluginHooks = {
  router: RouterHooks;
  widgets: WidgetHooks;
  featureFlags: FeatureFlagsHooks;
};

export type RouterHooks = {
  registerRoute(
    path: RoutePath,
    Component: ComponentType<any>,
    options?: RouteOptions,
  ): void;

  registerRedirect(
    path: RoutePath,
    target: RoutePath,
    options?: RouteOptions,
  ): void;
};

export type WidgetHooks = {
  add(widget: Widget): void;
};

export type FeatureFlagsHooks = {
  register(name: FeatureFlagName): void;
};

export const registerSymbol = Symbol('plugin-register');
export const outputSymbol = Symbol('plugin-output');

export default class Plugin {
  private storedOutput?: PluginOutput[];

  constructor(private readonly config: PluginConfig) {}

  getId(): string {
    return this.config.id;
  }

  output(): PluginOutput[] {
    if (this.storedOutput) {
      return this.storedOutput;
    }
    if (!this.config.register) {
      return [];
    }

    const outputs = new Array<PluginOutput>();

    this.config.register({
      router: {
        registerRoute(path, component, options) {
          outputs.push({ type: 'route', path, component, options });
        },
        registerRedirect(path, target, options) {
          outputs.push({ type: 'redirect-route', path, target, options });
        },
      },
      widgets: {
        add(widget: Widget) {
          outputs.push({ type: 'widget', widget });
        },
      },
      featureFlags: {
        register(name) {
          validateBrowserCompat();
          validateFlagName(name);
          outputs.push({ type: 'feature-flag', name });
        },
      },
    });

    this.storedOutput = outputs;
    return this.storedOutput;
  }

  toString() {
    return `plugin{${this.config.id}}`;
  }
}
