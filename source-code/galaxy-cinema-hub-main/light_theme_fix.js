const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/manager/ManagerShowtimes.tsx',
  'src/pages/manager/ManagerStaff.tsx',
  'src/pages/manager/ManagerReports.tsx'
];

const basePath = 'd:/webNangCao(PHP)/GalaxyCinema_Project/source-code/galaxy-cinema-hub-main';

filesToFix.forEach(file => {
  const filePath = path.join(basePath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace standalone dark background
    content = content.replace(/bg-\[#1a1a2e\]/g, 'bg-white');
    content = content.replace(/bg-\[#16162a\]/g, 'bg-gray-50');
    
    // Only replace text-white/XX since those are almost always for secondary dark text
    content = content.replace(/text-white\/[0-9]{2}/g, 'text-gray-500');
    
    // Replace text-white ONLY if it does not follow bg-green, bg-red, bg-orange, text-orange, from-orange etc.
    // Instead of regex, let's just do it smart: 
    // Usually buttons have `bg-gradient-to-r from-orange-500 to-amber-500 text-white`.
    // And normal texts have `text-white`.
    content = content.replace(/className="(.*?)"/g, (match, classStr) => {
      // If it has colored background, leave text-white alone
      if (classStr.includes('bg-orange') || classStr.includes('from-orange') || classStr.includes('bg-green') || classStr.includes('bg-red')) {
        return `className="${classStr}"`;
      }
      // Otherwise safe to replace text-white with text-gray-900
      let newClass = classStr.replace(/\btext-white\b/g, 'text-gray-900');
      newClass = newClass.replace(/bg-white\/5/g, 'bg-white border-gray-200');
      newClass = newClass.replace(/bg-white\/10/g, 'bg-gray-100');
      newClass = newClass.replace(/bg-white\/20/g, 'bg-gray-200');
      newClass = newClass.replace(/hover:bg-white\/[0-9]{1,2}/g, 'hover:bg-gray-100');
      newClass = newClass.replace(/border-white\/[0-9]{2}/g, 'border-gray-200');
      newClass = newClass.replace(/hover:text-white\b/g, 'hover:text-gray-900');
      newClass = newClass.replace(/\[&>option\]:bg-\[#1a1a2e\]/g, '');
      return `className="${newClass}"`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
