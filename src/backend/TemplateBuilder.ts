import * as fs from 'fs';
import * as path from 'path';

export type TemplateStructure = {
  [key: string]: string | TemplateStructure;
};

export class TemplateBuilder {
  constructor(private basePath: string) {}

  public build(structure: TemplateStructure): void {
    this.createStructure(this.basePath, structure);
  }

  private createStructure(currentPath: string, structure: TemplateStructure): void {
    for (const name in structure) {
      const value = structure[name];
      const fullPath = path.join(currentPath, name);

      if (typeof value === 'string') {
        this.createFile(fullPath, value);
      } else if (typeof value === 'object') {
        this.createFolder(fullPath);
        this.createStructure(fullPath, value);
      }
    }
  }

  private createFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content);
  }

  private createFolder(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}
