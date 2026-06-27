// components/tools.ts
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import ToggleBlock from 'editorjs-toggle-block';

export const EDITOR_TOOLS: { [key: string]: any } = {
  paragraph: {
    class: Paragraph as any,
    inlineToolbar: true,
  },
  header: {
    class: Header as any,
    inlineToolbar: ['link'],
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
    },
  },
  list: {
    class: List as any,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered',
    },
  },
  // --- NEW: Table Tool ---
  table: {
    class: Table as any,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3,// Allows users to set the first row as a header
    },
  },
  // --- NEW: FAQ / Toggle Tool ---
  toggle: {
    class: ToggleBlock as any,
    inlineToolbar: true,
  },
};