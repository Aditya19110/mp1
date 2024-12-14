import React, { useEffect } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/display/placeholder'; 

const Editor = () => {
  useEffect(() => {
    const editor = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
      mode: { name: 'javascript', json: true },
      autoCloseTags: true,
      autoCloseBrackets:true,
      lineNumbers: true,
      theme: 'dracula',
    });

    return () => editor.toTextArea();
  }, []);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;