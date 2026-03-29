import { meta } from '../constants'

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
interface Header {
  [file: string]: { title: string; description: string }
}

export const headers: Header = {} as const

export const excluded = [
  'readme.md',
  'single-page',
  'feedback.md',
  'index.md',
  'sandbox.md',
  'startpage.md'
]

export function getHeader(id: string) {
  const title =
    '<div class="space-y-2 not-prose"><h1 class="text-4xl font-extrabold tracking-tight text-primary underline lg:text-5xl lg:leading-[3.5rem]">'

  const description = '<p class="text-black dark:text-text-2">'

  const feedback = meta.build.api ? '<Feedback />' : ''

  const data = headers[id]
  let header = '---\n'
  header += `title: "${data.title}"\n`
  header += `description: ${data.description}\n`
  header += '---\n'
  header += `${title}${data.title}</h1>\n`
  header += `${description}${data.description}</p></div>\n\n${feedback}\n\n`
  return header
}
