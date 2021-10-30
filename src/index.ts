import tgBot from './bot';
import startParser from './parser';

// next steps
// - bot raw commands
// - docker
// - render.com deployment
// - html parsing lib
(async function () {
  startParser();
  tgBot.start();
  console.log('bot started...');
})();
