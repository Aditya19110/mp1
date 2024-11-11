import React, { useEffect } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/display/placeholder'; // Optional: for placeholder text

const Editor = () => {
  useEffect(() => {
    // Ensuring Codemirror is initialized after the DOM is ready
    const editor = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
      mode: { name: 'javascript', json: true },
      autoCloseTags: true,
      autoCloseBrackets:true,
      lineNumbers: true, // Corrected line
      theme: 'dracula',  // Optional: Use a theme like 'material' if preferred
    });

    // Cleanup function to destroy editor on unmount
    return () => editor.toTextArea();
  }, []);

  return <textarea id="realtimeEditor" placeholder="Start typing..."></textarea>;
};

export default Editor;