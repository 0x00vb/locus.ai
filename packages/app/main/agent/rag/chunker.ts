export interface ChunkResult {
  chunks: string[];
  metadata: ChunkMetadata[];
}

export interface ChunkMetadata {
  startLine: number;
  endLine: number;
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'import' | 'export' | 'comment' | 'text';
  name?: string;
}

export class CodeChunker {
  constructor() {
    // No tree-sitter initialization needed for renderer version
  }

  /**
   * Main chunking function that routes to appropriate chunking strategy
   */
  async chunkFile(filePath: string, content: string): Promise<ChunkResult> {
    const ext = this.getFileExtension(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx':
        return this.chunkCodeFile(content);
      case '.md':
      case '.txt':
        return this.chunkTextFile(content);
      default:
        return this.chunkTextBased(content);
    }
  }

  /**
   * Get file extension from path
   */
  private getFileExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filePath.substring(lastDotIndex);
  }

  /**
   * Text-based chunking for code files using regex patterns
   */
  private chunkCodeFile(content: string): ChunkResult {
    const chunks: string[] = [];
    const metadata: ChunkMetadata[] = [];
    const lines = content.split('\n');

    let currentChunk = '';
    let chunkStartLine = 1;
    let lineNumber = 1;

    // Patterns for code constructs
    const patterns = {
      function: /^\s*(export\s+)?(async\s+)?function\s+(\w+)|^\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/,
      class: /^\s*(export\s+)?(abstract\s+)?class\s+(\w+)/,
      interface: /^\s*(export\s+)?interface\s+(\w+)/,
      type: /^\s*(export\s+)?type\s+(\w+)/,
      import: /^\s*import\s+/,
      export: /^\s*export\s+(?!.*from)/,
      comment: /^\s*(\/\/|\/\*|\*)/
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for code constructs
      let foundConstruct = false;
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          // Save previous chunk if it exists
          if (currentChunk.trim()) {
            this.addChunk(chunks, metadata, currentChunk, chunkStartLine, lineNumber - 1, 'text');
          }

          // Start new chunk
          currentChunk = line + '\n';
          chunkStartLine = lineNumber;
          
          // Extract name for named constructs
          const name = this.extractNameFromLine(line, type);
          
          // For single-line constructs, complete the chunk
          if (type === 'import' || type === 'export' || type === 'type' || this.isSingleLineConstruct(line)) {
            this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber, type as any, name);
            currentChunk = '';
            chunkStartLine = lineNumber + 1;
          }
          
          foundConstruct = true;
          break;
        }
      }

      if (!foundConstruct) {
        currentChunk += line + '\n';
        
        // Check for function/class/interface end
        if (this.isBlockEnd(line) && currentChunk.length > 100) {
          // Try to determine the type of the current chunk
          const chunkType = this.inferChunkType(currentChunk);
          const name = this.extractNameFromChunk(currentChunk, chunkType);
          this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber, chunkType, name);
          currentChunk = '';
          chunkStartLine = lineNumber + 1;
        }
      }

      lineNumber++;
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      const chunkType = this.inferChunkType(currentChunk);
      const name = this.extractNameFromChunk(currentChunk, chunkType);
      this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber - 1, chunkType, name);
    }

    return { chunks, metadata };
  }

  /**
   * Check if a line represents a single-line construct
   */
  private isSingleLineConstruct(line: string): boolean {
    return /;\s*$/.test(line) || line.includes('=>') && line.includes(';');
  }

  /**
   * Check if a line represents the end of a code block
   */
  private isBlockEnd(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '}' || trimmed === '};' || trimmed.endsWith('});');
  }

  /**
   * Infer the type of a code chunk
   */
  private inferChunkType(chunk: string): ChunkMetadata['type'] {
    if (/^\s*(export\s+)?(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>/m.test(chunk)) {
      return 'function';
    }
    if (/^\s*(export\s+)?(abstract\s+)?class\s+\w+/m.test(chunk)) {
      return 'class';
    }
    if (/^\s*(export\s+)?interface\s+\w+/m.test(chunk)) {
      return 'interface';
    }
    if (/^\s*(export\s+)?type\s+\w+/m.test(chunk)) {
      return 'type';
    }
    if (/^\s*import\s+/m.test(chunk)) {
      return 'import';
    }
    if (/^\s*export\s+/m.test(chunk)) {
      return 'export';
    }
    if (/^\s*(\/\/|\/\*|\*)/m.test(chunk)) {
      return 'comment';
    }
    return 'text';
  }

  /**
   * Extract name from a line based on construct type
   */
  private extractNameFromLine(line: string, type: string): string | undefined {
    switch (type) {
      case 'function':
        const funcMatch = line.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        return funcMatch ? (funcMatch[1] || funcMatch[2]) : undefined;
      case 'class':
        const classMatch = line.match(/class\s+(\w+)/);
        return classMatch ? classMatch[1] : undefined;
      case 'interface':
        const interfaceMatch = line.match(/interface\s+(\w+)/);
        return interfaceMatch ? interfaceMatch[1] : undefined;
      case 'type':
        const typeMatch = line.match(/type\s+(\w+)/);
        return typeMatch ? typeMatch[1] : undefined;
      default:
        return undefined;
    }
  }

  /**
   * Extract name from a chunk based on construct type
   */
  private extractNameFromChunk(chunk: string, type: ChunkMetadata['type']): string | undefined {
    const firstLine = chunk.split('\n')[0];
    return this.extractNameFromLine(firstLine, type);
  }

  /**
   * Add a chunk to the results
   */
  private addChunk(
    chunks: string[],
    metadata: ChunkMetadata[],
    chunk: string,
    startLine: number,
    endLine: number,
    type: ChunkMetadata['type'],
    name?: string
  ): void {
    if (chunk.trim().length > 10) { // Only add meaningful chunks
      chunks.push(chunk);
      metadata.push({
        startLine,
        endLine,
        type,
        name
      });
    }
  }

  /**
   * Text-based chunking for markdown and text files
   */
  private chunkTextFile(content: string): ChunkResult {
    const chunks: string[] = [];
    const metadata: ChunkMetadata[] = [];
    const lines = content.split('\n');

    let currentChunk = '';
    let chunkStartLine = 1;
    let lineNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for markdown headers
      if (trimmedLine.startsWith('#')) {
        // Save previous chunk
        if (currentChunk.trim()) {
          this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber - 1, 'text');
        }
        
        // Start new chunk with header
        currentChunk = line + '\n';
        chunkStartLine = lineNumber;
      } else {
        currentChunk += line + '\n';
        
        // Split on double newlines or when chunk gets too large
        if ((trimmedLine === '' && currentChunk.length > 500) || currentChunk.length > 2000) {
          if (currentChunk.trim()) {
            this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber, 'text');
            currentChunk = '';
            chunkStartLine = lineNumber + 1;
          }
        }
      }

      lineNumber++;
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      this.addChunk(chunks, metadata, currentChunk.trim(), chunkStartLine, lineNumber - 1, 'text');
    }

    return { chunks, metadata };
  }

  /**
   * Fallback text-based chunking for unknown file types
   */
  private chunkTextBased(content: string, maxLines: number = 50): ChunkResult {
    const chunks: string[] = [];
    const metadata: ChunkMetadata[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i += maxLines) {
      const chunkLines = lines.slice(i, i + maxLines);
      const chunk = chunkLines.join('\n');
      
      if (chunk.trim()) {
        chunks.push(chunk);
        metadata.push({
          startLine: i + 1,
          endLine: Math.min(i + maxLines, lines.length),
          type: 'text'
        });
      }
    }

    return { chunks, metadata };
  }

  /**
   * Alternative chunking method with size limit
   */
  chunkWithSizeLimit(content: string, maxChunkSize: number = 1000): ChunkResult {
    const chunks: string[] = [];
    const metadata: ChunkMetadata[] = [];
    const lines = content.split('\n');

    let currentChunk = '';
    let chunkStartLine = 1;
    let lineNumber = 1;

    for (const line of lines) {
      const potentialChunk = currentChunk + line + '\n';
      
      if (potentialChunk.length > maxChunkSize && currentChunk.trim()) {
        // Save current chunk
        chunks.push(currentChunk.trim());
        metadata.push({
          startLine: chunkStartLine,
          endLine: lineNumber - 1,
          type: 'text'
        });
        
        // Start new chunk
        currentChunk = line + '\n';
        chunkStartLine = lineNumber;
      } else {
        currentChunk = potentialChunk;
      }

      lineNumber++;
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      metadata.push({
        startLine: chunkStartLine,
        endLine: lineNumber - 1,
        type: 'text'
      });
    }

    return { chunks, metadata };
  }
} 