// import ReadMore from 'vue-read-more';

// Reset all cookies while developing
// if (document.cookie && 'development' === import.meta.env.MODE) {
//   console.log(`Clearing document.cookie: "${document.cookie}"`);
//   document.cookie.split(';').forEach((c) => {
//     document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
//   });
// }

// if (config.stylesheet) {
//   const css = document.createElement('link');
//   css.setAttribute('rel', 'stylesheet');
//   css.setAttribute('href', config.stylesheet);
//   document.body.appendChild(css);
// }

// if (config.color) {
//   document.documentElement.setAttribute('data-color', config.color);
//   document.documentElement.style.setProperty('--custom-color', config.color);
//   document.documentElement.style.setProperty('--header-color', config.color);
//   document.documentElement.style.setProperty(
//     '--header-color-alt',
//     process.env.VUE_APP_CSS_COLOR_ALT || config.color
//   );
// }