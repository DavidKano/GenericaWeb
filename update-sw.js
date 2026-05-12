import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.join(__dirname, 'dist', 'sw.js');

if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Generamos un nombre de caché único basado en el momento exacto (timestamp)
  const newCacheName = `app-cache-${Date.now()}`;
  
  // Reemplazamos el nombre antiguo de la caché
  // Esto buscará 'generica-web-v3' o cualquier variante
  content = content.replace(/generica-web-v\d+/, newCacheName);
  
  // Por seguridad extra, inyectamos un comentario en la primera línea con la fecha exacta.
  // Esto asegura matemáticamente que el archivo sw.js cambie en cada compilación.
  content = `// Build Timestamp: ${new Date().toISOString()}\n` + content;
  
  fs.writeFileSync(swPath, content);
  console.log(`\n✅ [PWA] Service Worker actualizado automáticamente con versión: ${newCacheName}\n`);
} else {
  console.warn('\n⚠️ [PWA] Advertencia: No se encontró dist/sw.js tras la compilación.\n');
}
