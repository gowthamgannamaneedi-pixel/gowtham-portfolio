import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'copy-frames',
      closeBundle() {
        const srcDir = path.resolve(__dirname, 'frames');
        const destDir = path.resolve(__dirname, 'dist', 'frames');
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true });
          console.log('[vite] Successfully copied frames/ into dist/frames');
        }
      }
    }
  ]
});
