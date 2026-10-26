import * as THREE from './vendor/three/three.module.js';

const TAU = Math.PI * 2;
const START = 1.42;
const ARC = TAU - 1.04;
const END = START + ARC;
const HEIGHT = 1.515;
const RADIUS = 1.235;
const CREAM = '#f5e8cd';
const CHOCOLATE = '#663720';
const CARAMEL = '#bf8042';

function seeded(seed = 613) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function textureCanvas(draw, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function crumbTexture(chocolate) {
  return textureCanvas((ctx, size) => {
    const random = seeded(chocolate ? 80 : 41);
    ctx.fillStyle = chocolate ? '#603821' : '#e2b86c';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 12500; i++) {
      const x = random() * size, y = random() * size, r = .4 + random() * 2.2;
      ctx.fillStyle = chocolate
        ? `rgba(${random() > .5 ? '28,10,4' : '177,123,69'},${.08 + random() * .3})`
        : `rgba(${random() > .38 ? '119,74,20' : '255,244,201'},${.1 + random() * .28})`;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (.4 + random()), 0, 0, TAU); ctx.fill();
    }
  });
}

function creamTexture(color, fruit = false) {
  return textureCanvas((ctx, size) => {
    const random = seeded(92);
    ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = i % 3 ? '#ffffff0a' : '#39170008';
      ctx.beginPath(); ctx.arc(random() * size, random() * size, random() * 1.3, 0, TAU); ctx.fill();
    }
    if (fruit) for (let i = 0; i < 160; i++) {
      ctx.fillStyle = i % 3 ? '#6f071940' : '#f5c772a0';
      ctx.beginPath(); ctx.ellipse(random() * size, random() * size, 1 + random() * 4, 1 + random() * 2, random() * TAU, 0, TAU); ctx.fill();
    }
  });
}

function paperTexture() {
  return textureCanvas((ctx, size) => {
    ctx.fillStyle = '#fff3db'; ctx.fillRect(0, 0, size, size);
    const random = seeded(112);
    for (let i = 0; i < 18; i++) {
      const x = 30 + random() * 450, y = 30 + random() * 450;
      ctx.strokeStyle = '#71835e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18, y + 35, x - 3, y + 66); ctx.stroke();
      ctx.fillStyle = '#91a078';
      ctx.beginPath(); ctx.ellipse(x + 13, y + 33, 15, 5, -.65, 0, TAU); ctx.fill();
      for (let p = 0; p < 6; p++) {
        const angle = p * TAU / 6;
        ctx.fillStyle = p % 2 ? '#e7b0a0' : '#edc5ae';
        ctx.beginPath(); ctx.ellipse(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 13, 8, angle, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#c99b52'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    }
  });
}

function rosetteGeometry() {
  const positions = [], uv = [], indices = [];
  const rows = 28, sides = 30;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const radius = Math.max(.002, .145 * (1 - t) ** .7);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * TAU;
      const ridge = 1 + .16 * Math.cos(angle * 6 + t * Math.PI * 7);
      positions.push(Math.cos(angle) * radius * ridge + Math.sin(t * 9) * .02 * t, t * .255, Math.sin(angle) * radius * ridge);
      uv.push(j / sides, t);
      if (i < rows && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export class CakePreview3D {
  constructor(host) {
    this.host = host;
    this.geometries = new Map();
    this.materials = new Map();
    this.textures = [];
    this.yaw = .03;
    this.pitch = .42;
    this.viewHalf = 1.85;
    this.targetY = .6;
    this.frame = 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.8, -1.8, .1, 50);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Bolo em 3D. Arraste ou use as setas para girar.');
    host.replaceChildren(canvas);
    host.dataset.renderer = 'webgl';
    this.setupLight();
    this.bindControls();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  geometry(key, factory) {
    if (!this.geometries.has(key)) this.geometries.set(key, factory());
    return this.geometries.get(key);
  }

  material(key, color, options = {}) {
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshPhysicalMaterial({
      color, roughness: .43, metalness: 0, clearcoat: .12, clearcoatRoughness: .4,
      ...options
    }));
    return this.materials.get(key);
  }

  mesh(geometry, material, parent, x = 0, y = 0, z = 0, name = '') {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }

  cylinder(radius, height, open = false, start = START, arc = ARC, segments = 96) {
    return this.geometry(`cylinder-${radius}-${height}-${open}-${start}-${arc}-${segments}`, () => new THREE.CylinderGeometry(radius, radius, height, segments, 1, open, start, arc));
  }

  radialFace(radius, height, angle, inner = 0) {
    return this.geometry(`face-${radius}-${height}-${angle}-${inner}`, () => {
      const geometry = new THREE.BufferGeometry();
      const sin = Math.sin(angle), cos = Math.cos(angle);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        inner * sin, -height / 2, inner * cos, radius * sin, -height / 2, radius * cos,
        radius * sin, height / 2, radius * cos, inner * sin, height / 2, inner * cos
      ], 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geometry.setIndex([0, 1, 2, 0, 2, 3]); geometry.computeVertexNormals();
      return geometry;
    });
  }

  sphere(radius = 1, segments = 20) {
    return this.geometry(`sphere-${radius}-${segments}`, () => new THREE.SphereGeometry(radius, segments, 12));
  }

  setupLight() {
    this.scene.add(new THREE.HemisphereLight('#fff5e1', '#b2a494', .9));
    const key = new THREE.DirectionalLight('#fff1d7', 2.7);
    key.position.set(-3, 6, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -2, near: .5, far: 18 });
    key.shadow.normalBias = .018; key.shadow.bias = -.0002;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight('#ffffff', .8); fill.position.set(4, 3, -3); this.scene.add(fill);
    const environment = textureCanvas((ctx, size) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#e7e1d8'); gradient.addColorStop(.5, '#fbf5e9'); gradient.addColorStop(1, '#9c9287');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(size * .09, size * .23, size * .2, size * .4);
      ctx.fillStyle = '#fff3df'; ctx.fillRect(size * .67, size * .2, size * .12, size * .3);
    });
    environment.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = generator.fromEquirectangular(environment);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = .6;
    environment.dispose(); generator.dispose();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: .035 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.735; floor.receiveShadow = true; this.scene.add(floor);
    const shadowTexture=textureCanvas((ctx,size)=>{
      const gradient=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
      gradient.addColorStop(0,'#40301c40');gradient.addColorStop(.45,'#40301c18');gradient.addColorStop(1,'#40301c00');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,size,size);
    });
    this.textures.push(shadowTexture);
    const contact=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.45),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
    contact.rotation.x=-Math.PI/2;contact.position.y=-.733;this.scene.add(contact);
  }

  crumb(chocolate) {
    const key = `crumb-${chocolate}`;
    if (!this.materials.has(key)) {
      const texture = crumbTexture(chocolate); this.textures.push(texture);
      this.material(key, '#ffffff', { map: texture, bumpMap: texture, bumpScale: .018, roughness: .94, clearcoat: 0, side: THREE.DoubleSide });
    }
    return this.materials.get(key);
  }

  filling(filling) {
    const color = filling?.color || CREAM;
    const key = `filling-${filling?.id || 'cream'}`;
    if (!this.materials.has(key)) {
      const texture = creamTexture(color, filling?.id === 'morango' || filling?.id === 'abacaxi'); this.textures.push(texture);
      this.material(key, '#ffffff', { map: texture, roughness: .4, clearcoat: .25, side: THREE.DoubleSide });
    }
    return this.materials.get(key);
  }

  frosting(selection) {
    if (selection.coating.id === 'recheio') return selection.fillings[0]?.color || CREAM;
    if (selection.coating.id === 'chocolate') return CHOCOLATE;
    if (selection.coating.id === 'doce-leite') return CARAMEL;
    return CREAM;
  }

  buildLayer(parent, radius, height, y, material, name) {
    const group = new THREE.Group(); group.name = name; parent.add(group);
    this.mesh(this.cylinder(radius, height), material, group, 0, y, 0);
    this.mesh(this.radialFace(radius, height, START), material, group, 0, y, 0);
    this.mesh(this.radialFace(radius, height, END), material, group, 0, y, 0);
  }

  pedestal(parent, scale) {
    const geometry = this.geometry('pedestal', () => new THREE.LatheGeometry([
      [0, -.72], [.46, -.72], [.52, -.70], [.54, -.66], [.49, -.62], [.29, -.58],
      [.19, -.43], [.18, -.23], [.23, -.13], [.36, -.09], [.78, -.055], [1.46, -.055],
      [1.50, -.02], [1.50, .025], [1.47, .055], [0, .055]
    ].map(([x,y]) => new THREE.Vector2(x,y)), 96));
    const mesh = this.mesh(geometry, this.material('porcelain', '#f9f0dc', { roughness: .23, clearcoat: .55 }), parent, 0, 0, 0, 'pedestal');
    mesh.scale.set(scale, 1, scale);
  }

  buttercream(parent, material, secondary) {
    const rosette = this.geometry('rosette', rosetteGeometry);
    for (let i = 0; i < 10; i++) {
      const angle = START + .21 + i * (ARC - .42) / 9;
      this.mesh(rosette, secondary && i % 3 === 0 ? secondary : material, parent, Math.sin(angle) * 1.005, HEIGHT + .045, Math.cos(angle) * 1.005, `rosette-${i}`);
    }
    for (let i = 0; i < 55; i++) {
      const angle = START + i * ARC / 54;
      const pearl = this.mesh(this.sphere(.027, 10), material, parent, Math.sin(angle) * 1.23, .035, Math.cos(angle) * 1.23, 'piped-border');
      pearl.scale.y = .76;
    }
  }

  ganache(parent) {
    const group = new THREE.Group(); group.name = 'decoration-ganache'; parent.add(group);
    const material = this.material('ganache', '#35170e', { roughness: .26, clearcoat: .4, clearcoatRoughness: .25, envMapIntensity: .45 });
    this.mesh(this.cylinder(1.248, .033), material, group, 0, HEIGHT + .046, 0, 'ganache-top');
    const random = seeded(33);
    const drops = Array.from({length:18}, (_,i) => ({angle:START + .1 + i * (ARC - .2) / 17, depth:.13 + random() * .27, width:.045 + random() * .022}));
    const geometry = this.geometry('ganache-drips', () => {
      const positions = [], indices = [];
      for (let i=0;i<=480;i++) {
        const angle=START + i / 480 * ARC;
        const depth=.09 + drops.reduce((sum,drop)=>sum + drop.depth * Math.exp(-Math.pow((angle-drop.angle)/drop.width,2)),0);
        positions.push(Math.sin(angle)*1.25,HEIGHT+.063,Math.cos(angle)*1.25,Math.sin(angle)*1.257,HEIGHT-depth,Math.cos(angle)*1.257);
        if(i<480){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
    });
    material.side = THREE.DoubleSide;
    this.mesh(geometry,material,group,0,0,0,'ganache-drips');
  }

  leaf(parent, material, length=.15, width=.05) {
    const geometry=this.geometry(`leaf-${length}-${width}`,()=>{
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-width,.008,length*.42,0,.035,length*.56,width,.008,length*.42,0,.005,length],3));
      g.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);g.computeVertexNormals();return g;
    });
    return this.mesh(geometry,material,parent);
  }

  strawberry(parent, x, z, tilt=0) {
    const group=new THREE.Group(); group.position.set(x,HEIGHT+.08,z); group.rotation.z=tilt;group.name='strawberry';parent.add(group);
    const geometry=this.geometry('strawberry',()=>new THREE.LatheGeometry([[0,0],[.035,.035],[.075,.085],[.112,.145],[.123,.19],[.108,.24],[.075,.27],[0,.28]].map(([r,y])=>new THREE.Vector2(r,y)),32));
    this.mesh(geometry,this.material('strawberry','#c51b25',{roughness:.35,clearcoat:.45}),group);
    const seeds=new THREE.InstancedMesh(this.geometry('seed',()=>new THREE.SphereGeometry(1,6,4)),this.material('seed','#e9bf71',{roughness:.66}),54);
    const dummy=new THREE.Object3D();
    for(let i=0;i<54;i++){
      const y=.035+(i+.5)/54*.215;const angle=i*2.39996;
      const radius=y<.145?.035+(y-.035)/.11*.077:.123-(y-.19)**2*6;
      dummy.position.set(Math.sin(angle)*(radius+.003),y,Math.cos(angle)*(radius+.003));
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(Math.sin(angle),.2,Math.cos(angle)).normalize());
      dummy.scale.set(.006,.011,.0035);dummy.updateMatrix();seeds.setMatrixAt(i,dummy.matrix);
    }
    seeds.castShadow=true;group.add(seeds);
    const leaves=new THREE.Group();leaves.position.y=.268;group.add(leaves);
    const green=this.material('berry-leaf','#3f7535',{roughness:.82,side:THREE.DoubleSide});
    for(let i=0;i<6;i++){const leaf=this.leaf(leaves,green,.13,.034);leaf.rotation.y=i*TAU/6;leaf.rotation.x=-.15;}
  }

  blueberry(parent,x,z,y=HEIGHT+.09) {
    const group=new THREE.Group();group.position.set(x,y,z);group.name='blueberry';parent.add(group);
    const berry=this.mesh(this.sphere(.067,18),this.material('blueberry','#35446b',{roughness:.56,clearcoat:.13}),group,0,.05,0);berry.scale.y=.9;
    const crown=this.geometry('blueberry-crown',()=>new THREE.TorusGeometry(.018,.006,5,10));
    const top=this.mesh(crown,this.material('berry-crown','#252a43',{roughness:.8}),group,0,.105,0);top.rotation.x=-Math.PI/2;
  }

  raspberry(parent,x,z) {
    const group=new THREE.Group();group.position.set(x,HEIGHT+.07,z);group.name='raspberry';parent.add(group);
    const mat=this.material('raspberry','#b9273e',{roughness:.63,clearcoat:.05});
    for(let row=0;row<4;row++)for(let j=0;j<8;j++){
      const angle=j*TAU/8+row*.4;const r=.055*(1-row*.15);
      this.mesh(this.sphere(.025,8),mat,group,Math.sin(angle)*r,.022+row*.033,Math.cos(angle)*r);
    }
    this.mesh(this.sphere(.025,8),mat,group,0,.13,0);
  }

  fruit(parent) {
    const group=new THREE.Group();group.name='decoration-frutas';parent.add(group);
    this.strawberry(group,-.49,.52,-.23);
    this.strawberry(group,.28,-.46,.2);
    this.strawberry(group,-.46,-.32,.12);
    for(const [x,z] of [[-.72,.18],[-.26,.67],[.12,.49],[.55,-.24],[-.13,-.68]])this.blueberry(group,x,z);
    for(const [x,z] of [[-.66,-.15],[-.07,.35],[.35,-.12]])this.raspberry(group,x,z);
  }

  chocolateRibbon() {
    return this.geometry('chocolate-ribbon',()=>{
      const vertices=[],indices=[];
      for(let i=0;i<=56;i++){
        const t=i/56,angle=t*TAU*1.55,r=.065-.018*t;
        for(const edge of [-1,1]) vertices.push(Math.cos(angle)*(r+edge*.036),t*.3,Math.sin(angle)*(r+edge*.036));
        if(i<56){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
      }
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
    });
  }

  chocolates(parent) {
    const group=new THREE.Group();group.name='decoration-chocolates';parent.add(group);
    const chocolate=this.material('chocolate-piece','#4b2516',{roughness:.29,clearcoat:.4,side:THREE.DoubleSide});
    const shape=this.geometry('chocolate-shard',()=>{
      const shape=new THREE.Shape();shape.moveTo(-.075,0);shape.lineTo(.07,.01);shape.lineTo(.10,.38);shape.lineTo(-.06,.32);shape.closePath();
      return new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.006});
    });
    for(const [x,z,angle] of [[-.17,-.49,-.23],[.08,-.58,.2],[.32,-.42,.38]]){
      const shard=this.mesh(shape,chocolate,group,x,HEIGHT+.06,z,'chocolate-shard');shard.rotation.z=angle;shard.rotation.y=-.3;
    }
    for(const [x,z] of [[-.17,.52],[-.53,.12],[.42,-.04]]){
      const curl=this.mesh(this.chocolateRibbon(),chocolate,group,x,HEIGHT+.065,z,'chocolate-curl');curl.rotation.z=-.2;
    }
  }

  truffle(parent,x,z,index) {
    const group=new THREE.Group();group.name='brigadeiro';group.position.set(x,HEIGHT+.07,z);parent.add(group);
    const dark=index%4!==3;
    const material=this.material(dark?'brigadeiro-dark':'brigadeiro-white',dark?'#512b1b':'#eee0bf',{roughness:.63});
    this.mesh(this.sphere(.112,20),material,group,0,.1,0);
    const cup=this.geometry('truffle-cup',()=>new THREE.CylinderGeometry(.123,.082,.06,28,1,true));
    this.mesh(cup,this.material('paper-cup','#563c2b',{roughness:.95,side:THREE.DoubleSide}),group,0,.018,0);
    const sprinkles=new THREE.InstancedMesh(this.geometry('sprinkle',()=>new THREE.BoxGeometry(.009,.028,.008)),this.material(dark?'sprinkles-dark':'sprinkles-white',dark?'#2e180d':'#fff1d0',{roughness:.69}),85);
    const random=seeded(117+index),dummy=new THREE.Object3D();
    for(let i=0;i<85;i++){
      const theta=random()*TAU,cosPhi=random()*1.65-.65,sinPhi=Math.sqrt(1-cosPhi*cosPhi);
      const normal=new THREE.Vector3(Math.cos(theta)*sinPhi,cosPhi,Math.sin(theta)*sinPhi);
      dummy.position.copy(normal).multiplyScalar(.113);dummy.position.y+=.1;
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);dummy.rotateX(Math.PI/2);dummy.rotateZ(random()*TAU);dummy.updateMatrix();sprinkles.setMatrixAt(i,dummy.matrix);
    }
    sprinkles.castShadow=true;group.add(sprinkles);
  }

  sweets(parent) {
    const group=new THREE.Group();group.name='decoration-docinhos';parent.add(group);
    for(const [index,angle] of [1.8,2.6,3.5,4.4,5.2,6.1].entries())this.truffle(group,Math.sin(angle)*.72,Math.cos(angle)*.72,index);
  }

  topper(parent) {
    const group=new THREE.Group();group.name='decoration-topo';group.position.set(.02,HEIGHT+.07,-.62);parent.add(group);
    const gold=this.material('gold','#c5a25b',{metalness:.83,roughness:.24,clearcoat:.3});
    this.mesh(this.geometry('topper-stem',()=>new THREE.CylinderGeometry(.01,.01,.36,10)),gold,group,0,.18,0);
    this.mesh(this.geometry('topper-ring',()=>new THREE.TorusGeometry(.34,.012,8,72)),gold,group,0,.66,0,'golden-ring');
    const heart=this.geometry('golden-heart',()=>{
      const shape=new THREE.Shape();shape.moveTo(0,-.08);shape.bezierCurveTo(-.23,.05,-.1,.22,0,.11);shape.bezierCurveTo(.1,.22,.23,.05,0,-.08);
      return new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,steps:1,bevelSize:.005,bevelThickness:.005,bevelSegments:2});
    });
    this.mesh(heart,gold,group,0,.64,0,'golden-heart');
  }

  glitter(parent) {
    const group=new THREE.Group();group.name='decoration-glitter';parent.add(group);
    const material=this.material('edible-glitter','#d8b765',{metalness:.85,roughness:.25});
    const mesh=new THREE.InstancedMesh(this.geometry('glitter-flake',()=>new THREE.OctahedronGeometry(.008,0)),material,180);
    const random=seeded(808),dummy=new THREE.Object3D();
    for(let i=0;i<180;i++){
      const angle=START+random()*ARC,r=Math.sqrt(random())*1.12;
      dummy.position.set(Math.sin(angle)*r,HEIGHT+.075,Math.cos(angle)*r);dummy.rotation.set(random()*TAU,random()*TAU,random()*TAU);dummy.scale.setScalar(.5+random());dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    group.add(mesh);
  }

  ricePaper(parent) {
    const group=new THREE.Group();group.name='decoration-papel-arroz';parent.add(group);
    if(!this.materials.has('rice-paper')){const texture=paperTexture();this.textures.push(texture);this.material('rice-paper','#ffffff',{map:texture,roughness:.75,clearcoat:0});}
    this.mesh(this.cylinder(.89,.008),this.materials.get('rice-paper'),group,0,HEIGHT+.075,0,'floral-paper');
  }

  flowers(parent) {
    const group=new THREE.Group();group.name='decoration-flores';parent.add(group);
    const petal=this.material('flower-petal','#fff8e6',{roughness:.73,side:THREE.DoubleSide});
    const green=this.material('flower-leaf','#526c37',{roughness:.85,side:THREE.DoubleSide});
    for(const [x,z,scale] of [[-.68,-.35,1],[-.5,-.58,.8],[-.8,-.07,.75]]){
      const flower=new THREE.Group();flower.position.set(x,HEIGHT+.1,z);flower.scale.setScalar(scale);flower.rotation.x=-.2;group.add(flower);
      for(let i=0;i<9;i++){
        const angle=i*TAU/9;
        const mesh=this.mesh(this.sphere(1,12),petal,flower,Math.sin(angle)*.075,.015,Math.cos(angle)*.075,'daisy-petal');mesh.scale.set(.026,.015,.065);mesh.rotation.y=angle;
      }
      this.mesh(this.sphere(.035,12),this.material('flower-center','#dcb45c',{roughness:.9}),flower,0,.028,0);
      const leaf=this.leaf(flower,green,.23,.05);leaf.rotation.y=2.4;leaf.position.set(-.04,-.02,-.03);
    }
  }

  build(selection) {
    const root=new THREE.Group();root.name='configured-cake';
    const scale=selection.size ? .78 + ['pp','p','m','g','gg'].indexOf(selection.size.id)*.055 : .94;
    this.pedestal(root,scale);
    const cake=new THREE.Group();cake.position.y=.07;cake.scale.set(scale,1,scale);cake.name='cake-layers';root.add(cake);
    const crumb=this.crumb(selection.dough.id==='chocolate');
    let y=0;
    for(let i=0;i<4;i++){
      this.buildLayer(cake,1.18,.3,y+.15,crumb,`sponge-${i+1}`);y+=.3;
      if(i<3){const filling=selection.fillings[i%Math.max(selection.fillings.length,1)];this.buildLayer(cake,1.19,.105,y+.0525,this.filling(filling),`filling-${i+1}-${filling?.id||'cream'}`);y+=.105;}
    }
    const color=this.frosting(selection);
    const frosting=this.material(`frost-${color}`,color,{roughness:.39,clearcoat:.27,side:THREE.DoubleSide});
    this.mesh(this.cylinder(RADIUS,HEIGHT+.02,true),frosting,cake,0,HEIGHT/2,0,'frosting-side');
    this.mesh(this.cylinder(RADIUS,.047),frosting,cake,0,HEIGHT+.008,0,'frosting-top');
    for(const angle of [START,END])this.mesh(this.radialFace(RADIUS,HEIGHT+.025,angle,1.18),frosting,cake,0,HEIGHT/2,0,'frosting-cut-edge');
    let secondary;
    if(selection.coating.id==='recheio' && selection.fillings.length>1){
      const second=selection.fillings[1];secondary=this.material(`frost-${second.color}`,second.color,{roughness:.4,clearcoat:.25,side:THREE.DoubleSide});
      this.mesh(this.cylinder(RADIUS+.003,HEIGHT,true,5.48,.62,28),secondary,cake,0,HEIGHT/2,0,'second-filling-frosting');
    }
    const extras=new Set(selection.extras.map(extra=>extra.id));
    if(extras.has('ganache'))this.ganache(cake);
    if(extras.has('papel-arroz'))this.ricePaper(cake);
    this.buttercream(cake,frosting,secondary);
    if(extras.has('frutas'))this.fruit(cake);
    if(extras.has('chocolates'))this.chocolates(cake);
    if(extras.has('docinhos'))this.sweets(cake);
    if(extras.has('topo'))this.topper(cake);
    if(extras.has('flores'))this.flowers(cake);
    if(extras.has('glitter'))this.glitter(cake);
    return root;
  }

  update(selection) {
    if(!selection)return;
    if(this.model){this.scene.remove(this.model);this.model.traverse(mesh=>{if(mesh.isInstancedMesh)mesh.dispose();});}
    this.model=this.build(selection);this.scene.add(this.model);
    this.host.dataset.fillings=selection.fillings.map(filling=>filling.id).join(',');
    this.host.dataset.extras=selection.extras.map(extra=>extra.id).join(',');
    this.host.dataset.coating=selection.coating.id;
    this.host.dataset.coatingColor=this.frosting(selection);
    this.host.dataset.sponge=selection.dough.id;
    this.host.dataset.layers='4';
    this.viewHalf=selection.extras.some(extra=>extra.id==='topo') ? 2 : 1.85;
    this.targetY=selection.extras.some(extra=>extra.id==='topo') ? .83 : .6;
    this.resize();
    this.render();
  }

  resize() {
    const {width,height}=this.host.getBoundingClientRect();
    if(width<1||height<1)return;
    if(this.width!==width||this.height!==height){this.renderer.setSize(width,height,false);this.width=width;this.height=height;}
    const half=this.viewHalf,aspect=width/height;
    this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    if(this.frame)return;
    this.frame=requestAnimationFrame(()=>{
      this.frame=0;
      const radius=7;
      this.camera.position.set(Math.sin(this.yaw)*Math.cos(this.pitch)*radius,this.targetY+Math.sin(this.pitch)*radius,Math.cos(this.yaw)*Math.cos(this.pitch)*radius);
      this.camera.lookAt(0,this.targetY,0);
      this.renderer.render(this.scene,this.camera);
      this.host.dataset.rendered='true';
    });
  }

  resetView() {this.yaw=.03;this.pitch=.42;this.render();}

  bindControls() {
    const canvas=this.renderer.domElement;
    let pointer;
    canvas.addEventListener('pointerdown',event=>{pointer={id:event.pointerId,x:event.clientX,y:event.clientY};});
    canvas.addEventListener('pointermove',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(event.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.3)return;
      canvas.setPointerCapture(event.pointerId);
      this.yaw-=dx*.012;this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.007,.14,.88);
      pointer.x=event.clientX;pointer.y=event.clientY;this.render();
    });
    const release=()=>{pointer=undefined;};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Home')this.resetView();
      else if(event.key==='ArrowLeft')this.yaw-=.15;
      else if(event.key==='ArrowRight')this.yaw+=.15;
      else this.pitch=THREE.MathUtils.clamp(this.pitch+(event.key==='ArrowUp' ? .08 : -.08),.14,.88);
      this.render();
    });
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.host.dataset.renderer='context-lost';});
    canvas.addEventListener('webglcontextrestored',()=>{this.host.dataset.renderer='webgl';this.render();});
  }
}
