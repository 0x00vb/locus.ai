/**
 * File template utilities for initial content based on file extension
 */

export const getInitialContent = (extension: string): string => {
  switch (extension) {
    case 'md':
      return '# New Note\n\nStart writing your markdown here...\n';
    case 'js':
      return '// JavaScript file\nconsole.log("Hello, World!");\n';
    case 'py':
      return '# Python file\nprint("Hello, World!")\n';
    case 'json':
      return '{\n  "name": "example",\n  "value": "data"\n}\n';
    case 'html':
      return '<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n';
    case 'css':
      return '/* CSS file */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n';
    case 'txt':
    default:
      return 'Start writing your note here...\n';
  }
}; 