# หาสถานีตำรวจเขตอำนาจสอบสวน

หน้าเว็บ static ค้นหาจากตำบล + อำเภอ (ไม่ต้องใส่จังหวัด)

## วิธีเผยแพร่
1. push โฟลเดอร์นี้เป็น repo สาธารณะของตัวเอง
2. Settings → Pages → Deploy from a branch → branch `main` / `/ (root)`

## ข้อมูล
`jurisdiction.js`, `jurisdiction.json`, `thai-admin.json` เป็นสำเนาจาก `สร้างคดีออนไลน์/extension` ถ้าข้อมูลเปลี่ยนให้รัน `scripts/build-jurisdiction.mjs` แล้วคัดลอกมาทับใหม่
