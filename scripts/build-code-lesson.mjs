import {writeFile} from 'node:fs/promises';
import {lessonHTML} from '../public/scripts/code-lab/render.js';
await writeFile(new URL('../public/slides/lesson-9.html',import.meta.url),lessonHTML());
console.log('Prepared code structure lessons with static initial tab state.');
