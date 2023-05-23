import config from './config';

const g3w = (window as any).g3w = (window as any).g3w || {};

g3w.info = () => {
  Promise.all([
    import('https://unpkg.com/platform@1.3.6/platform.js'),
    fetch(new URL('/api/deploy/info/', config.api_base_url).toString()).then(d => d.json().then((d: any) => d.data))
  ]).then((m) => {
    const platform = (window as any).platform;
    const admin    = m[1];

    (window as any).console.info(`
[g3w.info]\n
- g3w-admin: __${admin.version}__
- g3w-admin-portal: __${process.env.__VERSION__}__
- browser: __${platform.name} ${platform.version}__
- operating system: __${platform.os.toString()}__
`.trim());
  });
};

g3w.version = process.env.__VERSION__;

if ('development' === (import.meta as any).env.MODE) {
  g3w.info();
}