import * as THREE from '../vendor/three.module.min.js';
import { makeTableModels } from './table-models.js';

const supplies = ['usb', 'adapter', 'aa', 'lithium', 'mains'];
const cableColors = { usb: 0x263a51, adapter: 0x233d49, aa: 0x9d502f, lithium: 0x47588a, mains: 0xc73d22 };
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const vector = (x, y, z) => new THREE.Vector3(x, y, z);
const easing = (t) => t * t * (3 - 2 * t);
const between = (progress, start, end) => THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
const pickupAt = .21;
const connectedAt = .56;
const poweredAt = .62;
const wideAt = .86;

function buildPlug(surface) {
  const plug = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.BoxGeometry(.21, .14, .29), surface);
  grip.position.z = -.16;
  const tip = new THREE.Mesh(new THREE.BoxGeometry(.13, .076, .095), new THREE.MeshStandardMaterial({ color: 0xc4d6dc, metalness: .56, roughness: .38 }));
  tip.position.z = -.028;
  plug.add(grip, tip);
  plug.visible = false;
  return plug;
}

function buildPortFault() {
  const fault = new THREE.Group();
  const bolt = new THREE.Shape();
  bolt.moveTo(.10, .27);
  bolt.lineTo(-.17, -.03);
  bolt.lineTo(-.015, -.03);
  bolt.lineTo(-.10, -.27);
  bolt.lineTo(.19, .055);
  bolt.lineTo(.027, .055);
  bolt.lineTo(.10, .27);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(.32, 32), new THREE.MeshBasicMaterial({ color: 0x9d2d1e, side: THREE.DoubleSide }));
  const icon = new THREE.Mesh(new THREE.ShapeGeometry(bolt), new THREE.MeshBasicMaterial({ color: 0xffe676, side: THREE.DoubleSide }));
  icon.position.z = .005;
  fault.add(disk, icon);
  fault.visible = false;
  return fault;
}

function buildFire() {
  const group = new THREE.Group();
  const flameSurface = new THREE.MeshBasicMaterial({ color: 0xff9537, transparent: true, opacity: .91, depthWrite: false });
  const coreSurface = new THREE.MeshBasicMaterial({ color: 0xffd56d, transparent: true, opacity: .97, depthWrite: false });
  const emberSurface = new THREE.MeshBasicMaterial({ color: 0xffac61, transparent: true, opacity: .92 });
  const flame = new THREE.Group();
  const flameShape = new THREE.ConeGeometry(.20, .75, 9);
  const coreShape = new THREE.ConeGeometry(.105, .53, 9);
  [[-.21, .35, -.02], [.05, .54, .05], [.23, .28, .05], [-.04, .3, .20]].forEach(([x, y, z], index) => {
    const lick = new THREE.Mesh(flameShape, flameSurface);
    lick.position.set(x, y, z);
    lick.rotation.z = (index - 1.5) * -.18;
    flame.add(lick);
    const core = new THREE.Mesh(coreShape, coreSurface);
    core.position.set(x, y - .1, z + .035);
    flame.add(core);
  });
  group.add(flame);
  const smokeGeometry = new THREE.SphereGeometry(1, 9, 7);
  const smoke = Array.from({ length: 10 }, (_, index) => {
    const bubble = new THREE.Mesh(smokeGeometry, new THREE.MeshBasicMaterial({ color: 0x4f5059, transparent: true, opacity: .35, depthWrite: false }));
    bubble.position.set(0, index / 12, 0);
    group.add(bubble);
    return bubble;
  });
  const emberGeometry = new THREE.IcosahedronGeometry(.055, 0);
  const embers = Array.from({ length: 7 }, () => {
    const ember = new THREE.Mesh(emberGeometry, emberSurface);
    group.add(ember);
    return ember;
  });
  const soot = new THREE.Mesh(new THREE.CircleGeometry(.44, 18), new THREE.MeshBasicMaterial({ color: 0x27242a, transparent: true, opacity: .82, polygonOffset: true, polygonOffsetFactor: -3 }));
  soot.rotation.x = -Math.PI / 2;
  soot.position.y = -.014;
  soot.scale.set(1, .72, 1);
  group.add(soot);

  return {
    group,
    pose(progress, fire) {
      flame.visible = fire && progress < .84;
      flame.scale.set(1 + Math.sin(progress * 10) * .17, Math.max(.15, 1.4 - progress), 1);
      soot.visible = true;
      smoke.forEach((bubble, i) => {
        const t = Math.max(0, progress - i * .035);
        bubble.position.set(Math.sin(i * 2 + t * 2) * .21 - t * .8, .30 + t * (1.4 + (i % 3) * .3), Math.cos(i * 2) * .17);
        bubble.scale.setScalar(.12 + .35 * t + (i % 4) * .04);
        bubble.material.opacity = Math.max(0, .34 - t * .3);
        bubble.visible = t > 0;
      });
      embers.forEach((ember, i) => {
        ember.visible = fire && progress < .44;
        const t = progress * 2.05;
        const turn = i * 2.39996;
        ember.position.set(Math.cos(turn) * t, .19 + t * 1.75 - t * t * 1.2, Math.sin(turn) * t);
      });
    },
  };
}

export function setupWorkbench(view, handlers) {
  const canvas = view.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd5e7ed);
  scene.fog = new THREE.Fog(0xd5e7ed, 15, 35);
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 54);
  const { sources, loads, person, table } = makeTableModels(THREE);
  scene.add(table, person);
  person.position.set(3.85, 0, 4.05);
  person.rotation.y = .23;
  person.scale.setScalar(1.12);
  supplies.forEach((id, index) => {
    const source = sources[id];
    source.model.position.set((index - 2) * 2.40, .03, -2.36);
    source.model.rotation.y = id === 'usb' ? -.08 : id === 'lithium' ? -.08 : .05;
    source.model.userData.source = id;
    scene.add(source.model);
  });
  for (const fixture of Object.values(loads)) {
    fixture.model.userData.project = true;
    scene.add(fixture.model);
  }
  loads.board.model.position.set(-1.30, .028, .48);
  loads.servo.model.position.set(1.37, .028, .50);
  loads.motor.model.position.copy(loads.servo.model.position);
  loads.servo.model.rotation.y = -.21;
  loads.motor.model.rotation.y = -.16;
  const led = loads.board.indicator;
  const ledSurface = led.material;
  const support = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: 0xd5e7ed, roughness: .94 }));
  support.rotation.x = -Math.PI / 2;
  support.position.y = -3.04;
  support.receiveShadow = true;
  scene.add(support);
  const key = new THREE.DirectionalLight(0xffefe0, 2.6);
  key.position.set(-4, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, far: 27 });
  key.shadow.normalBias = .03;
  const fill = new THREE.DirectionalLight(0xd0edff, 1.0);
  fill.position.set(6, 7, -6);
  scene.add(key, fill, new THREE.HemisphereLight(0xe8f3ff, 0x8c735d, 2.05));

  const fire = buildFire();
  scene.add(fire.group);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.32, .45, 36), new THREE.MeshBasicMaterial({ color: 0x3ea4ce, side: THREE.DoubleSide, transparent: true, opacity: .72, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2;
  halo.visible = false;
  scene.add(halo);
  const mainCables = new THREE.Group();
  scene.add(mainCables);
  const cableSurface = new THREE.MeshStandardMaterial({ color: 0x273648, roughness: .55 });
  const branchSurface = new THREE.MeshStandardMaterial({ color: 0x8e3d45, roughness: .6 });
  const plug = buildPlug(cableSurface);
  const portFault = buildPortFault();
  scene.add(plug, portFault);
  const cue = view.querySelector('[data-workbench-cue]');
  const wideEye = vector(0, 0, 0);
  const wideTarget = vector(0, 0, 0);
  const aimedAt = vector(0, 0, 0);
  const cameraEye = vector(0, 0, 0);
  const cameraTarget = vector(0, 0, 0);
  const plugAxis = vector(0, 0, 1);
  const cableTangent = vector(0, 0, 0);
  const plugPoint = vector(0, 0, 0);
  const cableFocus = vector(0, 0, 0);
  let lead;
  let branch;
  let cablePath;
  let dockShot;
  let landingShot;
  let faultShot;
  let burnPoint;
  let request = 0;
  let load = 'servo';
  let usable = true;
  let finishTrial;
  let disposed = false;

  function draw(updateShadows = false) {
    if (!usable || disposed) return;
    portFault.quaternion.copy(camera.quaternion);
    if (updateShadows) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function aim(eye, target) {
    camera.position.copy(eye);
    aimedAt.copy(target);
    camera.lookAt(aimedAt);
    camera.updateMatrixWorld();
  }

  function overview() {
    aim(wideEye, wideTarget);
    supplies.forEach((id, index) => {
      const labelPoint = sources[id].model.position.clone().add(vector((index - 2) * .42, .92, -1.02));
      placeButton(view.querySelector(`[data-supply="${id}"]`), labelPoint);
    });
    placeButton(view.querySelector('[data-project]'), vector(-.13, .07, 2.34));
  }

  function placeButton(button, point) {
    const target = point.clone().project(camera);
    const x = THREE.MathUtils.clamp(target.x * 50 + 50, 7.7, 92.2);
    const y = THREE.MathUtils.clamp(50 - target.y * 50, 9, 85);
    button.style.setProperty('--dock-x', `${x}%`);
    button.style.setProperty('--dock-y', `${y}%`);
  }

  function layout() {
    const { width, height } = view.getBoundingClientRect();
    if (!usable || disposed || width < 1 || height < 1) return;
    view.dataset.dockLayout = width >= 610 ? 'projected' : 'row';
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const compact = camera.aspect < 1.35;
    camera.fov = compact ? 33 : 31;
    wideEye.set(compact ? 3.8 : 4.05, compact ? 10.2 : 8.4, compact ? 15.5 : 12.4);
    wideTarget.set(0, .12, compact ? -.25 : .02);
    camera.updateProjectionMatrix();
    if (!finishTrial) overview();
    draw(true);
  }

  function setCue(phase, caption = '') {
    if (phase === view.dataset.shot) return;
    if (phase) view.dataset.shot = phase;
    else delete view.dataset.shot;
    cue.textContent = caption;
    cue.hidden = !phase;
  }

  function clear() {
    cancelAnimationFrame(request);
    finishTrial = undefined;
    setCue();
    mainCables.children.slice().forEach((mesh) => { mainCables.remove(mesh); mesh.geometry.dispose(); });
    lead = undefined;
    branch = undefined;
    cablePath = undefined;
    halo.visible = false;
    plug.visible = false;
    portFault.visible = false;
    fire.group.visible = false;
    ledSurface.color.setHex(0x9a3b33);
    ledSurface.emissive.setHex(0xee2e20);
    ledSurface.emissiveIntensity = .12;
    loads.board.model.position.x = load === 'board' ? 0 : -1.30;
    loads.servo.model.visible = load === 'servo';
    loads.motor.model.visible = load === 'motor';
    for (const id of ['servo', 'motor']) loads[id].moving.rotation.y = 0;
    person.rotation.z = 0;
    scene.updateMatrixWorld(true);
  }

  function makeCable(path, surface, size) {
    const tube = new THREE.TubeGeometry(path, 56, size, 7, false);
    const cord = new THREE.Mesh(tube, surface);
    mainCables.add(cord);
    return cord;
  }

  function shotAt(point, offset, height = .19) {
    const target = point.clone().add(vector(0, height, 0));
    return { target, eye: target.clone().add(offset), offset, height };
  }

  function prepare(id, trial) {
    const source = sources[id];
    const output = source.model.localToWorld(source.outlet.clone());
    const overhead = vector(2.1, 2.72, 3.78);
    dockShot = shotAt(output.clone().lerp(source.model.position, .42), overhead, .16);
    if (trial.reason === 'portable') {
      halo.position.copy(source.model.position);
      halo.position.y = .05;
      halo.material.color.setHex(0xbc8b39);
      halo.scale.setScalar(1.88);
      halo.visible = true;
      return;
    }
    const board = loads.board;
    const mains = id === 'mains';
    // The AC lead is an abstract fault marker on the board surface.
    const input = board.model.localToWorld(mains ? vector(.67, .261, .38) : board.inlet.clone());
    burnPoint = mains ? input : board.model.localToWorld(vector(-.45, .458, .04));
    landingShot = shotAt(input, overhead);
    cableSurface.color.setHex(cableColors[id]);
    plug.children[1].visible = !mains;
    plug.scale.setScalar(mains ? 1.35 : 1);
    cablePath = new THREE.CatmullRomCurve3([
      output,
      output.clone().add(vector(-.05, .28, .35)),
      vector((output.x + input.x) * .5, .28, mains ? 2.02 : .67),
      vector(input.x + (mains ? .42 : -.55), .46, input.z + .70),
      input.clone().add(mains ? vector(.11, .36, .04) : vector(.033, -.007, .26)),
      input,
    ]);
    lead = makeCable(cablePath, cableSurface, mains ? .068 : .053);
    lead.geometry.setDrawRange(0, 0);
    if (load !== 'board' && !mains) {
      const fixture = loads[load];
      const branchFrom = board.model.localToWorld(vector(.95, .23, .83));
      const branchTo = fixture.model.localToWorld(fixture.inlet.clone());
      branch = makeCable(new THREE.CatmullRomCurve3([
        branchFrom, vector(.12, .12, 1.59), vector(.91, .10, 1.72), branchTo.clone().add(vector(.18, -.03, .25)), branchTo,
      ]), branchSurface, .037);
      branch.visible = false;
    }
    if (trial.reason === 'usb-port') {
      const port = source.model.localToWorld(vector(-.50, .085, .30));
      portFault.position.copy(port).add(vector(-.15, .5, .19));
      faultShot = shotAt(port, vector(1.9, 2.23, 3.20), .32);
    } else {
      faultShot = landingShot;
    }
  }

  function pose(trial, progress, animated) {
    const { state, reason } = trial;
    const leadProgress = easing(between(progress, pickupAt, connectedAt));
    const poweredProgress = between(progress, poweredAt, .87);
    const moving = loads[load].moving;
    if (lead) {
      const indicesPerSegment = 7 * 6;
      lead.geometry.setDrawRange(0, Math.round(leadProgress * 56) * indicesPerSegment);
      cablePath.getPointAt(leadProgress, plugPoint);
      cablePath.getTangentAt(leadProgress, cableTangent).normalize();
      plug.position.copy(plugPoint);
      plug.quaternion.setFromUnitVectors(plugAxis, cableTangent);
      plug.visible = true;
      if (branch) branch.visible = progress >= connectedAt;
    }
    if (state === 'works' && progress >= poweredAt) {
      ledSurface.emissiveIntensity = 2.25;
      if (load === 'servo') moving.rotation.y = 1.22 * easing(poweredProgress);
      if (load === 'motor') moving.rotation.y = Math.PI * 3 * easing(poweredProgress);
    }
    if (moving && (reason === 'current' || reason === 'usb-port') && animated) {
      moving.rotation.y = Math.sin(poweredProgress * Math.PI) * .26;
    }
    if (reason === 'usb-port' && progress >= poweredAt) {
      portFault.visible = true;
      const strike = between(progress, poweredAt, .76);
      const rebound = Math.sin(Math.PI * strike) * .22;
      portFault.scale.setScalar(.6 + easing(strike) * .4 + rebound);
    } else if (state === 'damage' && progress >= poweredAt) {
      fire.group.position.copy(burnPoint);
      fire.group.visible = true;
      fire.pose(between(progress, poweredAt, 1), reason === 'mains');
      ledSurface.emissiveIntensity = .01;
      ledSurface.color.setHex(0x3e3031);
    }
    if (animated) person.rotation.z = Math.sin(progress * Math.PI) * (state === 'damage' ? -.095 : .028);
  }

  function moveCamera(from, to, progress) {
    const blend = easing(progress);
    cameraEye.lerpVectors(from.eye, to.eye, blend);
    cameraTarget.lerpVectors(from.target, to.target, blend);
    aim(cameraEye, cameraTarget);
  }

  function frameCamera(start, trial, progress) {
    const wide = { eye: wideEye, target: wideTarget };
    const mains = trial.reason === 'mains';
    if (trial.reason === 'portable') {
      if (progress < .42) moveCamera(start, dockShot, between(progress, 0, .42));
      else moveCamera(dockShot, wide, between(progress, .65, 1));
      setCue('unavailable', 'หน้างานไม่มีแหล่งจ่ายนี้');
      return;
    }
    if (progress < pickupAt) {
      moveCamera(start, dockShot, between(progress, 0, .17));
      setCue('pickup', mains ? 'จำลองไฟบ้าน 220 V AC' : 'หยิบหัวสายจากแหล่งจ่าย');
    } else if (progress < connectedAt) {
      cableFocus.copy(plugPoint).y += landingShot.height;
      cameraEye.copy(cableFocus).add(landingShot.offset);
      const follow = easing(between(progress, pickupAt, pickupAt + .10));
      cameraTarget.lerpVectors(dockShot.target, cableFocus, follow);
      cameraEye.lerpVectors(dockShot.eye, cameraEye, follow);
      aim(cameraEye, cameraTarget);
      setCue('pull', mains ? 'เส้นทางแรงดันจำลองไปยัง Breadboard' : 'ลากสายเข้าหาวงจร');
    } else if (progress < poweredAt) {
      aim(landingShot.eye, landingShot.target);
      setCue('connected', mains ? 'ไฟบ้านถึง Breadboard ในฉากจำลอง' : 'หัวสายถึงวงจรแล้ว');
    } else {
      if (progress < wideAt) moveCamera(landingShot, faultShot, between(progress, poweredAt, .78));
      else moveCamera(faultShot, wide, between(progress, wideAt, 1));
      if (trial.reason === 'usb-port') setCue('usb-fault', 'พอร์ต USB ของคอมเสีย');
      else if (mains) setCue('board-fire', 'แรงดันเกิน · Breadboard ไหม้');
      else setCue('testing', 'ดูผลที่วงจร');
    }
  }

  function show(id, trial) {
    if (!usable) return;
    clear();
    prepare(id, trial);
    pose(trial, 1, false);
    if (trial.reason === 'mains' && motion.matches) fire.pose(.68, true);
    overview();
    draw();
  }

  function trial(id, result, complete) {
    if (!usable || motion.matches) {
      show(id, result);
      complete();
      return;
    }
    const firstShot = { eye: camera.position.clone(), target: aimedAt.clone() };
    clear();
    prepare(id, result);
    finishTrial = complete;
    const duration = result.reason === 'portable' ? 1450 : result.state === 'damage' ? 3900 : 3300;
    const started = performance.now();
    function frame(now) {
      const reducedMotion = motion.matches;
      const progress = reducedMotion ? 1 : Math.min((now - started) / duration, 1);
      pose(result, progress, progress < 1);
      if (progress < 1) {
        frameCamera(firstShot, result, progress);
        request = requestAnimationFrame(frame);
      } else {
        if (result.reason === 'mains' && reducedMotion) fire.pose(.68, true);
        setCue();
        overview();
        finishTrial = undefined;
        complete();
      }
      draw();
    }
    request = requestAnimationFrame(frame);
  }

  function reset(nextLoad) {
    load = nextLoad;
    clear();
    overview();
    draw(true);
  }

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const objects = [...Object.values(sources).map((source) => source.model), ...Object.values(loads).map((fixture) => fixture.model)];
  function hit(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
    ray.setFromCamera(pointer, camera);
    for (const intersection of ray.intersectObjects(objects.filter((object) => object.visible), true)) {
      let node = intersection.object;
      while (node && !node.userData.source && !node.userData.project) node = node.parent;
      if (node) return node.userData;
    }
    return null;
  }
  canvas.addEventListener('pointermove', (event) => { canvas.style.cursor = !handlers.isLocked() && hit(event) ? 'pointer' : 'default'; });
  canvas.addEventListener('click', (event) => {
    if (handlers.isLocked()) return;
    const target = hit(event);
    if (target?.source) handlers.selectSource(target.source);
    if (target?.project) handlers.selectProject();
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    usable = false;
    view.dataset.renderer = 'flat';
    const complete = finishTrial;
    clear();
    complete?.();
  });
  const observer = new ResizeObserver(layout);
  view.dataset.renderer = '3d';
  observer.observe(view);
  reset(load);
  layout();
  window.addEventListener('pagehide', () => {
    disposed = true;
    cancelAnimationFrame(request);
    observer.disconnect();
    renderer.dispose();
  }, { once: true });
  return { reset, show, trial };
}
