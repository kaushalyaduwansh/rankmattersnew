// components/ui/EditorRenderer.tsx
import React from 'react';
import edjsHTML from 'editorjs-html';

// Recursive function to handle nested lists (ordered and unordered)
const renderNestedList = (items: any[], style: string): string => {
  if (!items || items.length === 0) return '';
  
  // Explicitly assign Tailwind list styles to guarantee they show up
  const tag = style === 'ordered' ? 'ol' : 'ul';
  const listClass = style === 'ordered' 
    ? 'list-decimal pl-6 space-y-1 my-2 marker:font-semibold marker:text-gray-700' 
    : 'list-disc pl-6 space-y-1 my-2 marker:text-gray-500';

  const listItems = items.map((item: any) => {
    // Recursively parse any lists inside of this list item
    const nestedHtml = renderNestedList(item.items || [], style);
    return `<li class="text-gray-800">${item.content}${nestedHtml}</li>`;
  }).join('');

  return `<${tag} class="${listClass}">${listItems}</${tag}>`;
};

// 1. Create custom parsers with FORCED Tailwind utility classes
const customParsers = {
  // --- HEADER PARSER ---
  header: (block: any) => {
    const level = block.data.level || 2;
    // Explicitly size the headings so they never look like plain text
    const classes: { [key: number]: string } = {
      1: 'text-4xl font-extrabold text-slate-900 mt-8 mb-4',
      2: 'text-3xl font-bold text-slate-800 mt-6 mb-3 border-b pb-2 border-gray-100',
      3: 'text-2xl font-bold text-slate-800 mt-5 mb-2',
      4: 'text-xl font-semibold text-slate-800 mt-4 mb-2',
      5: 'text-lg font-semibold text-slate-800 mt-3 mb-1',
      6: 'text-base font-semibold text-slate-800 mt-3 mb-1',
    };
    return `<h${level} class="${classes[level]}">${block.data.text}</h${level}>`;
  },

  // --- PARAGRAPH PARSER ---
  paragraph: (block: any) => {
    return `<p class="text-gray-700 leading-relaxed mb-4">${block.data.text}</p>`;
  },

  // --- LIST PARSER (Checklists & Nested Lists) ---
  list: (block: any) => {
    // Handle Checklists
    if (block.data.style === 'checklist') {
      const items = block.data.items.map((item: any) => {
        const isChecked = item.meta?.checked ? 'checked' : '';
        return `<li class="flex items-start gap-3 my-2">
                  <input type="checkbox" disabled ${isChecked} class="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/> 
                  <span class="text-gray-800">${item.content}</span>
                </li>`;
      }).join('');
      return `<ul class="list-none pl-0 my-4 space-y-2">${items}</ul>`;
    }

    // Handle Standard Ordered/Unordered Lists (with nesting)
    return renderNestedList(block.data.items, block.data.style);
  },

  // --- TABLE PARSER ---
  table: (block: any) => {
    const withHeadings = block.data.withHeadings;
    const rows = block.data.content.map((row: string[], rowIndex: number) => {
      const cells = row.map((cell: string) => {
        if (withHeadings && rowIndex === 0) {
          return `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-slate-800">${cell}</th>`;
        }
        return `<td class="border border-gray-300 px-4 py-2 text-gray-700">${cell}</td>`;
      }).join('');
      return `<tr class="hover:bg-gray-50 transition-colors">${cells}</tr>`;
    }).join('');

    return `<div class="overflow-x-auto my-6 rounded-lg border border-gray-200">
              <table class="w-full text-left border-collapse">
                <tbody>${rows}</tbody>
              </table>
            </div>`;
  },

  // --- TOGGLE / FAQ PARSER ---
  toggle: (block: any) => {
    // STRICT ARRAY CHECK to prevent map() crashes
    const nestedHtml = Array.isArray(block.data.items)
      ? block.data.items.map((item: any) => edjsParser.parseBlock(item)).join('')
      : '';

    return `<details class="group border border-gray-200 rounded-lg my-4 bg-gray-50/50 cursor-pointer shadow-sm open:bg-white transition-all">
              <summary class="font-bold list-none flex justify-between items-center p-4 text-slate-800 hover:text-blue-600">
                <span>${block.data.text || ''}</span>
                <span class="transition-transform duration-200 group-open:rotate-180 text-gray-500">▼</span>
              </summary>
              <div class="px-4 pb-4 pt-2 text-gray-700 border-t border-gray-100">
                ${nestedHtml}
              </div>
            </details>`;
  }
};

// 2. Initialize parser with the custom parsers
const edjsParser = edjsHTML(customParsers);

interface EditorRendererProps {
  data: any; 
}

export default function EditorRenderer({ data }: EditorRendererProps) {
  // Strict Safety checks
  if (!data || typeof data !== 'object' || !Array.isArray(data.blocks) || data.blocks.length === 0) {
    return null;
  }

  const parsedResult = edjsParser.parse(data);

  // Safely ensure we have an array of strings to render
  let htmlArray: string[] = [];
  if (Array.isArray(parsedResult)) {
    htmlArray = parsedResult;
  } else if (typeof parsedResult === 'string') {
    htmlArray = [parsedResult];
  } else {
    console.error("Editor.js parsing failed. Unexpected output:", parsedResult);
    return null;
  }

  if (htmlArray.length === 0) return null;

  return (
    <div className="w-full p-4sm:p-6 rounded-xl  mt-12">
      {htmlArray.map((htmlString: string, index: number) => (
        <div 
          key={index} 
          className="editor-block"
          dangerouslySetInnerHTML={{ __html: htmlString }} 
        />
      ))}
    </div>
  );
}