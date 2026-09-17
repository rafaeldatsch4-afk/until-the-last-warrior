/** Hand-drawn Canvas scenery. Coordinates are authored at 1920 × 1080.
 * The playable foreground starts at y=620, inside the battle camera's crop.
 * These are interpretations for OTLW, not extracted anime backgrounds.
 */
type C = CanvasRenderingContext2D;
type Point = readonly [number, number];
const INK = '#263c48';
function poly(c:C, p:readonly Point[], fill:string, stroke=INK, width=3) {
  c.beginPath(); p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath();
  c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
}
function line(c:C,p:readonly Point[],color:string,width=2) {
  c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function ellipse(c:C,x:number,y:number,rx:number,ry:number,color:string,stroke='') {
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke();}
}
function rect(c:C,x:number,y:number,w:number,h:number,color:string) {c.fillStyle=color;c.fillRect(x,y,w,h);}
function sky(c:C,top:string,bottom:string) {
  const g=c.createLinearGradient(0,0,0,730);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,1920,1080);
}
function cloud(c:C,x:number,y:number,s=1,color='#fff6e4') {
  c.save();c.translate(x,y);c.scale(s,s);
  for(const [dx,dy,rx,ry] of [[-90,10,90,22],[-40,-12,62,36],[22,-30,70,45],[90,-8,76,33],[140,12,75,17]])ellipse(c,dx,dy,rx,ry,color);
  line(c,[[-145,22],[-55,28],[70,26],[180,21]],'#c9dfdb',3);c.restore();
}
function cliff(c:C,x:number,y:number,w:number,h:number,cap:string,light:string,shadow:string) {
  const p:Point[]=[[x-w*.48,y],[x-w*.38,y-h*.72],[x-w*.31,y-h],[x+w*.29,y-h*1.02],[x+w*.4,y-h*.66],[x+w*.52,y]];
  poly(c,p,light);
  poly(c,[[x+w*.1,y-h],[x+w*.29,y-h*1.02],[x+w*.4,y-h*.66],[x+w*.52,y],[x-w*.04,y]],shadow,'');
  poly(c,[[x-w*.31,y-h],[x-w*.36,y-h*.91],[x+w*.33,y-h*.9],[x+w*.29,y-h*1.02]],cap);
  for(let i=0;i<6;i++){const yy=y-h*.78+i*h*.125;line(c,[[x-w*.3,yy],[x-w*.08,yy+5],[x+w*.3,yy-3]],shadow,2);}
  line(c,[[x-w*.19,y-h*.78],[x-w*.23,y-h*.44],[x-w*.17,y-h*.2]],shadow,3);
}
function floor(c:C,top:string,bottom:string,marks:string) {
  const g=c.createLinearGradient(0,620,0,1080);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,620,1920,460);
  line(c,[[0,620],[1920,620]],marks,3);
  // Sparse, deterministic strokes keep the fighting silhouettes legible.
  for(let i=0;i<110;i++){const x=(i*173+37)%1920,y=645+(i*83)%425;line(c,[[x,y],[x+7+(i%5)*5,y+1]],marks,1.5);}
}
function boulder(c:C,x:number,y:number,s:number,color='#d8b68c',shadow='#94766a') {
  poly(c,[[x-35*s,y],[x-31*s,y-25*s],[x-12*s,y-38*s],[x+24*s,y-31*s],[x+39*s,y]],color);
  poly(c,[[x+4*s,y-33*s],[x+24*s,y-31*s],[x+39*s,y],[x-3*s,y]],shadow,'');
}
function ajissa(c:C,x:number,y:number,s:number) {
  c.save();c.translate(x,y);c.scale(s,s);
  poly(c,[[-10,0],[-5,-150],[3,-160],[13,0]],'#c6be8b');
  for(let n=0;n<7;n++)line(c,[[-6,-n*20-10],[8,-n*20-12]],'#817a73',2);
  ellipse(c,0,-176,72,45,'#286e8c',INK);ellipse(c,-13,-186,58,31,'#54a9b9');
  ellipse(c,-31,-197,21,9,'#8dd3cb');line(c,[[-59,-163],[-24,-151],[16,-151],[55,-165]],'#174961',3);c.restore();
}
function dome(c:C,x:number,y:number,s:number,ruined=false) {
  c.save();c.translate(x,y);c.scale(s,s);
  ellipse(c,0,0,114,16,'#1e414c33');
  c.beginPath();c.moveTo(-100,0);c.bezierCurveTo(-107,-136,83,-159,103,0);c.closePath();c.fillStyle=ruined?'#bac6b4':'#f3efcf';c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();
  poly(c,[[48,-105],[81,-75],[103,0],[65,0]],ruined?'#829894':'#b9c8ad','');
  poly(c,[[-26,0],[-26,-47],[-14,-64],[14,-64],[26,-47],[26,0]],'#284857');
  ellipse(c,0,-95,17,12,'#76b1b0',INK);
  if(ruined)line(c,[[-52,-86],[-37,-67],[-58,-45],[-38,-20]],'#394c52',5);
  else poly(c,[[-13,-122],[0,-160],[14,-123]],'#f1ecd5');c.restore();
}
function earth(c:C) {
  sky(c,'#428abc','#c6edf0');cloud(c,700,270,1.2);cloud(c,1370,220,1.4);cloud(c,220,345,.8);
  poly(c,[[0,600],[0,420],[155,360],[285,410],[440,290],[570,408],[690,351],[890,500],[1080,368],[1270,310],[1450,436],[1640,312],[1920,400],[1920,620]],'#86b8ae','');
  cliff(c,230,630,330,300,'#88b76c','#c3a17b','#8b7062');cliff(c,1530,605,390,335,'#88b76c','#d4b98a','#987b62');
  cliff(c,490,602,185,215,'#8ab777','#d5bd8f','#aa8866');cliff(c,1260,586,180,180,'#8ab777','#d8c597','#a58c69');
  poly(c,[[0,578],[280,565],[550,581],[710,533],[934,560],[1130,546],[1450,582],[1920,557],[1920,690],[0,690]],'#8dad68');
  poly(c,[[845,550],[954,559],[1095,603],[850,623],[540,646],[405,652],[802,594]],'#a6d6cd','');
  floor(c,'#d4ca93','#a59a70','#a29469');
  for(const x of [80,260,1650,1840]){boulder(c,x,664,1.1);for(let i=0;i<7;i++)line(c,[[x+i*8-20,670],[x+i*8-23,649-i%3*5]],'#657f4d',3);}
}
function namek(c:C) {
  sky(c,'#458870','#c1dc94');cloud(c,600,220,.9,'#e0ecc2');cloud(c,1400,255,1,'#e0ecc2');
  for(const [x,w,h] of [[150,210,255],[490,180,320],[1450,210,275],[1780,300,235]])cliff(c,x,574,w,h,'#88c3b1','#94b9a2','#577e79');
  rect(c,0,541,1920,135,'#659ca6');for(let i=0;i<22;i++){const x=(i*211)%1920,y=552+i%7*13;line(c,[[x,y],[x+90,y]],'#b0d3c0',2);}
  poly(c,[[0,576],[278,545],[492,577],[632,557],[806,584],[1086,579],[1320,550],[1510,581],[1720,548],[1920,573],[1920,675],[0,675]],'#83bcaa');
  dome(c,680,579,.65);dome(c,1230,567,.53);ajissa(c,330,601,.85);ajissa(c,1520,598,1.03);ajissa(c,1370,572,.58);
  floor(c,'#82bbae','#4c8e88','#45837f');
  ajissa(c,95,650,1.42);ajissa(c,1805,650,1.4);boulder(c,265,665,.8,'#cad6b1','#8fa792');
}
function ruinedTower(c:C,x:number,y:number,w:number,h:number) {
  poly(c,[[x-w/2,y],[x-w/2,y-h+20],[x-w*.32,y-h],[x-w*.06,y-h+29],[x+w*.12,y-h+5],[x+w/2,y-h+24],[x+w/2,y]],'#b3b9a9');
  rect(c,x+w*.22,y-h+28,w*.28,h-28,'#768a85');
  for(let j=0;j<Math.floor(h/36)-1;j++)for(let k=0;k<3;k++)rect(c,x-w*.36+k*w*.22,y-h+43+j*34,w*.12,15,(j+k)%4?'#486774':'#2d424b');
  line(c,[[x-w*.38,y-h+55],[x-w*.07,y-h+110],[x-w*.25,y-h+154],[x+w*.03,y-h+177]],'#4b5e5c',4);
  line(c,[[x-w*.28,y-h+15],[x-w*.3,y-h-30]],'#31484e',3);
}
function city(c:C) {
  sky(c,'#758f94','#ddd9b8');cloud(c,460,250,1.9,'#a7b4aa');cloud(c,1440,180,2,'#a7b4aa');
  for(let i=0;i<15;i++){const x=i*147-70,h=95+(i*67)%170;rect(c,x,574-h,108,h,'#7d9590');ellipse(c,x+54,574-h,54,16,'#8ca19b');}
  ruinedTower(c,360,612,180,320);ruinedTower(c,1480,612,208,380);ruinedTower(c,610,597,120,224);ruinedTower(c,1740,624,135,255);
  dome(c,1040,594,1.07,true);rect(c,945,520,190,7,'#6d8480');rect(c,974,536,132,7,'#6d8480');
  // A broken ring-road and rounded towers evoke the futuristic city architecture.
  poly(c,[[0,560],[610,568],[775,585],[775,605],[604,589],[0,581]],'#b7bba6');
  poly(c,[[1220,577],[1430,554],[1920,556],[1920,579],[1436,576],[1238,598]],'#b7bba6');
  for(const x of [135,495,1460,1780])rect(c,x,580,20,58,'#657e78');
  floor(c,'#929d91','#657b79','#586e6d');
  for(const x of [60,215,390,1610,1770,1900]){boulder(c,x,650+(x%30),1.0,'#adb2a0','#738980');line(c,[[x-25,635],[x-7,590],[x+12,637]],'#475e60',4);}
  line(c,[[700,674],[768,690],[758,730],[810,758]],'#425858',3);
}
function palm(c:C,x:number,y:number,s:number) {
  c.save();c.translate(x,y);c.scale(s,s);poly(c,[[-9,0],[5,-185],[16,-191],[10,0]],'#a48357');
  for(let i=0;i<8;i++)line(c,[[-3,-i*21],[10,-i*21-4]],'#615e44',2);
  for(const d of [-1,1])for(let j=0;j<3;j++)poly(c,[[8,-185],[d*(66+j*17),-222+j*25],[d*(120-j*13),-169+j*20],[d*(57+j*8),-195+j*17]],j%2?'#517c50':'#6c984e');
  c.restore();
}
function roof(c:C,x:number,y:number,w:number,h:number) {
  poly(c,[[x-w*.6,y+h],[x-w*.49,y+h*.7],[x-w*.32,y],[x+w*.32,y],[x+w*.49,y+h*.7],[x+w*.6,y+h]],'#d8aa60');
  poly(c,[[x-w*.6,y+h],[x+w*.6,y+h],[x+w*.49,y+h+11],[x-w*.49,y+h+11]],'#805949');
  for(let i=-8;i<=8;i++)line(c,[[x+i*w*.038,y+5],[x+i*w*.061,y+h-4]],'#b8874d',2);
  line(c,[[x-w*.34,y],[x+w*.34,y]],'#67483d',5);
}
function tournament(c:C) {
  sky(c,'#3e97c4','#d2ebd9');cloud(c,500,230,1.15);cloud(c,1350,230,1.25);
  for(let i=0;i<16;i++)ellipse(c,i*135,536,90,66,i%2?'#648d50':'#7ea452',INK);
  palm(c,580,565,.91);palm(c,1360,565,.91);palm(c,255,578,1.2);palm(c,1670,578,1.2);
  // Tournament hall, ochre tiled roofs, red columns and central sign.
  rect(c,685,414,550,178,'#f1deb2');rect(c,691,532,538,58,'#bb6653');
  roof(c,960,324,615,115);roof(c,960,295,240,58);
  rect(c,825,439,270,151,'#dcbf87');rect(c,876,476,168,114,'#394a46');
  for(const x of [700,817,1085,1203]){rect(c,x,433,16,160,'#964b3e');rect(c,x+3,433,4,160,'#cf8461');}
  rect(c,829,429,262,49,'#503f32');rect(c,835,435,250,37,'#f4e4b7');
  c.fillStyle='#363d35';c.font='bold 20px serif';c.textAlign='center';c.fillText('TENKAICHI BUDOKAI',960,462);c.textAlign='start';
  for(const x of [0,1240]){rect(c,x,548,680,61,'#d9c59c');rect(c,x,544,680,9,'#9f5948');}
  // Spectator stands stay behind the ring and below the building silhouette.
  for(const x of [80,1420]){poly(c,[[x,546],[x+385,546],[x+430,605],[x-35,605]],'#d5c9a8');
    for(let r=0;r<3;r++)for(let n=0;n<23;n++){const xx=x+n*17-r*5,yy=555+r*16;ellipse(c,xx,yy,3,4,['#687a77','#a27659','#6c6376'][n%3]);}}
  floor(c,'#f1e7c9','#c3baa1','#b2ad96');
  for(const yy of [634,658,698,758,855,1000])line(c,[[0,yy],[1920,yy]],'#a3a493',2);
  for(let x=-500;x<2500;x+=145)line(c,[[960+(x-960)*.46,620],[x,1080]],'#a3a493',2);
  rect(c,0,613,1920,8,'#faf0cd');line(c,[[0,617],[1920,617]],'#6e807b',2);
  // Corner posts frame the arena without obscuring the fighters.
  for(const x of [220,1680]){rect(c,x,562,28,60,'#ece2c0');rect(c,x-5,560,38,8,'#a66550');}
}
function ice(c:C) {
  sky(c,'#62a6ce','#e0f2e9');cloud(c,500,180,1.8,'#f3faf0');cloud(c,1410,210,1.6,'#f3faf0');
  const peaks:Point[]=[[0,573],[0,411],[155,287],[285,451],[448,283],[657,467],[826,370],[1010,486],[1270,261],[1440,432],[1630,258],[1790,395],[1920,321],[1920,635]];
  poly(c,peaks,'#cadfe2','#789daf');
  for(const [x,y,w] of [[155,287,170],[448,283,225],[1270,261,230],[1630,258,220]]){
    poly(c,[[x,y],[x-w*.2,y+146],[x+w*.72,578],[x+w,595]],'#729cbe','');
    poly(c,[[x,y],[x-w*.32,y+138],[x-3,y+102],[x+43,y+144]],'#f5f8e9','');}
  poly(c,[[0,585],[240,534],[465,578],[620,550],[945,606],[1330,559],[1580,532],[1920,566],[1920,660],[0,660]],'#edf4e6','#accbd3');
  floor(c,'#e1ede4','#a2c3d1','#99bbc9');
  for(const [x,sgn] of [[310,1],[1580,-1]]){poly(c,[[x,622],[x+sgn*34,485],[x+sgn*103,458],[x+sgn*134,638]],'#91b9cc','#638ea6');poly(c,[[x+sgn*34,485],[x+sgn*103,458],[x+sgn*86,621]],'#edf6ee','');}
  line(c,[[160,795],[510,757],[595,800],[866,782]],'#769dae',3);line(c,[[1190,918],[1270,861],[1660,869],[1870,798]],'#769dae',3);
}
function lava(c:C) {
  sky(c,'#403749','#b75e4d');cloud(c,460,269,1.7,'#61565b');cloud(c,1410,200,2,'#61565b');
  poly(c,[[0,593],[0,466],[188,408],[292,435],[447,329],[581,385],[750,452],[972,385],[1095,400],[1250,287],[1390,382],[1510,450],[1740,348],[1920,467],[1920,670]],'#55434b','#453442');
  for(const x of [447,1250,1740])poly(c,[[x,375],[x-27,489],[x+32,515],[x-16,585],[x+41,554],[x+61,491],[x+16,461]],'#d77946','');
  rect(c,0,560,1920,90,'#d48749');
  for(let i=0;i<16;i++)line(c,[[i*143,578+(i%3)*19],[i*143+95,579+(i%3)*19]],'#ffd18b',4);
  cliff(c,265,654,320,211,'#635853','#6a5350','#3b3641');cliff(c,1630,649,290,240,'#635853','#6a5350','#3b3641');
  poly(c,[[0,619],[250,628],[400,612],[610,625],[800,609],[1030,620],[1360,616],[1570,627],[1800,610],[1920,619],[1920,1080],[0,1080]],'#756259');
  for(let i=0;i<32;i++){const x=i*71,y=681+(i*93)%380;line(c,[[x,y],[x+31,y-13],[x+72,y+5]],'#483e42',2);}
  // Lava fissures at the margins, clear stone beneath the central fighting area.
  for(const x of [70,335,1610,1880]){const p:Point[]=[[x,647],[x+43,723],[x+18,782],[x+80,880],[x+56,1080]];line(c,p,'#482e37',17);line(c,p,'#dc8c50',8);line(c,p,'#ffcf88',3);}
}
function desert(c:C) {
  sky(c,'#67b5ca','#e8e7ba');cloud(c,800,207,1.15);cloud(c,1400,270,1.2);
  poly(c,[[0,588],[0,513],[128,492],[181,409],[292,414],[348,506],[513,524],[562,469],[726,476],[820,537],[1030,498],[1230,513],[1350,419],[1460,408],[1584,526],[1810,486],[1920,534],[1920,640]],'#b69b7c','');
  cliff(c,340,620,300,308,'#d7bd82','#caa274','#a17a62');cliff(c,1545,624,330,350,'#e0c68d','#d6ad77','#9f755c');
  cliff(c,620,605,126,180,'#e0c68d','#d4b57f','#a98a66');cliff(c,1210,606,160,215,'#e0c68d','#d4b57f','#a98a66');
  floor(c,'#e1cf9b','#c2a87b','#b39970');
  for(const x of [90,215,1730,1840])boulder(c,x,665,1.4,'#ddba83','#a17d5e');
  for(let j=0;j<9;j++){const y=700+j*42;line(c,[[0,y],[135,y-4],[240,y+2]],'#bba477',1);line(c,[[1700,y+9],[1840,y+4],[1920,y]],'#bba477',1);}
}
function dark(c:C) {
  sky(c,'#26263c','#696177');
  // Broad purple nebula bands, without the old fantasy castle and magic symbols.
  for(let i=0;i<5;i++){c.save();c.globalAlpha=.14;cloud(c,280+i*370,210+i%2*108,2.1,'#bcabc3');c.restore();}
  for(let i=0;i<85;i++)ellipse(c,(i*373+91)%1920,65+(i*131)%480,i%7?1:2,i%7?1:2,'#c3bfd0');
  // Distant spectator ledges and the central tournament column.
  for(const x of [370,1490]){poly(c,[[x-170,443],[x+170,443],[x+122,482],[x-122,482]],'#9b928f');rect(c,x-125,425,250,18,'#c1b7a3');}
  rect(c,925,376,70,212,'#8c837e');rect(c,925,376,23,212,'#c5bbaa');ellipse(c,960,376,37,11,'#d7cbb3',INK);
  for(let j=0;j<6;j++)line(c,[[929,400+j*29],[991,400+j*29]],'#635f64',2);
  poly(c,[[0,660],[272,562],[1648,562],[1920,660],[1920,986],[1636,1080],[284,1080],[0,986]],'#716c70');
  poly(c,[[0,650],[272,557],[1648,557],[1920,650],[1920,980],[0,980]],'#b1a999');
  for(const y of [620,669,732,815,920])line(c,[[0,y],[1920,y]],'#89867e',2);
  for(let x=-500;x<2500;x+=160)line(c,[[960+(x-960)*.42,557],[x,980]],'#89867e',2);
  for(const x of [35,230,1690,1880])boulder(c,x,659,1.3,'#a8a293','#757579');
  line(c,[[285,695],[349,729],[338,758],[410,795]],'#646970',3);
  line(c,[[1680,816],[1580,780],[1550,808]],'#646970',3);
}
export const ANIME_ARENA_DRAWERS: Readonly<Record<string,(ctx:C)=>void>> = {
  arena:earth,arena_namek:namek,arena_city:city,arena_tournament:tournament,
  arena_ice:ice,arena_lava:lava,arena_desert:desert,arena_dark:dark,
};
export function drawAnimeArena(ctx:C,key:string,width:number,height:number) {
  const draw=ANIME_ARENA_DRAWERS[key];if(!draw)throw new Error(`Unknown arena: ${key}`);
  ctx.save();ctx.scale(width/1920,height/1080);draw(ctx);ctx.restore();
}
