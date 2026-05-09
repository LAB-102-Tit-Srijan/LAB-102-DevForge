import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const localUpload = multer({ storage: storage, limits: { fileSize: 2000 * 1024 * 1024 } }); // 2GB limit

export default localUpload;
