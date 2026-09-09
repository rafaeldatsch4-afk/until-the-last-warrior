import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const result = await build({entryPoints:['game/registerGameUpdates.ts'],bundle:true,write:false,format:'esm',plugins:[{
  name:'service-worker-boundary',setup(b){
    b.onResolve({filter:/^virtual:pwa-register$/},()=>({path:'sw',namespace:'test'}));
    b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const registerSW = options => globalThis.__registerSW(options);'}));
  }
}]});
const { registerGameUpdates }=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('an update is announced once and reload is requested only by the player', async () => {
  let options; const reloads=[]; const notices=[];
  globalThis.__registerSW=o=>{options=o;return async value=>reloads.push(value);};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{}}});
  globalThis.document={body:{append:n=>notices.push(n)},createElement:()=>({style:{},setAttribute(){},append(...children){this.children=children;}})};
  registerGameUpdates();options.onNeedRefresh();options.onNeedRefresh();
  assert.equal(notices.length,1);assert.deepEqual(reloads,[]);
  assert.equal(notices[0].children[0].textContent,'Nova versão disponível');
  notices[0].children[1].onclick();assert.deepEqual(reloads,[true]);
});
test('browsers without service workers still start normally', () => {
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
  globalThis.__registerSW=()=>{throw new Error('unsupported registration');};
  assert.doesNotThrow(registerGameUpdates);
});
