const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('hackathon client contains only the lesson record flow',()=>{
  const source=['poconote-app.html','spa/app.js','spa/state.js','spa/router.js','spa/views/students.js','spa/views/lesson-agent.js'].map(read).join('\n');
  for(const forbidden of ['renderHeader','PocoViews.today','PocoViews.lessons','PocoViews.chat','PocoViews.profile','guidanceContents','chatEnabled','login-view'])assert.doesNotMatch(source,new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('hackathon styles contain no unrelated service sections',()=>{
  const css=read('spa/styles.css')+'\n'+read('spa/overrides.css');
  for(const forbidden of ['.guidance-view','.login-view','.chat-layout','.today-view','.lessons-view','.profile-view','.app-header','.top-nav','.mobile-gnb'])assert.doesNotMatch(css,new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('hackathon assets contain only assets used by the demo',()=>{
  const files=[];
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).forEach(entry=>{const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else files.push(path.relative(root,file))});
  walk(path.join(root,'assets'));
  assert.deepEqual(files.sort(),['assets/characters/poconote_뽀꼬_1.png','assets/characters/poconote_뽀꼬_3.png','assets/fonts/Ownglyph-ParkDahyun.ttf','assets/fonts/Pretendard-Bold.woff2','assets/fonts/Pretendard-Regular.woff2','assets/fonts/Pretendard-SemiBold.woff2']);
});
