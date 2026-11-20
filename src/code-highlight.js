import hljs from 'highlight.js/lib/core';
import arduino from 'highlight.js/lib/languages/arduino';
hljs.registerLanguage('arduino', arduino);

export function highlightCode(source) {
  return hljs.highlight(String(source), {language:'arduino', ignoreIllegals:true}).value;
}

// Parse once as a whole program, then keep multiline token spans balanced per row.
export function highlightLines(source) {
  const open=[];
  return highlightCode(source).split('\n').map(line=>{
    const prefix=open.join('');
    for(const [tag] of line.matchAll(/<\/?span\b[^>]*>/g)) {
      if(tag.startsWith('</')) open.pop(); else open.push(tag);
    }
    return prefix+line+'</span>'.repeat(open.length);
  });
}
