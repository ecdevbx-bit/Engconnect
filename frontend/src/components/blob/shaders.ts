export const simplexNoise = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.0,i1.z,i2.z,1.0))+
      i.y+vec4(0.0,i1.y,i2.y,1.0))+
      i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

export type BlobVariant = {
  name: string;
  subtitle: string;
  vertexShader: string;
  fragmentShader: string;
  geometry: "icosahedron" | "sphere";
  renderAs: "points" | "mesh";
  detail: number;
  blending: "additive" | "normal";
  cameraZ: number;
  rotationSpeed: number;
};

// ═══════════════════════════════════════════════════════════════════════
// All blobs are spherical voice-agent orbs — breathing, organic, alive
// ═══════════════════════════════════════════════════════════════════════

// ─── 1. Whisper — soft purple dotted cloud, classic AI voice feel ─────
const whisperV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.5)*0.06+1.0;
    vec3 np=vec3(position*1.2+vec3(uTime*0.3,-uTime*0.2,0.0));
    float d=snoise(np)*0.2+abs(snoise(np*2.5))*0.06;
    vec3 newPos=(position*breath)+(normal*d);
    vec3 cBot=vec3(0.1,0.0,0.3);
    vec3 cMid=vec3(0.6,0.1,0.9);
    vec3 cTop=vec3(1.0,0.3,0.9);
    float mv=smoothstep(-1.2,1.2,newPos.y);
    vec3 gc=mix(cBot,cMid,clamp(mv*2.0,0.0,1.0));
    gc=mix(gc,cTop,clamp((mv-0.5)*2.0,0.0,1.0));
    float hl=smoothstep(0.2,0.6,snoise(np*2.0+uTime));
    vColor=gc+vec3(0.4,0.2,0.8)*hl*0.8;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(4.0+d*15.0)*(10.0/-mvp.z);
  }
`;
const softDotF = `
  varying vec3 vColor;
  void main(){
    vec2 c=2.0*gl_PointCoord-1.0;
    float dist=dot(c,c);
    if(dist>1.0)discard;
    float a=1.0-smoothstep(0.4,1.0,dist);
    gl_FragColor=vec4(vColor,a*0.85);
  }
`;

// ─── 2. Ember — warm orange fiery voice orb ──────────────────────────
const emberV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.8)*0.04+1.0;
    vec3 np=vec3(position*1.8+vec3(uTime*0.5,uTime*0.3,-uTime*0.4));
    float d=snoise(np)*0.3+abs(snoise(np*3.0))*0.1;
    vec3 newPos=position*breath+normal*d;
    float heat=smoothstep(-1.0,1.5,newPos.y+d*2.0);
    vec3 cCore=vec3(1.0,0.95,0.6);
    vec3 cMid=vec3(1.0,0.5,0.05);
    vec3 cEdge=vec3(0.6,0.05,0.0);
    vec3 gc=mix(cEdge,cMid,clamp(heat*2.0,0.0,1.0));
    gc=mix(gc,cCore,clamp((heat-0.5)*2.5,0.0,1.0));
    float flare=pow(max(snoise(np*4.0+uTime*2.0),0.0),2.0);
    vColor=gc+vec3(1.0,0.8,0.3)*flare*0.6;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(3.5+d*18.0)*(10.0/-mvp.z);
  }
`;
const sharpDotF = `
  varying vec3 vColor;
  void main(){
    vec2 c=2.0*gl_PointCoord-1.0;
    float dist=dot(c,c);
    if(dist>1.0)discard;
    float a=1.0-smoothstep(0.2,1.0,dist);
    gl_FragColor=vec4(vColor,a*0.9);
  }
`;

// ─── 3. Liquid Glass — smooth dark teal mesh, Siri-like ──────────────
const glassV = `
  ${simplexNoise}
  varying vec3 vNormal; varying vec3 vPosition; varying float vDisp;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.2)*0.03+1.0;
    vec3 np=vec3(position*0.8+vec3(uTime*0.15,-uTime*0.1,uTime*0.2));
    float d=snoise(np)*0.25+snoise(np*2.5)*0.08;
    vec3 newPos=position*breath+normal*d;
    vNormal=normalize(normalMatrix*normal); vPosition=newPos; vDisp=d;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(newPos,1.0);
  }
`;
const glassF = `
  varying vec3 vNormal; varying vec3 vPosition; varying float vDisp;
  void main(){
    vec3 light=normalize(vec3(0.5,1.0,0.8));
    float diff=max(dot(vNormal,light),0.0);
    vec3 viewDir=normalize(-vPosition);
    vec3 halfDir=normalize(light+viewDir);
    float spec=pow(max(dot(vNormal,halfDir),0.0),64.0);
    vec3 cDeep=vec3(0.0,0.03,0.12); vec3 cMid=vec3(0.0,0.2,0.4); vec3 cBright=vec3(0.1,0.7,0.65);
    float m=smoothstep(-0.3,0.3,vDisp);
    vec3 base=mix(cDeep,cMid,diff); base=mix(base,cBright,m*0.6);
    vec3 col=base+vec3(0.4,0.8,0.9)*spec*0.5;
    float fresnel=pow(1.0-max(dot(vNormal,viewDir),0.0),3.0);
    col+=vec3(0.1,0.4,0.5)*fresnel*0.4;
    gl_FragColor=vec4(col,0.92);
  }
`;

// ─── 4. Aether — aurora bands on a sphere, Gemini-like ───────────────
const aetherV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.4)*0.05+1.0;
    vec3 np=vec3(position*1.5+vec3(uTime*0.2,0.0,-uTime*0.3));
    float d=snoise(np)*0.18+snoise(np*3.0)*0.06;
    vec3 newPos=position*breath+normal*d;
    float band=sin(newPos.y*4.0+uTime*0.8+snoise(np*2.0)*2.0);
    vec3 cGreen=vec3(0.1,0.9,0.4); vec3 cCyan=vec3(0.0,0.8,0.9); vec3 cPurp=vec3(0.5,0.1,0.8);
    float t=band*0.5+0.5;
    vec3 gc=mix(cGreen,cCyan,clamp(t*2.0,0.0,1.0));
    gc=mix(gc,cPurp,clamp((t-0.5)*2.0,0.0,1.0));
    vColor=gc+abs(snoise(np*5.0+uTime*1.5))*0.3;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(3.0+abs(d)*12.0)*(10.0/-mvp.z);
  }
`;

// ─── 5. Obsidian — dark matter void with rim glow, mystery agent ─────
const obsidianV = `
  ${simplexNoise}
  varying vec3 vColor; varying float vBright;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.0)*0.03+1.0;
    vec3 np=vec3(position*1.0+uTime*0.08);
    float d=snoise(np)*0.15+snoise(np*3.0+uTime*0.5)*0.1;
    vec3 newPos=position*breath+normal*d;
    float rim=1.0-abs(dot(normalize(normal),normalize(cameraPosition-position)));
    vec3 cVoid=vec3(0.0); vec3 cEdge=vec3(0.15,0.0,0.3); vec3 cGlow=vec3(0.4,0.0,0.7);
    vColor=mix(cVoid,cEdge,pow(rim,2.0))+cGlow*pow(rim,5.0)*0.8;
    float pulse=sin(uTime*2.0+length(position)*3.0)*0.5+0.5;
    vColor+=vec3(0.2,0.0,0.4)*pulse*pow(rim,4.0);
    vBright=rim;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(1.5+rim*8.0)*(10.0/-mvp.z);
  }
`;
const glowDotF = `
  varying vec3 vColor; varying float vBright;
  void main(){
    vec2 c=2.0*gl_PointCoord-1.0;
    float dist=dot(c,c);
    if(dist>1.0)discard;
    float a=1.0-smoothstep(0.0,1.0,dist);
    float glow=exp(-dist*3.0)*vBright;
    gl_FragColor=vec4(vColor+glow*0.5,a*(0.15+vBright*0.85));
  }
`;

// ─── 6. Magma — volcanic mesh with lava cracks, power agent ──────────
const magmaV = `
  ${simplexNoise}
  varying vec3 vNormal; varying vec3 vPosition; varying float vHeat;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.6)*0.04+1.0;
    vec3 np=vec3(position*1.4+uTime*0.25);
    float d=snoise(np)*0.3;
    float cracks=pow(abs(snoise(np*4.0)),0.5)*0.15;
    d+=cracks;
    vec3 newPos=position*breath+normal*d;
    vNormal=normalize(normalMatrix*normal); vPosition=newPos; vHeat=cracks/0.15;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(newPos,1.0);
  }
`;
const magmaF = `
  varying vec3 vNormal; varying vec3 vPosition; varying float vHeat;
  void main(){
    vec3 light=normalize(vec3(-0.3,0.8,0.5));
    float diff=max(dot(vNormal,light),0.0)*0.5+0.1;
    vec3 cRock=vec3(0.08,0.04,0.03); vec3 cLava=vec3(1.0,0.3,0.0); vec3 cWhite=vec3(1.0,0.85,0.4);
    vec3 col=mix(cRock*diff,cLava,smoothstep(0.3,0.7,vHeat));
    col=mix(col,cWhite,smoothstep(0.7,1.0,vHeat));
    float fresnel=pow(1.0-max(dot(vNormal,normalize(-vPosition)),0.0),2.0);
    col+=vec3(0.8,0.15,0.0)*fresnel*0.3;
    gl_FragColor=vec4(col,1.0);
  }
`;

// ─── 7. Frost — icy crystalline particle orb, calm agent ─────────────
const frostV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*0.8)*0.03+1.0;
    vec3 np=vec3(position*2.0+uTime*0.1);
    float d=snoise(np)*0.1+snoise(np*4.0)*0.04;
    float cryst=step(0.4,abs(snoise(np*6.0)))*0.06;
    d+=cryst;
    vec3 newPos=position*breath+normal*d;
    float edge=pow(abs(snoise(np*8.0)),3.0);
    vec3 cIce=vec3(0.7,0.85,1.0); vec3 cBlue=vec3(0.3,0.5,0.95);
    vColor=mix(cBlue,cIce,edge);
    vColor=mix(vColor,vec3(1.0),cryst/0.06*0.5);
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(2.0+cryst*40.0+edge*6.0)*(10.0/-mvp.z);
  }
`;

// ─── 8. Bloom — organic pastel mesh, friendly agent ──────────────────
const bloomV = `
  ${simplexNoise}
  varying vec3 vNormal; varying vec3 vPosition; varying float vBloom;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.3)*0.05+1.0;
    vec3 np=vec3(position*1.2+uTime*0.12);
    float d=snoise(np)*0.2;
    float petal=sin(atan(position.z,position.x)*5.0+uTime*0.5)*0.08;
    d+=petal*smoothstep(-0.5,0.5,position.y);
    vec3 newPos=position*breath+normal*d;
    vNormal=normalize(normalMatrix*normal); vPosition=newPos; vBloom=petal/0.08*0.5+0.5;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(newPos,1.0);
  }
`;
const bloomF = `
  varying vec3 vNormal; varying vec3 vPosition; varying float vBloom;
  void main(){
    vec3 light=normalize(vec3(0.4,1.0,0.3));
    float diff=max(dot(vNormal,light),0.0)*0.6+0.4;
    vec3 cPink=vec3(0.95,0.6,0.7); vec3 cPeach=vec3(1.0,0.8,0.6); vec3 cGreen=vec3(0.5,0.85,0.55);
    vec3 col=mix(cPeach,cPink,vBloom);
    col=mix(col,cGreen,smoothstep(0.0,-0.8,vPosition.y)*0.5);
    col*=diff;
    vec3 viewDir=normalize(-vPosition);
    float fresnel=pow(1.0-max(dot(vNormal,viewDir),0.0),3.0);
    col+=vec3(1.0,0.9,0.95)*fresnel*0.2;
    gl_FragColor=vec4(col,0.95);
  }
`;

// ─── 9. Cosmos — galaxy star sphere, wisdom agent ────────────────────
const cosmosV = `
  ${simplexNoise}
  varying vec3 vColor; varying float vBright;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*0.6)*0.02+1.0;
    vec3 np=vec3(position*0.5+uTime*0.05);
    float d=snoise(np)*0.12;
    vec3 newPos=position*breath+normal*d;
    float star=pow(max(snoise(vec3(position*8.0)),0.0),6.0);
    float twinkle=sin(uTime*3.0+position.x*20.0+position.y*17.0)*0.5+0.5;
    vec3 cDim=vec3(0.15,0.1,0.25);
    float temp=snoise(position*3.0);
    vec3 starColor=mix(vec3(0.5,0.6,1.0),vec3(1.0,0.7,0.4),temp*0.5+0.5);
    vColor=mix(cDim,starColor,star);
    vBright=star*twinkle;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(1.0+star*16.0+vBright*8.0)*(10.0/-mvp.z);
  }
`;

// ─── 10. Silk — flowing metallic surface, premium agent ──────────────
const silkV = `
  ${simplexNoise}
  varying vec3 vNormal; varying vec3 vPosition; varying float vDisp;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.5)*0.05+1.0;
    vec3 np=vec3(position*1.0+vec3(uTime*0.2,uTime*0.15,-uTime*0.18));
    float d=snoise(np)*0.2+snoise(np*2.8)*0.06;
    float ripple=sin(length(position.xz)*8.0-uTime*3.0)*0.03;
    d+=ripple;
    vec3 newPos=position*breath+normal*d;
    vNormal=normalize(normalMatrix*normal); vPosition=newPos; vDisp=d;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(newPos,1.0);
  }
`;
const silkF = `
  varying vec3 vNormal; varying vec3 vPosition; varying float vDisp;
  void main(){
    vec3 light=normalize(vec3(0.3,1.0,0.5));
    vec3 light2=normalize(vec3(-0.5,-0.3,0.8));
    float diff=max(dot(vNormal,light),0.0);
    float diff2=max(dot(vNormal,light2),0.0)*0.3;
    vec3 viewDir=normalize(-vPosition);
    vec3 halfDir=normalize(light+viewDir);
    float spec=pow(max(dot(vNormal,halfDir),0.0),128.0);
    float spec2=pow(max(dot(vNormal,normalize(light2+viewDir)),0.0),64.0);
    vec3 cDeep=vec3(0.02,0.01,0.05);
    vec3 cMid=vec3(0.15,0.08,0.25);
    vec3 cHighlight=vec3(0.7,0.5,1.0);
    float m=smoothstep(-0.25,0.25,vDisp);
    vec3 base=mix(cDeep,cMid,diff+diff2);
    base=mix(base,cHighlight,m*0.3);
    vec3 col=base+vec3(0.8,0.6,1.0)*spec*0.6+vec3(0.3,0.5,0.8)*spec2*0.3;
    float fresnel=pow(1.0-max(dot(vNormal,viewDir),0.0),4.0);
    col+=vec3(0.4,0.2,0.7)*fresnel*0.5;
    gl_FragColor=vec4(col,0.94);
  }
`;

// ─── 11. Pulse — reactive radial-ring particle orb, alert agent ──────
const pulseV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*2.0)*0.06+1.0;
    vec3 np=vec3(position*1.3+uTime*0.35);
    float d=snoise(np)*0.22+abs(snoise(np*2.8))*0.08;
    vec3 newPos=position*breath+normal*d;
    float ring=abs(sin(length(position)*6.0-uTime*3.0));
    float radial=smoothstep(0.7,1.0,ring);
    vec3 cBase=vec3(0.08,0.02,0.15);
    vec3 cRing=vec3(1.0,0.2,0.5);
    vec3 cHot=vec3(1.0,0.7,0.3);
    vColor=mix(cBase,cRing,radial);
    vColor+=cHot*pow(radial,3.0)*0.6;
    float n=abs(snoise(np*4.0+uTime*1.5));
    vColor+=vec3(0.3,0.1,0.5)*n*0.4;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(2.5+radial*8.0+d*10.0)*(10.0/-mvp.z);
  }
`;

// ─── 12. Phantom — ethereal ghostly white orb, whisper agent ─────────
const phantomV = `
  ${simplexNoise}
  varying vec3 vColor; varying float vBright;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.1)*0.04+1.0;
    vec3 np=vec3(position*0.9+uTime*0.12);
    float d=snoise(np)*0.18+snoise(np*2.5)*0.07;
    vec3 newPos=position*breath+normal*d;
    float rim=1.0-abs(dot(normalize(normal),normalize(cameraPosition-position)));
    float wisp=abs(snoise(np*3.0+uTime*0.8));
    vec3 cCore=vec3(0.85,0.88,0.95);
    vec3 cEdge=vec3(0.5,0.55,0.7);
    vec3 cGhost=vec3(0.3,0.35,0.5);
    vColor=mix(cGhost,cCore,pow(rim,1.5)*0.6+wisp*0.4);
    vColor+=vec3(1.0,0.98,0.95)*pow(wisp,3.0)*0.3;
    vBright=rim*0.5+wisp*0.5;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(2.0+rim*6.0+wisp*4.0)*(10.0/-mvp.z);
  }
`;
const phantomF = `
  varying vec3 vColor; varying float vBright;
  void main(){
    vec2 c=2.0*gl_PointCoord-1.0;
    float dist=dot(c,c);
    if(dist>1.0)discard;
    float a=1.0-smoothstep(0.1,1.0,dist);
    gl_FragColor=vec4(vColor,a*(0.3+vBright*0.5));
  }
`;

// ─── 13. Synapse — neural network sparks, intelligence agent ─────────
const synapseV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.3)*0.04+1.0;
    vec3 np=vec3(position*1.1+uTime*0.15);
    float d=snoise(np)*0.16+snoise(np*2.5)*0.05;
    vec3 newPos=position*breath+normal*d;
    // neural fire: sharp spikes that travel across surface
    float fire1=pow(max(snoise(vec3(position*6.0+uTime*2.5)),0.0),5.0);
    float fire2=pow(max(snoise(vec3(position*8.0-uTime*3.0)),0.0),6.0);
    float fire=max(fire1,fire2);
    // propagation waves
    float wave=sin(length(position)*10.0-uTime*4.0)*0.5+0.5;
    float synapse=fire*smoothstep(0.3,0.7,wave);
    vec3 cDark=vec3(0.02,0.02,0.06);
    vec3 cBlue=vec3(0.1,0.3,0.9);
    vec3 cCyan=vec3(0.0,0.9,1.0);
    vec3 cWhite=vec3(1.0,0.95,0.98);
    vColor=mix(cDark,cBlue,fire*0.6);
    vColor+=cCyan*synapse*0.8;
    vColor+=cWhite*pow(synapse,3.0)*0.6;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(1.5+fire*10.0+synapse*12.0)*(10.0/-mvp.z);
  }
`;

// ─── 14. Tesla — electric discharge arcs, energy agent ───────────────
const teslaV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*2.2)*0.05+1.0;
    vec3 np=vec3(position*1.4+uTime*0.25);
    float d=snoise(np)*0.2;
    // jagged electric displacement — high-frequency noise
    float arc=snoise(vec3(position*12.0+uTime*6.0))*0.08;
    d+=arc*step(0.5,abs(snoise(np*3.0+uTime*4.0)));
    vec3 newPos=position*breath+normal*d;
    float intensity=abs(snoise(vec3(position*10.0+uTime*5.0)));
    float bolt=pow(intensity,4.0);
    float rim=1.0-abs(dot(normalize(normal),normalize(cameraPosition-position)));
    vec3 cDark=vec3(0.01,0.01,0.04);
    vec3 cElectric=vec3(0.3,0.4,1.0);
    vec3 cArc=vec3(0.6,0.8,1.0);
    vec3 cWhite=vec3(1.0);
    vColor=mix(cDark,cElectric,rim*0.5+bolt*0.5);
    vColor+=cArc*bolt*0.7;
    vColor+=cWhite*pow(bolt,3.0)*0.5;
    // surface crawl glow
    float crawl=abs(snoise(vec3(position*5.0+uTime*1.5)));
    vColor+=vec3(0.15,0.2,0.6)*crawl*rim*0.4;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(1.8+bolt*14.0+rim*3.0)*(10.0/-mvp.z);
  }
`;

// ─── 15. Heartbeat — concentric ripple rings, empathy agent ──────────
const heartbeatV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    // double-pulse heartbeat rhythm
    float beat1=pow(max(sin(uTime*3.5),0.0),12.0);
    float beat2=pow(max(sin(uTime*3.5-0.4),0.0),16.0);
    float beat=beat1+beat2*0.5;
    float breath=1.0+beat*0.12;
    vec3 np=vec3(position*1.0+uTime*0.1);
    float d=snoise(np)*0.12;
    vec3 newPos=position*breath+normal*d;
    // concentric rings expand from center on each beat
    float dist=length(position);
    float ring1=smoothstep(0.02,0.0,abs(fract(dist*3.0-uTime*1.5)-0.5)-0.45);
    float ring2=smoothstep(0.02,0.0,abs(fract(dist*5.0-uTime*2.0)-0.5)-0.47);
    float rings=max(ring1,ring2*0.6);
    vec3 cDeep=vec3(0.15,0.0,0.05);
    vec3 cWarm=vec3(0.8,0.15,0.2);
    vec3 cHot=vec3(1.0,0.4,0.35);
    vec3 cPeak=vec3(1.0,0.85,0.8);
    vColor=mix(cDeep,cWarm,beat*0.6+rings*0.4);
    vColor+=cHot*rings*0.6;
    vColor+=cPeak*pow(rings,3.0)*beat*0.5;
    // ambient warmth from noise
    float warm=abs(snoise(np*2.0+uTime*0.5))*0.15;
    vColor+=vec3(0.4,0.1,0.1)*warm;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(2.5+rings*8.0+beat*6.0)*(10.0/-mvp.z);
  }
`;

// ─── 16. Prism — rainbow chromatic shift, creative agent ─────────────
const prismV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.4)*0.05+1.0;
    vec3 np=vec3(position*1.3+uTime*0.18);
    float d=snoise(np)*0.18+snoise(np*2.2)*0.06;
    vec3 newPos=position*breath+normal*d;
    // rainbow from spherical coordinates + time
    float angle=atan(position.z,position.x);
    float elevation=asin(clamp(position.y/length(position),-1.0,1.0));
    float hue=angle/(3.14159*2.0)+elevation*0.3+uTime*0.15+d*2.0;
    // HSV to RGB
    float h=fract(hue)*6.0;
    float f=fract(h);
    float p=0.15;
    float q=1.0-f*0.85;
    float t2=0.15+f*0.85;
    vec3 col;
    if(h<1.0) col=vec3(1.0,t2,p);
    else if(h<2.0) col=vec3(q,1.0,p);
    else if(h<3.0) col=vec3(p,1.0,t2);
    else if(h<4.0) col=vec3(p,q,1.0);
    else if(h<5.0) col=vec3(t2,p,1.0);
    else col=vec3(1.0,p,q);
    // brighten peaks
    float bright=pow(abs(snoise(np*3.0+uTime)),2.0)*0.4;
    vColor=col*(0.7+bright)+bright*0.3;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(3.0+d*12.0+bright*6.0)*(10.0/-mvp.z);
  }
`;

// ─── 17. Vapor — smoke/fog dissipating orb, calm presence ────────────
const vaporV = `
  ${simplexNoise}
  varying vec3 vColor; varying float vBright;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*0.9)*0.04+1.0;
    vec3 np=vec3(position*0.7+vec3(uTime*0.08,-uTime*0.12,uTime*0.06));
    float d=snoise(np)*0.22+snoise(np*1.8)*0.1;
    // layered turbulence — smoke-like
    float turb=abs(snoise(np*3.0+uTime*0.3))*0.08;
    turb+=abs(snoise(np*5.0-uTime*0.5))*0.04;
    d+=turb;
    vec3 newPos=position*breath+normal*d;
    float density=smoothstep(0.0,0.3,d+0.15);
    float rim=1.0-abs(dot(normalize(normal),normalize(cameraPosition-position)));
    // soft monochrome with hints of blue
    vec3 cCore=vec3(0.7,0.72,0.78);
    vec3 cMid=vec3(0.4,0.42,0.5);
    vec3 cEdge=vec3(0.15,0.16,0.22);
    vColor=mix(cEdge,cMid,density);
    vColor=mix(vColor,cCore,pow(rim,2.0)*0.4);
    // subtle blue tint in thicker regions
    vColor+=vec3(0.05,0.08,0.15)*density;
    vBright=density*0.5+rim*0.3;
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(3.5+density*8.0+turb*20.0)*(10.0/-mvp.z);
  }
`;
const vaporF = `
  varying vec3 vColor; varying float vBright;
  void main(){
    vec2 c=2.0*gl_PointCoord-1.0;
    float dist=dot(c,c);
    if(dist>1.0)discard;
    float a=1.0-smoothstep(0.2,1.0,dist);
    gl_FragColor=vec4(vColor,a*(0.4+vBright*0.4));
  }
`;

// ─── 18. Magnetar — field-line filaments, focus agent ────────────────
const magnetarV = `
  ${simplexNoise}
  varying vec3 vColor;
  uniform float uTime;
  void main(){
    float breath=sin(uTime*1.6)*0.04+1.0;
    vec3 np=vec3(position*1.2+uTime*0.2);
    float d=snoise(np)*0.15;
    vec3 newPos=position*breath+normal*d;
    // magnetic field lines: follow poles
    float theta=acos(clamp(position.y/length(position),-1.0,1.0));
    float phi=atan(position.z,position.x);
    // field line intensity — strongest at poles, arcing to equator
    float fieldLine=pow(abs(sin(phi*4.0+uTime*0.8)),8.0);
    float polarIntensity=pow(abs(cos(theta)),0.5);
    float equatorRing=pow(1.0-abs(cos(theta)),6.0);
    float field=fieldLine*polarIntensity+equatorRing*0.3;
    // flowing along field
    float flow=sin(theta*8.0-uTime*3.0+phi*2.0)*0.5+0.5;
    field*=0.6+flow*0.4;
    vec3 cDark=vec3(0.02,0.01,0.04);
    vec3 cField=vec3(0.2,0.5,1.0);
    vec3 cBright=vec3(0.5,0.8,1.0);
    vec3 cPole=vec3(0.9,0.7,1.0);
    vColor=mix(cDark,cField,field);
    vColor+=cBright*pow(field,2.0)*0.5;
    vColor+=cPole*equatorRing*0.4;
    // subtle noise shimmer
    float shimmer=abs(snoise(np*4.0+uTime))*0.15;
    vColor+=shimmer*vec3(0.3,0.4,0.8);
    vec4 mvp=modelViewMatrix*vec4(newPos,1.0);
    gl_Position=projectionMatrix*mvp;
    gl_PointSize=(1.5+field*12.0+equatorRing*6.0)*(10.0/-mvp.z);
  }
`;

export const BLOB_VARIANTS: BlobVariant[] = [
  { name: "Whisper", subtitle: "Soft presence — listening", vertexShader: whisperV, fragmentShader: softDotF, geometry: "icosahedron", renderAs: "points", detail: 45, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.08 },
  { name: "Ember", subtitle: "Warm energy — speaking", vertexShader: emberV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 50, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.1 },
  { name: "Liquid Glass", subtitle: "Fluid intelligence — thinking", vertexShader: glassV, fragmentShader: glassF, geometry: "icosahedron", renderAs: "mesh", detail: 40, blending: "normal", cameraZ: 4.0, rotationSpeed: 0.06 },
  { name: "Aether", subtitle: "Shifting bands — processing", vertexShader: aetherV, fragmentShader: softDotF, geometry: "icosahedron", renderAs: "points", detail: 45, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.07 },
  { name: "Obsidian", subtitle: "Dark matter — dormant", vertexShader: obsidianV, fragmentShader: glowDotF, geometry: "sphere", renderAs: "points", detail: 48, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.02 },
  { name: "Magma", subtitle: "Raw power — active", vertexShader: magmaV, fragmentShader: magmaF, geometry: "icosahedron", renderAs: "mesh", detail: 50, blending: "normal", cameraZ: 4.0, rotationSpeed: 0.04 },
  { name: "Frost", subtitle: "Crystal calm — idle", vertexShader: frostV, fragmentShader: softDotF, geometry: "icosahedron", renderAs: "points", detail: 35, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.03 },
  { name: "Bloom", subtitle: "Organic warmth — friendly", vertexShader: bloomV, fragmentShader: bloomF, geometry: "icosahedron", renderAs: "mesh", detail: 40, blending: "normal", cameraZ: 4.0, rotationSpeed: 0.05 },
  { name: "Cosmos", subtitle: "Star wisdom — contemplating", vertexShader: cosmosV, fragmentShader: glowDotF, geometry: "icosahedron", renderAs: "points", detail: 55, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.015 },
  { name: "Silk", subtitle: "Premium surface — confident", vertexShader: silkV, fragmentShader: silkF, geometry: "icosahedron", renderAs: "mesh", detail: 45, blending: "normal", cameraZ: 4.0, rotationSpeed: 0.05 },
  { name: "Pulse", subtitle: "Radial waves — alert", vertexShader: pulseV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 48, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.06 },
  { name: "Phantom", subtitle: "Ethereal mist — whisper", vertexShader: phantomV, fragmentShader: phantomF, geometry: "sphere", renderAs: "points", detail: 50, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.03 },
  { name: "Synapse", subtitle: "Neural sparks — intelligence", vertexShader: synapseV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 50, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.04 },
  { name: "Tesla", subtitle: "Electric arcs — energy", vertexShader: teslaV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 48, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.07 },
  { name: "Heartbeat", subtitle: "Concentric pulses — empathy", vertexShader: heartbeatV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 50, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.03 },
  { name: "Prism", subtitle: "Rainbow chromatic — creative", vertexShader: prismV, fragmentShader: softDotF, geometry: "icosahedron", renderAs: "points", detail: 45, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.06 },
  { name: "Vapor", subtitle: "Smoke dissipation — calm", vertexShader: vaporV, fragmentShader: vaporF, geometry: "sphere", renderAs: "points", detail: 52, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.02 },
  { name: "Magnetar", subtitle: "Field-line filaments — focus", vertexShader: magnetarV, fragmentShader: sharpDotF, geometry: "icosahedron", renderAs: "points", detail: 50, blending: "additive", cameraZ: 4.5, rotationSpeed: 0.05 },
];
