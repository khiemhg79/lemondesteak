@echo off
echo ========================================================
echo   PUSHING FINAL LEMONDE STEAK SOURCE CODE TO GITHUB
echo ========================================================
cd /d "d:\KyHe/QuanLyDuAn/LeMonde Steak/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1/QLDA_253IS60A01_Nhom01_BC1_SOURCECODE"
git init
git remote remove origin 2>nul
git remote add origin https://github.com/khiemhg79/lemondesteak.git
git checkout -B main
git add .
git commit -m "Final release: Full LeMonde Steak source code - Realtime orders, VietQR, Customer Feedbacks CRM, Table Order Merging, Admin & Customer Menu Pagination & Infinite Scroll"
git push -u origin main --force
echo ========================================================
echo SUCCESS: Final source code pushed to https://github.com/khiemhg79/lemondesteak.git
echo ========================================================
pause
