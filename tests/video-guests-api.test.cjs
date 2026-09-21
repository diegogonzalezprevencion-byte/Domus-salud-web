const test=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const crypto=require('node:crypto');
const ORIGINAL=Module._load;
const grants=[];
class FakeToken {
  constructor(key,secret,options){this.options=options;}
  addGrant(grant){grants.push(grant);}
  async toJwt(){return 'JWT-TEST-NO-REAL';}
}
class FakeRoomService{constructor(){} async listParticipants(){return [];} async removeParticipant(){}}
Module._load=function(name,parent,isMain){if(name==='livekit-server-sdk')return{AccessToken:FakeToken,RoomServiceClient:FakeRoomService};return ORIGINAL.apply(this,arguments);};
const handler=require('../api/video-guests.js');
Module._load=ORIGINAL;
const oldFetch=global.fetch;
const before={};
for(const [name,value] of Object.entries({SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-fake',SUPABASE_SERVICE_ROLE_KEY:'private-test',LIVEKIT_URL:'wss://my-project.livekit.cloud',LIVEKIT_API_KEY:'test-key',LIVEKIT_API_SECRET:'test-secret',PUBLIC_SITE_URL:'https://domusalud.cl'})){
  before[name]=process.env[name];process.env[name]=value;
}
function response(data,status=200){return {ok:status>=200&&status<300,status,async json(){return data;}};}
function fakeRes(){return{headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};}
const mid='11111111-1111-4111-8111-111111111111';
const actor='22222222-2222-4222-8222-222222222222';
const linkId='33333333-3333-4333-8333-333333333333';
const secret='a'.repeat(64);
test.after(()=>{global.fetch=oldFetch;for(const [k,v] of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});

test('API rechaza métodos que no sean POST antes de tocar servidor',async()=>{
  global.fetch=()=>{throw new Error('Nunca debería consultar red');};
  const res=fakeRes();await handler({method:'GET',headers:{}},res);
  assert.equal(res.code,405);assert.equal(res.headers['Cache-Control'],'no-store');
});

test('Crear enlace valida JWT y solo almacena hash, devuelve dirección con fragmento',async()=>{
  const requested=[];
  global.fetch=async(url,options={})=>{
    requested.push([url,options]);
    if(url.endsWith('/auth/v1/user'))return response({id:actor});
    if(url.endsWith('video_guest_link_status'))return response({exists:false});
    if(url.endsWith('video_guest_link_create'))return response({id:linkId,expiresAt:'2026-10-30T20:00:00Z'});
    throw new Error(`unexpected ${url}`);
  };
  const res=fakeRes();await handler({method:'POST',headers:{authorization:'Bearer user-test'},body:{action:'create',meetingId:mid}},res);
  assert.equal(res.code,200);assert.match(res.body.link,/^https:\/\/domusalud\.cl\/invitado#token=[a-f0-9]{64}$/);
  assert.equal(requested.length,3);
  const sent=JSON.parse(requested[2][1].body);
  const generated=res.body.link.split('#token=')[1];
  assert.equal(sent.p_token_hash,crypto.createHash('sha256').update(generated).digest('hex'));
  assert.notEqual(sent.p_token_hash,generated);
  assert.equal(sent.p_actor,actor);
});

test('Invitado obtiene token limitado a cámara/micrófono y no se requiere cuenta Auth',async()=>{
  grants.length=0;
  global.fetch=async(url,opts={})=>{
    if(url.endsWith('video_guest_link_preview'))return response({title:'Reunión ficticia'});
    if(url.endsWith('video_guest_link_lookup'))return response({id:linkId});
    if(url.endsWith('video_guest_join')){
      const body=JSON.parse(opts.body);
      assert.match(body.p_identity,new RegExp(`^guest:${linkId}:`));
      return response({meetingId:mid,identity:body.p_identity,name:'Invitado ficticio',title:'Reunión ficticia'});
    }
    throw new Error(`unexpected ${url}`);
  };
  const res=fakeRes();await handler({method:'POST',headers:{},body:{action:'join',secret,name:'Invitado ficticio'}},res);
  assert.equal(res.code,200);assert.equal(res.body.token,'JWT-TEST-NO-REAL');
  assert.deepEqual(grants[0].canPublishSources,[1,2]);
  assert.equal(grants[0].canPublishData,false);
  assert.equal(grants[0].room,`domus-${mid}`);
});
