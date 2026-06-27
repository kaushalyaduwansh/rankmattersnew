// components/Editor.tsx
'use client'; 

import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { EDITOR_TOOLS } from './tools';

// Updated interface to accept 'data' instead of 'initialData'
interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
}

const Editor = ({ data, onChange }: EditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    // Initialize editor only if it doesn't exist yet
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: 'editorjs-container',
        tools: EDITOR_TOOLS,
        
        // Use the passed data, or default to empty blocks
        data: data || { blocks: [] }, 
        
        autofocus: true,
        placeholder: 'Start typing your content here...',
        
        // Handle changes and pass data back to parent
        async onChange(api) {
          try {
            const savedData = await api.saver.save();
            onChange(savedData);
          } catch (error) {
            console.error('Saving failed: ', error);
          }
        },
      });

      editorRef.current = editor;
    }

    // Cleanup function to destroy the editor when the component unmounts
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    // The "prose" class ensures Tailwind styles your headings and lists correctly
    <div 
      id="editorjs-container" 
      className="prose max-w-none w-full min-h-[300px] border border-gray-300 rounded-lg p-6 bg-white shadow-sm"
    />
  );
};

export default Editor;