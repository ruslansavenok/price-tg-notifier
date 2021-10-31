import startBot from './bot';
import startParser from './parser';

// next steps
// - bot raw commands
// - docker
// - render.com deployment
// - html parsing lib
(async function () {
  startParser();
  console.log('Parser started..');
  startBot();
  console.log('Bot started...');
})();
