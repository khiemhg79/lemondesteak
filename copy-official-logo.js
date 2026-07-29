const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\3df8e1db-8589-478e-9779-d837d230ae8a\\media__1785336400123.png';

const targets = [
  'd:/KyHe/QuanLyDuAn/LeMonde Steak/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1_SOURCECODE/frontend/customer/public',
  'd:/KyHe/QuanLyDuAn/LeMonde Steak/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1_SOURCECODE/frontend/staff/public',
  'd:/KyHe/QuanLyDuAn/LeMonde Steak/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1_SOURCECODE/frontend/admin/public'
];

targets.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy to favicon.png
  fs.copyFileSync(srcPath, path.join(targetDir, 'favicon.png'));
  // Copy to logo.png
  fs.copyFileSync(srcPath, path.join(targetDir, 'logo.png'));
  console.log(`Copied logo to ${targetDir}`);
});
