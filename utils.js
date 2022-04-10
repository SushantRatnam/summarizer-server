import deepai from 'deepai';
import ytdl from 'ytdl-core';
import * as fs from 'fs';
import path from 'path';
import { Deepgram } from '@deepgram/sdk';

const DEEP_AI_KEY = process.env.DEEP_AI_KEY;
const DG_KEY = process.env.DG_KEY;
deepai.setApiKey(DEEP_AI_KEY);

async function convertToText(location, videoId) {
  if (DG_KEY === undefined) {
    throw 'You must define DG_KEY in your .env file';
  }
  const mimetype = 'audio/mpeg';
  const deepgram = new Deepgram(DG_KEY);

  let source;
  const audio = fs.readFileSync(location);
  source = {
    buffer: audio,
    mimetype: mimetype,
  };

  const response = await deepgram.transcription
    .preRecorded(source, {
      punctuate: true,
    })
    .catch((err) => {
      console.log('error ======', err);
    });
  const fullText = response.results.channels[0].alternatives[0].transcript;
  const summarizedText = await deepai.callStandardApi('summarization', { text: fullText });
  const taggedText = await deepai.callStandardApi('text-tagging', { text: fullText });
  return {
    fullText,
    summarizedText,
    taggedText
  };
}

export const converToSummarizedText = async (link) => {
  const info = await ytdl.getInfo(link, { quality: 'highestaudio' });
  const converted_folder = path.join(path.resolve('./'), `store/audio`);
  if (!fs.existsSync(converted_folder)) {
    fs.mkdirSync(converted_folder);
  }
  const meta = info['player_response']['videoDetails'];
  const storage_location = path.join(converted_folder, `${meta['videoId']}.m4a`);

  const stream = ytdl.downloadFromInfo(info, {
    quality: 'highestaudio',
  });
  const fileStream = fs.createWriteStream(storage_location);
  stream.pipe(fileStream);
  return new Promise((resolve, reject) => {
    fileStream.on('close', async () => {
      const textObj = await convertToText(storage_location, meta['videoId']);
      resolve(textObj)
      fs.unlink(storage_location, (err) => {
        if (err) throw err
        console.log(`${storage_location} file has been deleted`)
      })
    });
  });
};
