import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_NAMES = {
  'clinica-nova-dp': 'Clínica Nova',
  'motorfix-gr': 'Motorfix',
  'novabeauty-studio': 'Nova Beauty Studio',
  'urbancut-hair': 'Urban Cut Hair',
  'nova-zen': 'Nova Zen',
  'carmencamacho-peluqueria': 'Carmen Camacho Peluquería'
};

const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Error: Debes especificar el ID del proyecto de Firebase.');
  console.log('Ejemplo: node deploy.js carmencamacho-peluqueria');
  process.exit(1);
}

const businessName = PROJECT_NAMES[projectId] || projectId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

console.log(`\n🚀 Iniciando despliegue personalizado para: ${businessName} (${projectId})`);

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('📦 No se detectó la carpeta dist. Compilando proyecto...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error al compilar el proyecto:', error);
    process.exit(1);
  }
}

// Leer index.html de dist
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Reemplazar o inyectar las meta tags dinámicas en dist/index.html
const titleTag = `<title>${businessName}</title>`;
const descriptionTag = `<meta name="description" content="Plataforma de gestión de reservas de ${businessName}." />`;

// og: tags
const ogTags = `
    <title>${businessName}</title>
    <meta name="description" content="Plataforma de gestión de reservas de ${businessName}." />
    <meta property="og:title" content="${businessName}" />
    <meta property="og:description" content="Plataforma de gestión de reservas de ${businessName}." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://${projectId}.web.app" />
`;

// Reemplazar la meta descripción y el título base
htmlContent = htmlContent.replace(/<meta name="description"[^>]*\/>/, descriptionTag);
htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/, titleTag);

// Insertar og: tags antes de </head>
if (!htmlContent.includes('og:title')) {
  htmlContent = htmlContent.replace('</head>', `${ogTags}\n  </head>`);
} else {
  // Si ya tiene og:title, los actualizamos
  htmlContent = htmlContent.replace(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${businessName}" />`);
  htmlContent = htmlContent.replace(/<meta property="og:description"[^>]*\/>/, `<meta property="og:description" content="Plataforma de gestión de reservas de ${businessName}." />`);
  htmlContent = htmlContent.replace(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="https://${projectId}.web.app" />`);
}

// Escribir los cambios a dist/index.html
fs.writeFileSync(indexPath, htmlContent, 'utf8');
console.log(`✅ [Metatags] dist/index.html personalizado con éxito.`);

// Ejecutar el deploy de Firebase
console.log(`📡 Subiendo a Firebase Hosting (${projectId})...`);
try {
  execSync(`firebase deploy --only hosting,firestore:rules,storage --project ${projectId}`, { stdio: 'inherit' });
  console.log(`\n🎉 ¡Despliegue exitoso para ${businessName}!`);
} catch (error) {
  console.error(`❌ Error durante el despliegue de Firebase:`, error);
  process.exit(1);
}
