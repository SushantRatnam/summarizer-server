import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import { converToSummarizedText, createTextFromUploadedVideo } from './utils.js';
import multer from 'multer';

//app config
const app = express();
app.use(morgan('dev'));
app.use(cors('*'));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 4000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './store/video');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get('/uri', (req, res) => {
  (async function () {
    console.log('req.query', req.query);
    try {
      const textObj = await converToSummarizedText(req.query.youtubeUrl);
      res.json({
        textObj,
      });
    } catch (error) {
      console.log('API error', error);
    }
  })();
});
app.post('/file', upload.single('file'), async function (req, res) {
  try {
    const textObj = await createTextFromUploadedVideo(req.file.originalname.toString());
    res.json({
      textObj,
    });
  } catch (error) {
    console.log('API error', error);
  }
});

app.listen(PORT, () => console.log(`Server started at port:${PORT}`));
