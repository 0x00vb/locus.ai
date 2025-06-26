/**
 * Language detection utility for file extensions
 * Maps file extensions to programming language identifiers
 */

export interface LanguageInfo {
  name: string;
  extension: string;
  syntax: string;
  category: 'web' | 'system' | 'data' | 'mobile' | 'document' | 'config';
}

/**
 * Comprehensive mapping of file extensions to language information
 */
const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  // Web frontend
  '.js': { name: 'JavaScript', extension: '.js', syntax: 'javascript', category: 'web' },
  '.jsx': { name: 'JavaScript React', extension: '.jsx', syntax: 'javascript', category: 'web' },
  '.ts': { name: 'TypeScript', extension: '.ts', syntax: 'typescript', category: 'web' },
  '.tsx': { name: 'TypeScript React', extension: '.tsx', syntax: 'typescript', category: 'web' },
  '.vue': { name: 'Vue.js', extension: '.vue', syntax: 'vue', category: 'web' },
  '.svelte': { name: 'Svelte', extension: '.svelte', syntax: 'svelte', category: 'web' },
  '.mjs': { name: 'JavaScript Module', extension: '.mjs', syntax: 'javascript', category: 'web' },
  '.cjs': { name: 'CommonJS Module', extension: '.cjs', syntax: 'javascript', category: 'web' },
  
  // Web styling
  '.css': { name: 'CSS', extension: '.css', syntax: 'css', category: 'web' },
  '.scss': { name: 'SCSS', extension: '.scss', syntax: 'scss', category: 'web' },
  '.sass': { name: 'Sass', extension: '.sass', syntax: 'sass', category: 'web' },
  '.less': { name: 'Less', extension: '.less', syntax: 'less', category: 'web' },
  '.styl': { name: 'Stylus', extension: '.styl', syntax: 'stylus', category: 'web' },
  '.postcss': { name: 'PostCSS', extension: '.postcss', syntax: 'css', category: 'web' },
  
  // Web markup
  '.html': { name: 'HTML', extension: '.html', syntax: 'html', category: 'web' },
  '.htm': { name: 'HTML', extension: '.htm', syntax: 'html', category: 'web' },
  '.xhtml': { name: 'XHTML', extension: '.xhtml', syntax: 'html', category: 'web' },
  '.xml': { name: 'XML', extension: '.xml', syntax: 'xml', category: 'data' },
  '.svg': { name: 'SVG', extension: '.svg', syntax: 'xml', category: 'web' },
  '.pug': { name: 'Pug', extension: '.pug', syntax: 'pug', category: 'web' },
  '.jade': { name: 'Jade', extension: '.jade', syntax: 'jade', category: 'web' },
  '.ejs': { name: 'EJS', extension: '.ejs', syntax: 'ejs', category: 'web' },
  '.hbs': { name: 'Handlebars', extension: '.hbs', syntax: 'handlebars', category: 'web' },
  '.mustache': { name: 'Mustache', extension: '.mustache', syntax: 'mustache', category: 'web' },
  
  // System programming
  '.py': { name: 'Python', extension: '.py', syntax: 'python', category: 'system' },
  '.py3': { name: 'Python 3', extension: '.py3', syntax: 'python', category: 'system' },
  '.pyw': { name: 'Python Windows', extension: '.pyw', syntax: 'python', category: 'system' },
  '.pyx': { name: 'Cython', extension: '.pyx', syntax: 'python', category: 'system' },
  '.go': { name: 'Go', extension: '.go', syntax: 'go', category: 'system' },
  '.rs': { name: 'Rust', extension: '.rs', syntax: 'rust', category: 'system' },
  '.c': { name: 'C', extension: '.c', syntax: 'c', category: 'system' },
  '.cpp': { name: 'C++', extension: '.cpp', syntax: 'cpp', category: 'system' },
  '.cxx': { name: 'C++', extension: '.cxx', syntax: 'cpp', category: 'system' },
  '.cc': { name: 'C++', extension: '.cc', syntax: 'cpp', category: 'system' },
  '.c++': { name: 'C++', extension: '.c++', syntax: 'cpp', category: 'system' },
  '.h': { name: 'C Header', extension: '.h', syntax: 'c', category: 'system' },
  '.hpp': { name: 'C++ Header', extension: '.hpp', syntax: 'cpp', category: 'system' },
  '.hxx': { name: 'C++ Header', extension: '.hxx', syntax: 'cpp', category: 'system' },
  '.h++': { name: 'C++ Header', extension: '.h++', syntax: 'cpp', category: 'system' },
  
  // .NET languages
  '.cs': { name: 'C#', extension: '.cs', syntax: 'csharp', category: 'system' },
  '.vb': { name: 'Visual Basic', extension: '.vb', syntax: 'vb', category: 'system' },
  '.fs': { name: 'F#', extension: '.fs', syntax: 'fsharp', category: 'system' },
  
  // JVM languages
  '.java': { name: 'Java', extension: '.java', syntax: 'java', category: 'system' },
  '.kt': { name: 'Kotlin', extension: '.kt', syntax: 'kotlin', category: 'system' },
  '.kts': { name: 'Kotlin Script', extension: '.kts', syntax: 'kotlin', category: 'system' },
  '.scala': { name: 'Scala', extension: '.scala', syntax: 'scala', category: 'system' },
  '.groovy': { name: 'Groovy', extension: '.groovy', syntax: 'groovy', category: 'system' },
  '.gradle': { name: 'Gradle', extension: '.gradle', syntax: 'groovy', category: 'config' },
  
  // Mobile
  '.swift': { name: 'Swift', extension: '.swift', syntax: 'swift', category: 'mobile' },
  '.dart': { name: 'Dart', extension: '.dart', syntax: 'dart', category: 'mobile' },
  '.m': { name: 'Objective-C', extension: '.m', syntax: 'objc', category: 'mobile' },
  '.mm': { name: 'Objective-C++', extension: '.mm', syntax: 'objcpp', category: 'mobile' },
  
  // Dynamic languages
  '.rb': { name: 'Ruby', extension: '.rb', syntax: 'ruby', category: 'system' },
  '.rbw': { name: 'Ruby Windows', extension: '.rbw', syntax: 'ruby', category: 'system' },
  '.php': { name: 'PHP', extension: '.php', syntax: 'php', category: 'web' },
  '.php3': { name: 'PHP 3', extension: '.php3', syntax: 'php', category: 'web' },
  '.php4': { name: 'PHP 4', extension: '.php4', syntax: 'php', category: 'web' },
  '.php5': { name: 'PHP 5', extension: '.php5', syntax: 'php', category: 'web' },
  '.phtml': { name: 'PHP HTML', extension: '.phtml', syntax: 'php', category: 'web' },
  '.pl': { name: 'Perl', extension: '.pl', syntax: 'perl', category: 'system' },
  '.pm': { name: 'Perl Module', extension: '.pm', syntax: 'perl', category: 'system' },
  '.lua': { name: 'Lua', extension: '.lua', syntax: 'lua', category: 'system' },
  
  // Functional languages
  '.hs': { name: 'Haskell', extension: '.hs', syntax: 'haskell', category: 'system' },
  '.lhs': { name: 'Literate Haskell', extension: '.lhs', syntax: 'haskell', category: 'system' },
  '.elm': { name: 'Elm', extension: '.elm', syntax: 'elm', category: 'web' },
  '.clj': { name: 'Clojure', extension: '.clj', syntax: 'clojure', category: 'system' },
  '.cljs': { name: 'ClojureScript', extension: '.cljs', syntax: 'clojure', category: 'web' },
  '.cljc': { name: 'Clojure Common', extension: '.cljc', syntax: 'clojure', category: 'system' },
  '.ml': { name: 'OCaml', extension: '.ml', syntax: 'ocaml', category: 'system' },
  '.mli': { name: 'OCaml Interface', extension: '.mli', syntax: 'ocaml', category: 'system' },
  '.ex': { name: 'Elixir', extension: '.ex', syntax: 'elixir', category: 'system' },
  '.exs': { name: 'Elixir Script', extension: '.exs', syntax: 'elixir', category: 'system' },
  '.erl': { name: 'Erlang', extension: '.erl', syntax: 'erlang', category: 'system' },
  '.hrl': { name: 'Erlang Header', extension: '.hrl', syntax: 'erlang', category: 'system' },
  
  // Data formats
  '.json': { name: 'JSON', extension: '.json', syntax: 'json', category: 'data' },
  '.json5': { name: 'JSON5', extension: '.json5', syntax: 'json5', category: 'data' },
  '.jsonc': { name: 'JSON with Comments', extension: '.jsonc', syntax: 'jsonc', category: 'data' },
  '.yaml': { name: 'YAML', extension: '.yaml', syntax: 'yaml', category: 'config' },
  '.yml': { name: 'YAML', extension: '.yml', syntax: 'yaml', category: 'config' },
  '.toml': { name: 'TOML', extension: '.toml', syntax: 'toml', category: 'config' },
  '.ini': { name: 'INI', extension: '.ini', syntax: 'ini', category: 'config' },
  '.conf': { name: 'Configuration', extension: '.conf', syntax: 'ini', category: 'config' },
  '.config': { name: 'Configuration', extension: '.config', syntax: 'ini', category: 'config' },
  '.csv': { name: 'CSV', extension: '.csv', syntax: 'csv', category: 'data' },
  '.tsv': { name: 'TSV', extension: '.tsv', syntax: 'tsv', category: 'data' },
  '.properties': { name: 'Properties', extension: '.properties', syntax: 'properties', category: 'config' },
  
  // Documentation
  '.md': { name: 'Markdown', extension: '.md', syntax: 'markdown', category: 'document' },
  '.markdown': { name: 'Markdown', extension: '.markdown', syntax: 'markdown', category: 'document' },
  '.mdown': { name: 'Markdown', extension: '.mdown', syntax: 'markdown', category: 'document' },
  '.mkd': { name: 'Markdown', extension: '.mkd', syntax: 'markdown', category: 'document' },
  '.mdx': { name: 'MDX', extension: '.mdx', syntax: 'mdx', category: 'document' },
  '.tex': { name: 'LaTeX', extension: '.tex', syntax: 'latex', category: 'document' },
  '.ltx': { name: 'LaTeX', extension: '.ltx', syntax: 'latex', category: 'document' },
  '.rst': { name: 'reStructuredText', extension: '.rst', syntax: 'rst', category: 'document' },
  '.rest': { name: 'reStructuredText', extension: '.rest', syntax: 'rst', category: 'document' },
  '.adoc': { name: 'AsciiDoc', extension: '.adoc', syntax: 'asciidoc', category: 'document' },
  '.asciidoc': { name: 'AsciiDoc', extension: '.asciidoc', syntax: 'asciidoc', category: 'document' },
  '.txt': { name: 'Plain Text', extension: '.txt', syntax: 'text', category: 'document' },
  '.text': { name: 'Plain Text', extension: '.text', syntax: 'text', category: 'document' },
  
  // Shell scripts
  '.sh': { name: 'Shell Script', extension: '.sh', syntax: 'bash', category: 'system' },
  '.bash': { name: 'Bash Script', extension: '.bash', syntax: 'bash', category: 'system' },
  '.zsh': { name: 'Zsh Script', extension: '.zsh', syntax: 'bash', category: 'system' },
  '.fish': { name: 'Fish Script', extension: '.fish', syntax: 'fish', category: 'system' },
  '.ps1': { name: 'PowerShell', extension: '.ps1', syntax: 'powershell', category: 'system' },
  '.psm1': { name: 'PowerShell Module', extension: '.psm1', syntax: 'powershell', category: 'system' },
  '.psd1': { name: 'PowerShell Data', extension: '.psd1', syntax: 'powershell', category: 'system' },
  '.bat': { name: 'Batch Script', extension: '.bat', syntax: 'batch', category: 'system' },
  '.cmd': { name: 'Command Script', extension: '.cmd', syntax: 'batch', category: 'system' },
  
  // Config files
  '.dockerfile': { name: 'Dockerfile', extension: '.dockerfile', syntax: 'dockerfile', category: 'config' },
  '.dockerignore': { name: 'Docker Ignore', extension: '.dockerignore', syntax: 'gitignore', category: 'config' },
  '.gitignore': { name: 'Git Ignore', extension: '.gitignore', syntax: 'gitignore', category: 'config' },
  '.gitattributes': { name: 'Git Attributes', extension: '.gitattributes', syntax: 'gitattributes', category: 'config' },
  '.editorconfig': { name: 'EditorConfig', extension: '.editorconfig', syntax: 'editorconfig', category: 'config' },
  '.env': { name: 'Environment', extension: '.env', syntax: 'dotenv', category: 'config' },
  '.env.local': { name: 'Environment Local', extension: '.env.local', syntax: 'dotenv', category: 'config' },
  '.env.example': { name: 'Environment Example', extension: '.env.example', syntax: 'dotenv', category: 'config' },
  '.prettierrc': { name: 'Prettier Config', extension: '.prettierrc', syntax: 'json', category: 'config' },
  '.eslintrc': { name: 'ESLint Config', extension: '.eslintrc', syntax: 'json', category: 'config' },
  
  // Package managers
  'package.json': { name: 'NPM Package', extension: 'package.json', syntax: 'json', category: 'config' },
  'package-lock.json': { name: 'NPM Lock', extension: 'package-lock.json', syntax: 'json', category: 'config' },
  'yarn.lock': { name: 'Yarn Lock', extension: 'yarn.lock', syntax: 'yaml', category: 'config' },
  'pnpm-lock.yaml': { name: 'PNPM Lock', extension: 'pnpm-lock.yaml', syntax: 'yaml', category: 'config' },
  'composer.json': { name: 'Composer Package', extension: 'composer.json', syntax: 'json', category: 'config' },
  'composer.lock': { name: 'Composer Lock', extension: 'composer.lock', syntax: 'json', category: 'config' },
  'requirements.txt': { name: 'Python Requirements', extension: 'requirements.txt', syntax: 'text', category: 'config' },
  'Pipfile': { name: 'Pipenv File', extension: 'Pipfile', syntax: 'toml', category: 'config' },
  'Pipfile.lock': { name: 'Pipenv Lock', extension: 'Pipfile.lock', syntax: 'json', category: 'config' },
  'Gemfile': { name: 'Ruby Gemfile', extension: 'Gemfile', syntax: 'ruby', category: 'config' },
  'Gemfile.lock': { name: 'Ruby Gemfile Lock', extension: 'Gemfile.lock', syntax: 'text', category: 'config' },
  'Cargo.toml': { name: 'Rust Cargo', extension: 'Cargo.toml', syntax: 'toml', category: 'config' },
  'Cargo.lock': { name: 'Rust Cargo Lock', extension: 'Cargo.lock', syntax: 'toml', category: 'config' },
  'go.mod': { name: 'Go Module', extension: 'go.mod', syntax: 'go-mod', category: 'config' },
  'go.sum': { name: 'Go Sum', extension: 'go.sum', syntax: 'text', category: 'config' },
  
  // SQL
  '.sql': { name: 'SQL', extension: '.sql', syntax: 'sql', category: 'data' },
  '.sqlite': { name: 'SQLite', extension: '.sqlite', syntax: 'sql', category: 'data' },
  '.sqlite3': { name: 'SQLite3', extension: '.sqlite3', syntax: 'sql', category: 'data' },
  '.db': { name: 'Database', extension: '.db', syntax: 'sql', category: 'data' },
  
  // Assembly
  '.asm': { name: 'Assembly', extension: '.asm', syntax: 'assembly', category: 'system' },
  '.s': { name: 'Assembly', extension: '.s', syntax: 'assembly', category: 'system' },
  '.S': { name: 'Assembly Source', extension: '.S', syntax: 'assembly', category: 'system' },
  
  // Other specialized formats
  '.r': { name: 'R', extension: '.r', syntax: 'r', category: 'system' },
  '.R': { name: 'R', extension: '.R', syntax: 'r', category: 'system' },
  '.rmd': { name: 'R Markdown', extension: '.rmd', syntax: 'rmarkdown', category: 'document' },
  '.Rmd': { name: 'R Markdown', extension: '.Rmd', syntax: 'rmarkdown', category: 'document' },
  '.jl': { name: 'Julia', extension: '.jl', syntax: 'julia', category: 'system' },
  '.mat': { name: 'MATLAB', extension: '.mat', syntax: 'matlab', category: 'system' },
  '.nb': { name: 'Mathematica', extension: '.nb', syntax: 'mathematica', category: 'system' },
  '.wl': { name: 'Wolfram Language', extension: '.wl', syntax: 'wolfram', category: 'system' },
  '.vim': { name: 'Vim Script', extension: '.vim', syntax: 'vim', category: 'config' },
  '.vimrc': { name: 'Vim Config', extension: '.vimrc', syntax: 'vim', category: 'config' },
};

/**
 * Detect programming language from file extension
 * @param ext File extension (with or without leading dot)
 * @returns Language syntax identifier
 */
export function detectLanguageFromExt(ext: string): string {
  if (!ext) return 'text';
  
  // Ensure extension starts with dot
  const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  
  const languageInfo = LANGUAGE_MAP[normalizedExt];
  return languageInfo?.syntax || 'text';
}

/**
 * Get comprehensive language information from file extension
 * @param ext File extension (with or without leading dot)
 * @returns Language information object or null
 */
export function getLanguageInfo(ext: string): LanguageInfo | null {
  if (!ext) return null;
  
  // Ensure extension starts with dot
  const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  
  return LANGUAGE_MAP[normalizedExt] || null;
}

/**
 * Detect language from full file path
 * @param filePath Full file path
 * @returns Language syntax identifier
 */
export function detectLanguageFromPath(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return 'text';
  
  const ext = filePath.slice(lastDot);
  return detectLanguageFromExt(ext);
}

/**
 * Get language information from full file path
 * @param filePath Full file path
 * @returns Language information object or null
 */
export function getLanguageInfoFromPath(filePath: string): LanguageInfo | null {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1) return null;
  
  const ext = filePath.slice(lastDot);
  return getLanguageInfo(ext);
}

/**
 * Check if a file extension is supported (has language mapping)
 * @param ext File extension (with or without leading dot)
 * @returns True if language is supported
 */
export function isLanguageSupported(ext: string): boolean {
  if (!ext) return false;
  
  const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return normalizedExt in LANGUAGE_MAP;
}

/**
 * Get all supported file extensions
 * @returns Array of supported extensions
 */
export function getSupportedExtensions(): string[] {
  return Object.keys(LANGUAGE_MAP);
}

/**
 * Get languages by category
 * @param category Language category
 * @returns Array of language info objects
 */
export function getLanguagesByCategory(category: LanguageInfo['category']): LanguageInfo[] {
  return Object.values(LANGUAGE_MAP).filter(lang => lang.category === category);
}

/**
 * Infer if a language is compatible with another (for validation)
 * @param sourceExt Source file extension
 * @param targetExt Target file extension
 * @returns True if languages are compatible
 */
export function areLanguagesCompatible(sourceExt: string, targetExt: string): boolean {
  const sourceLang = getLanguageInfo(sourceExt);
  const targetLang = getLanguageInfo(targetExt);
  
  if (!sourceLang || !targetLang) return false;
  
  // Same language
  if (sourceLang.syntax === targetLang.syntax) return true;
  
  // Compatible web languages
  const webCompatible = ['javascript', 'typescript'];
  if (webCompatible.includes(sourceLang.syntax) && webCompatible.includes(targetLang.syntax)) {
    return true;
  }
  
  // CSS variants
  const cssCompatible = ['css', 'scss', 'sass', 'less'];
  if (cssCompatible.includes(sourceLang.syntax) && cssCompatible.includes(targetLang.syntax)) {
    return true;
  }
  
  // C family
  const cCompatible = ['c', 'cpp'];
  if (cCompatible.includes(sourceLang.syntax) && cCompatible.includes(targetLang.syntax)) {
    return true;
  }
  
  return false;
} 