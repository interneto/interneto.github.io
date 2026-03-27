/**
 *  Copyright (c) 2025 taskylizard. Apache License 2.0.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const generatedCategoryPages = new Set([
  'ai-tools-and-services.md',
  'by-company.md',
  'dev.md',
  'education.md',
  'file-management.md',
  'financial-assets.md',
  'gaming.md',
  'health-and-fitness.md',
  'home-and-family.md',
  'intercomm.md',
  'multimedia.md',
  'news-media.md',
  'office-and-productivity.md',
  'online-services.md',
  'os.md',
  'security-and-privacy.md',
  'sys-admin.md',
  'time.md',
  'travel-and-location.md',
  'utility.md'
])

import { replaceUnderscore } from './transformer/core'

export const transform = (text: string) => replaceUnderscore(text)

export const transformGuide = (text: string) => {
  if (!text.includes('Beginners Guide')) return text

  // Normalize legacy markdown links in the guide to keep search indexing stable.
  return text
    .replaceAll('](#', '](/#')
    .replaceAll('_', '-')
}

export { generatedCategoryPages }
