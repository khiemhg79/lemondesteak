@echo off
cd /d "d:\KyHe\QuanLyDuAn\LeMonde Steak\QLDA_253IS60A01_Nhom01_BC1\QLDA_253IS60A01_Nhom01_BC1\QLDA_253IS60A01_Nhom01_BC1_SOURCECODE"
git init
git remote remove origin
git remote add origin https://github.com/khiemhg79/lemondesteak.git
git checkout -B main
git add .
git commit -m "Update LeMonde Steak source code - Realtime orders, VietQR payments, feedback CRM, table order merging"
git push -u origin main --force
echo DONE_GIT_PUSH
