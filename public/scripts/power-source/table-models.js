export function makeTableModels(T) {
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const material = (color, metalness = 0, roughness = 0.65) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const palette = {
    ebony: material(0x203239),
    rubber: material(0x354449),
    seam: material(0x13282f),
    steel: material(0xc4d1ce, 0.57, 0.32),
    blackSteel: material(0x677c82, 0.48),
    gold: material(0xcd9e52, 0.55, 0.42),
    cream: material(0xf3eada),
    white: material(0xf4f7e9),
    mutedCream: material(0xcdc7b3),
    orange: material(0xe7a052),
    red: material(0xc74335),
    blue: material(0x3b80a0),
    navy: material(0x28576d),
    teal: material(0x146a63),
    green: material(0x69a26a),
  };
  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  const sphereGeometry = new T.SphereGeometry(1, 20, 12);
  const cylinderGeometry = new T.CylinderGeometry(1, 1, 1, 20);
  const dotGeometry = new T.CylinderGeometry(1, 1, 1, 8);
  const identity = new T.Quaternion();

  function group(name, parent, x = 0, y = 0, z = 0) {
    const object = new T.Group();
    object.name = name;
    object.position.set(x, y, z);
    parent?.add(object);
    return object;
  }

  function mesh(parent, geometry, surface, x, y, z, casts = true) {
    const part = new T.Mesh(geometry, surface);
    part.position.set(x, y, z);
    part.castShadow = casts;
    part.receiveShadow = casts;
    parent.add(part);
    return part;
  }

  function box(parent, surface, w, h, d, x, y, z, casts = true) {
    const part = mesh(parent, boxGeometry, surface, x, y, z, casts);
    part.scale.set(w, h, d);
    return part;
  }

  function orb(parent, surface, w, h, d, x, y, z) {
    const part = mesh(parent, sphereGeometry, surface, x, y, z);
    part.scale.set(w, h, d);
    return part;
  }

  function cylinder(parent, surface, radius, height, x, y, z, axis = "y", casts = true) {
    const part = mesh(parent, cylinderGeometry, surface, x, y, z, casts);
    part.scale.set(radius, height, radius);
    if (axis === "z") part.rotation.x = Math.PI / 2;
    if (axis === "x") part.rotation.z = -Math.PI / 2;
    return part;
  }

  function slab(parent, surface, width, height, depth, radius, x, y, z) {
    const left = -width / 2, right = width / 2;
    const bottom = -depth / 2, top = depth / 2;
    const contour = new T.Shape();
    contour.moveTo(left + radius, bottom);
    contour.lineTo(right - radius, bottom);
    contour.quadraticCurveTo(right, bottom, right, bottom + radius);
    contour.lineTo(right, top - radius);
    contour.quadraticCurveTo(right, top, right - radius, top);
    contour.lineTo(left + radius, top);
    contour.quadraticCurveTo(left, top, left, top - radius);
    contour.lineTo(left, bottom + radius);
    contour.quadraticCurveTo(left, bottom, left + radius, bottom);
    const geometry = new T.ExtrudeGeometry(contour, { depth: height, curveSegments: 4, bevelEnabled: false });
    const part = mesh(parent, geometry, surface, x, y - height / 2, z);
    part.rotation.x = -Math.PI / 2;
    return part;
  }

  function instances(parent, geometry, surface, dimensions, points) {
    const batch = new T.InstancedMesh(geometry, surface, points.length);
    const matrix = new T.Matrix4();
    const size = v(...dimensions);
    points.forEach((point, index) => batch.setMatrixAt(index, matrix.compose(v(...point), identity, size)));
    batch.instanceMatrix.needsUpdate = true;
    parent.add(batch);
    return batch;
  }

  function wire(parent, surface, points, radius = 0.021) {
    const path = new T.CatmullRomCurve3(points.map((point) => v(...point)));
    const geometry = new T.TubeGeometry(path, Math.max(14, points.length * 4), radius, 6, false);
    return mesh(parent, geometry, surface, 0, 0, 0, false);
  }

  function coil(parent, surface, x, z, radius, start, end) {
    const points = [start];
    for (let i = 0; i <= 28; i += 1) {
      const angle = i * Math.PI / 8 + Math.PI;
      const ring = radius + i * 0.0042;
      points.push([x + Math.cos(angle) * ring, 0.055 + i * 0.0015, z + Math.sin(angle) * ring * 0.58]);
    }
    points.push(end);
    return wire(parent, surface, points, 0.021);
  }

  function frontPort(parent, shell, width, height, depth, x, y, z) {
    box(parent, shell, width, height, depth, x, y, z);
    box(parent, palette.seam, width * 0.72, height * 0.55, 0.008, x, y, z + depth / 2, false);
  }

  function makeUsb() {
    const model = group("USB laptop and coiled cable");
    const { ebony, navy, steel, seam, rubber, cream } = palette;
    slab(model, ebony, 1.60, 0.113, 1.04, 0.08, 0, 0.070, -0.26);
    slab(model, blackKey, 1.57, 0.033, 1.01, 0.07, 0, 0.136, -0.26);
    const lid = group("Laptop lid", model, 0, 0.17, -0.73);
    lid.rotation.x = -0.27;
    box(lid, ebony, 1.58, 0.99, 0.082, 0, 0.49, 0, true);
    box(lid, navy, 1.46, 0.86, 0.013, 0, 0.50, 0.047, false);
    box(lid, screen, 1.37, 0.77, 0.010, 0, 0.50, 0.055, false);
    box(lid, steel, 1.37, 0.074, 0.012, 0, 0.838, 0.057, false);
    for (const [x, width] of [[-0.19, 0.61], [-0.29, 0.42], [-0.35, 0.29]]) {
      box(lid, screenInk, width, 0.026, 0.004, x, 0.46 + width * 0.38, 0.062, false);
    }
    box(lid, orangeScreen, 0.34, 0.21, 0.004, 0.41, 0.44, 0.062, false);
    orb(lid, seam, 0.015, 0.015, 0.006, 0, 0.952, 0.045);
    const keyCenters = Array.from({ length: 44 }, (_, i) => [(i % 11 - 5) * 0.104, 0.162, -0.63 + Math.floor(i / 11) * 0.098]);
    instances(model, boxGeometry, rubber, [0.082, 0.016, 0.072], keyCenters);
    box(model, steel, 0.43, 0.011, 0.24, 0, 0.155, -0.045, false);
    box(model, cream, 0.32, 0.014, 0.035, 0, 0.16, 0.09, false);
    frontPort(model, steel, 0.20, 0.08, 0.11, -0.50, 0.085, 0.28);
    coil(model, seam, -0.03, 0.55, 0.33, [-0.50, 0.085, 0.35], [0.56, 0.095, 0.79]);
    slab(model, rubber, 0.19, 0.12, 0.23, 0.029, 0.56, 0.11, 0.86);
    frontPort(model, steel, 0.135, 0.063, 0.12, 0.56, 0.105, 1.01);
    return { model, outlet: v(0.56, 0.105, 1.08) };
  }

  function makeAdapter() {
    const model = group("5 V adapter brick");
    const { ebony, seam, rubber, steel, blackSteel, cream, gold } = palette;
    slab(model, seam, 1.53, 0.12, 0.93, 0.10, 0, 0.09, -0.29);
    slab(model, ebony, 1.48, 0.40, 0.90, 0.10, 0, 0.31, -0.29);
    slab(model, rubber, 1.41, 0.055, 0.84, 0.077, 0, 0.525, -0.29);
    box(model, cream, 0.62, 0.012, 0.44, -0.03, 0.561, -0.27, false);
    instances(model, boxGeometry, blackSteel, [0.32, 0.004, 0.016], [
      [-0.09, 0.570, -0.41], [-0.09, 0.570, -0.34], [-0.09, 0.570, -0.27],
    ]);
    box(model, gold, 0.18, 0.004, 0.055, 0.12, 0.570, -0.15, false);
    instances(model, boxGeometry, seam, [0.035, 0.007, 0.64],
      Array.from({ length: 5 }, (_, i) => [-0.65 + i * 0.057, 0.557, -0.29]));
    for (const x of [-0.21, 0.21]) {
      box(model, steel, 0.075, 0.09, 0.23, x, 0.27, -0.85);
    }
    frontPort(model, blackSteel, 0.26, 0.17, 0.14, -0.46, 0.24, 0.18);
    coil(model, ebony, 0.01, 0.52, 0.31, [-0.46, 0.23, 0.25], [0.62, 0.081, 0.73]);
    cylinder(model, rubber, 0.078, 0.24, 0.62, 0.090, 0.82, "z");
    cylinder(model, blackSteel, 0.049, 0.13, 0.62, 0.09, 0.98, "z");
    cylinder(model, seam, 0.025, 0.007, 0.62, 0.09, 1.049, "z", false);
    return { model, outlet: v(0.62, 0.09, 1.063) };
  }

  function makeCells() {
    const model = group("AA tray with AAA size sample");
    const { seam, rubber, orange, navy, steel, blackSteel, cream, green } = palette;
    slab(model, seam, 1.35, 0.15, 1.32, 0.09, -0.29, 0.08, -0.09);
    box(model, rubber, 1.28, 0.16, 0.078, -0.29, 0.19, 0.53);
    box(model, rubber, 1.28, 0.16, 0.078, -0.29, 0.19, -0.70);
    box(model, rubber, 0.072, 0.16, 1.19, -0.94, 0.19, -0.085);
    box(model, rubber, 0.072, 0.16, 1.19, 0.365, 0.19, -0.085);
    const cell = (x, z, diameter, length, plusSide, wrap) => {
      const body = group("Battery cell", model, x, 0.154 + diameter / 2, z);
      body.rotation.y = plusSide < 0 ? Math.PI : 0;
      const radius = diameter / 2;
      cylinder(body, steel, radius * 0.97, length, 0, 0, 0, "z");
      cylinder(body, wrap, radius, length * 0.87, 0, 0, -0.01, "z");
      cylinder(body, cream, radius * 1.002, 0.06, 0, 0, length * 0.29, "z", false);
      cylinder(body, blackSteel, radius * 0.60, 0.026, 0, 0, -length / 2, "z", false);
      cylinder(body, steel, radius * 0.39, 0.065, 0, 0, length / 2 + 0.02, "z");
    };
    [-0.76, -0.45, -0.14, 0.17].forEach((x, i) => cell(x, -0.09, 0.27, 1.10, i % 2 === 0 ? 1 : -1, i % 2 ? orange : navy));
    slab(model, mutedTray, 0.49, 0.12, 1.19, 0.07, 0.67, 0.065, -0.10);
    cell(0.55, -0.08, 0.17, 0.86, 1, green);
    cell(0.78, -0.08, 0.17, 0.86, 1, steel);
    for (const [index, surface] of [palette.red, palette.ebony].entries()) {
      const x = -0.35 + index * 0.10;
      wire(model, surface, [[x, 0.17, 0.54], [x, 0.135, 0.62], [x + 0.21, 0.10, 0.77], [x + 0.21, 0.12, 0.86]]);
    }
    frontPort(model, rubber, 0.23, 0.14, 0.19, -0.09, 0.12, 0.90);
    return { model, outlet: v(-0.09, 0.12, 1.008) };
  }

  function makeLithium() {
    const model = group("LiPo pouch and 18650 cell");
    const { steel, mutedCream, cream, red, navy, green, seam, rubber, gold } = palette;
    slab(model, mutedTray, 1.86, 0.12, 1.54, 0.13, 0, 0.064, -0.08);
    slab(model, steel, 0.87, 0.30, 0.97, 0.12, -0.45, 0.26, -0.23);
    slab(model, gold, 0.83, 0.062, 0.14, 0.03, -0.45, 0.395, 0.22);
    slab(model, cream, 0.64, 0.023, 0.63, 0.055, -0.45, 0.422, -0.29);
    box(model, navy, 0.60, 0.004, 0.14, -0.45, 0.437, -0.46, false);
    box(model, mutedCream, 0.38, 0.004, 0.032, -0.49, 0.438, -0.27, false);
    box(model, mutedCream, 0.30, 0.004, 0.026, -0.53, 0.438, -0.19, false);
    wire(model, red, [[-0.50, 0.31, 0.24], [-0.48, 0.24, 0.39], [-0.66, 0.18, 0.53], [-0.57, 0.19, 0.61]]);
    wire(model, seam, [[-0.40, 0.31, 0.24], [-0.39, 0.20, 0.39], [-0.56, 0.15, 0.53], [-0.48, 0.19, 0.61]]);
    frontPort(model, cream, 0.23, 0.15, 0.21, -0.53, 0.19, 0.68);

    slab(model, rubber, 0.69, 0.12, 1.40, 0.10, 0.44, 0.17, -0.11);
    cylinder(model, steel, 0.22, 1.15, 0.44, 0.40, -0.15, "z");
    cylinder(model, green, 0.226, 1.08, 0.44, 0.40, -0.15, "z");
    cylinder(model, mutedCream, 0.228, 0.28, 0.44, 0.40, -0.27, "z", false);
    cylinder(model, cream, 0.218, 0.055, 0.44, 0.40, 0.402, "z", false);
    cylinder(model, steel, 0.107, 0.065, 0.44, 0.40, 0.452, "z");
    return { model, outlet: v(-0.53, 0.19, 0.797) };
  }

  function makeMains() {
    const model = group("Covered mains power strip and insulated plug");
    const { cream, white, mutedCream, seam, rubber, red } = palette;
    slab(model, mutedCream, 1.83, 0.13, 1.07, 0.14, 0, 0.08, -0.05);
    slab(model, cream, 1.83, 0.31, 1.07, 0.14, 0, 0.29, -0.05);
    for (const x of [-0.53, 0.04, 0.61]) {
      cylinder(model, mutedCream, 0.231, 0.014, x, 0.448, -0.03, "y", false);
      cylinder(model, white, 0.200, 0.012, x, 0.456, -0.03, "y", false);
      box(model, seam, 0.038, 0.010, 0.087, x - 0.070, 0.465, -0.063, false);
      box(model, seam, 0.038, 0.010, 0.087, x + 0.070, 0.465, -0.063, false);
      cylinder(model, seam, 0.036, 0.010, x, 0.466, 0.066, "y", false);
    }
    box(model, rubber, 0.18, 0.07, 0.14, 0.54, 0.464, -0.40);
    box(model, red, 0.15, 0.013, 0.11, 0.54, 0.507, -0.40, false);
    cylinder(model, rubber, 0.178, 0.17, -0.53, 0.551, -0.03);
    slab(model, seam, 0.31, 0.18, 0.37, 0.09, -0.53, 0.66, -0.045);
    wire(model, seam, [[-0.53, 0.66, -0.21], [-0.54, 0.61, -0.48], [-0.72, 0.37, -0.75], [-0.97, 0.09, -0.86]], 0.043);
    return { model, outlet: v(0.04, 0.48, -0.01) };
  }

  function makeBoard() {
    const model = group("ESP32 mounted on a breadboard");
    const { mutedCream, white, seam, steel, navy, teal, gold, cream, red, blue } = palette;
    slab(model, mutedCream, 2.79, 0.105, 2.18, 0.09, 0, 0.061, 0);
    slab(model, white, 2.75, 0.112, 2.14, 0.09, 0, 0.151, 0);
    box(model, mutedCream, 0.104, 0.015, 1.90, 0, 0.210, 0, false);
    const socketPoints = [];
    for (let row = 0; row < 15; row += 1) {
      for (const x of [-1.26, -1.14, -0.91, -0.76, -0.61, -0.46, -0.31, 0.31, 0.46, 0.61, 0.76, 0.91, 1.14, 1.26]) {
        socketPoints.push([x, 0.213, -0.93 + row * 0.133]);
      }
    }
    instances(model, dotGeometry, seam, [0.022, 0.009, 0.022], socketPoints);
    for (const [x, surface] of [[-1.32, red], [-1.08, blue], [1.32, red], [1.08, blue]]) {
      box(model, surface, 0.026, 0.007, 1.89, x, 0.214, 0, false);
    }
    slab(model, teal, 1.12, 0.09, 1.63, 0.062, -0.55, 0.30, 0.045);
    for (const x of [-1.04, -0.065]) {
      box(model, seam, 0.12, 0.068, 1.39, x, 0.331, 0.043);
      const pins = Array.from({ length: 11 }, (_, i) => [x, 0.379, -0.56 + i * 0.121]);
      instances(model, boxGeometry, gold, [0.061, 0.026, 0.059], pins);
    }
    slab(model, navy, 0.72, 0.035, 1.03, 0.036, -0.56, 0.36, -0.19);
    box(model, steel, 0.64, 0.055, 0.69, -0.56, 0.407, -0.038);
    box(model, mutedCream, 0.36, 0.004, 0.017, -0.59, 0.437, -0.14, false);
    box(model, mutedCream, 0.28, 0.004, 0.017, -0.63, 0.437, -0.083, false);
    const antenna = [[-0.84, -0.61], [-0.72, -0.61], [-0.72, -0.49], [-0.60, -0.49], [-0.60, -0.61], [-0.48, -0.61], [-0.48, -0.49], [-0.36, -0.49]];
    antenna.slice(1).forEach(([x, z], index) => {
      const [oldX, oldZ] = antenna[index];
      box(model, gold, Math.abs(x - oldX) + 0.018, 0.005, Math.abs(z - oldZ) + 0.018,
        (x + oldX) / 2, 0.381, (z + oldZ) / 2, false);
    });
    box(model, seam, 0.24, 0.06, 0.19, -0.56, 0.37, 0.50);
    for (const x of [-0.89, -0.25]) {
      box(model, seam, 0.105, 0.06, 0.109, x, 0.377, 0.68);
      cylinder(model, steel, 0.033, 0.013, x, 0.415, 0.68, "y", false);
    }
    frontPort(model, steel, 0.34, 0.16, 0.24, -0.56, 0.391, 0.795);
    wire(model, red, [[0.03, 0.38, 0.46], [0.39, 0.69, 0.50], [0.79, 0.52, 0.38], [0.91, 0.222, 0.27]]);
    wire(model, navy, [[0.03, 0.376, 0.67], [0.40, 0.54, 0.81], [0.74, 0.52, 0.83], [1.25, 0.222, 0.77]]);
    const indicatorSurface = new T.MeshStandardMaterial({
      color: 0xbe3b32, emissive: 0xef301e, emissiveIntensity: 0.13, roughness: 0.38,
    });
    for (const [x, z] of [[0.73, 0.26], [0.85, 0.39]]) {
      cylinder(model, steel, 0.019, 0.165, x, 0.294, z, "y", false);
    }
    cylinder(model, red, 0.095, 0.037, 0.79, 0.365, 0.32);
    const indicator = orb(model, indicatorSurface, 0.083, 0.104, 0.083, 0.79, 0.408, 0.32);
    wire(model, steel, [[0.46, 0.214, -0.30], [0.50, 0.312, -0.30], [1.03, 0.312, -0.30], [1.13, 0.214, -0.30]], 0.017);
    cylinder(model, cream, 0.055, 0.38, 0.76, 0.31, -0.30, "x", false);
    for (const [x, surface] of [[0.64, red], [0.69, red], [0.77, seam], [0.89, gold]]) {
      cylinder(model, surface, 0.056, 0.025, x, 0.31, -0.30, "x", false);
    }
    return { model, inlet: v(-0.56, 0.391, 0.926), indicator };
  }

  function loadBase(name, color) {
    const model = group(name);
    slab(model, palette.seam, 2.64, 0.10, 1.94, 0.12, 0, 0.057, 0);
    slab(model, color, 2.60, 0.10, 1.90, 0.12, 0, 0.137, 0);
    for (const x of [-1.09, 1.09]) {
      for (const z of [-0.73, 0.73]) cylinder(model, palette.steel, 0.059, 0.015, x, 0.193, z, "y", false);
    }
    return model;
  }

  function makeServo() {
    const model = loadBase("Blue hobby servo with visible horn", palette.navy);
    const { blue, navy, cream, seam, steel, orange, red } = palette;
    slab(model, navy, 1.64, 0.18, 0.89, 0.07, -0.18, 0.24, -0.16);
    slab(model, blue, 1.48, 0.64, 0.80, 0.08, -0.18, 0.58, -0.16);
    slab(model, navy, 1.45, 0.08, 0.77, 0.064, -0.18, 0.94, -0.16);
    box(model, cream, 0.80, 0.33, 0.009, -0.26, 0.62, 0.246, false);
    box(model, blue, 0.80, 0.097, 0.010, -0.26, 0.75, 0.252, false);
    box(model, seam, 0.64, 0.033, 0.010, -0.30, 0.62, 0.254, false);
    for (const x of [-0.88, 0.56]) cylinder(model, steel, 0.05, 0.024, x, 0.344, -0.16, "y", false);
    cylinder(model, seam, 0.25, 0.115, -0.48, 1.02, -0.18);
    const moving = group("Servo horn", model, -0.48, 1.09, -0.18);
    cylinder(moving, cream, 0.155, 0.11, 0, 0.02, 0);
    slab(moving, cream, 0.22, 0.080, 0.75, 0.064, 0, 0.02, 0.40);
    cylinder(moving, steel, 0.061, 0.015, 0, 0.083, 0, "y", false);
    for (let i = 0; i < 4; i += 1) cylinder(moving, seam, 0.025, 0.012, 0, 0.066, 0.36 + i * 0.104, "y", false);
    [seam, red, orange].forEach((surface, i) => {
      const x = 0.48 + i * 0.068;
      wire(model, surface, [[x, 0.42, 0.18], [x + 0.22, 0.30, 0.30], [x + 0.18, 0.23, 0.57], [x + 0.10, 0.26, 0.80]], 0.023);
    });
    frontPort(model, seam, 0.26, 0.17, 0.23, 0.65, 0.26, 0.86);
    return { model, inlet: v(0.65, 0.26, 0.984), moving };
  }

  function makeMotor() {
    const model = loadBase("Brushed DC motor with spinning rotor disk", palette.mutedCream);
    const { blackSteel, steel, orange, seam, red, teal, cream } = palette;
    cylinder(model, blackSteel, 0.60, 0.14, -0.28, 0.26, -0.10);
    cylinder(model, steel, 0.50, 0.60, -0.28, 0.62, -0.10);
    cylinder(model, blackSteel, 0.506, 0.075, -0.28, 0.952, -0.10);
    cylinder(model, seam, 0.234, 0.10, -0.28, 1.021, -0.10);
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      const vent = box(model, seam, 0.14, 0.075, 0.019, -0.28 + Math.sin(angle) * 0.496, 0.74,
        -0.10 + Math.cos(angle) * 0.496, false);
      vent.rotation.y = angle;
    }
    const moving = group("DC motor shaft and striped rotor", model, -0.28, 1.07, -0.10);
    cylinder(moving, steel, 0.074, 0.26, 0, 0.05, 0);
    cylinder(moving, orange, 0.385, 0.087, 0, 0.195, 0);
    box(moving, cream, 0.115, 0.014, 0.34, 0, 0.244, 0.17, false);
    cylinder(moving, steel, 0.118, 0.026, 0, 0.247, 0);
    slab(model, teal, 0.71, 0.102, 0.73, 0.06, 0.76, 0.239, 0.29);
    box(model, seam, 0.34, 0.095, 0.33, 0.76, 0.33, 0.23);
    for (const x of [0.58, 0.92]) {
      cylinder(model, steel, 0.065, 0.09, x, 0.335, 0.49);
    }
    wire(model, red, [[0.21, 0.42, 0.16], [0.39, 0.47, 0.12], [0.49, 0.31, 0.15], [0.56, 0.30, 0.22]]);
    wire(model, seam, [[0.22, 0.34, 0.24], [0.36, 0.40, 0.26], [0.48, 0.33, 0.31], [0.56, 0.30, 0.34]]);
    frontPort(model, seam, 0.30, 0.13, 0.20, 0.76, 0.25, 0.66);
    return { model, inlet: v(0.76, 0.25, 0.774), moving };
  }

  function makeTable() {
    const table = group("Workshop table and cutting mat");
    const { seam, navy } = palette;
    slab(table, woodEdge, 12.60, 0.28, 7.40, 0.22, 0, -0.15, 0);
    slab(table, woodTop, 12.55, 0.047, 7.35, 0.20, 0, -0.025, 0);
    slab(table, woodEdge, 12.17, 0.22, 7.04, 0.14, 0, -0.34, 0);
    for (const x of [-5.72, 5.72]) {
      for (const z of [-3.05, 3.05]) {
        box(table, navy, 0.33, 2.64, 0.36, x, -1.70, z);
        box(table, seam, 0.35, 0.12, 0.38, x, -2.99, z);
      }
    }
    for (let i = 0; i < 18; i += 1) {
      const z = -3.23 + i * 0.381;
      const offset = i % 2 === 0 ? -3.72 : 3.72;
      box(table, woodGrain, 4.18 - (i % 3) * 0.36, 0.002, 0.008, offset, 0.001, z, false);
    }
    slab(table, matEdge, 6.69, 0.027, 3.69, 0.10, 0, 0.012, 0.53);
    slab(table, matTop, 6.61, 0.010, 3.60, 0.09, 0, 0.023, 0.53);
    const xGrid = Array.from({ length: 25 }, (_, i) => [-3.12 + i * 0.26, 0.029, 0.53]);
    const zGrid = Array.from({ length: 13 }, (_, i) => [0, 0.029, -1.03 + i * 0.26]);
    instances(table, boxGeometry, matInk, [0.008, 0.001, 3.12], xGrid);
    instances(table, boxGeometry, matInk, [6.24, 0.001, 0.008], zGrid);
    const rulerTicks = Array.from({ length: 45 }, (_, i) => [-3.08 + i * 0.14, 0.030, 2.205]);
    instances(table, boxGeometry, matRuler, [0.011, 0.001, 0.066], rulerTicks);
    return table;
  }

  function makePerson() {
    const person = group("Learner seen from behind the shoulder");
    const hand = material(0xd3a37b, 0, 0.87);
    const ear = material(0xb88667, 0, 0.89);
    const hair = material(0x2c2725, 0, 0.94);
    const shirt = material(0x27566b, 0, 0.95);
    const cuff = material(0x234452, 0, 0.96);
    const up = v(0, 1, 0);
    function limb(surface, from, to, radius) {
      const a = v(...from);
      const b = v(...to);
      const length = a.distanceTo(b);
      const center = a.clone().lerp(b, 0.5);
      const geometry = new T.CapsuleGeometry(radius, Math.max(0.002, length - radius * 2), 3, 10);
      const part = mesh(person, geometry, surface, center.x, center.y, center.z);
      part.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
      return part;
    }
    orb(person, shirt, 0.72, 0.90, 0.41, 0, -0.83, 0.40).rotation.x = -0.16;
    orb(person, cuff, 0.34, 0.20, 0.31, 0, -0.20, 0.19);
    orb(person, hand, 0.19, 0.25, 0.18, 0, -0.04, 0.17);
    orb(person, hand, 0.39, 0.48, 0.38, 0, 0.34, 0.14).rotation.x = -0.22;
    orb(person, hair, 0.414, 0.445, 0.355, 0, 0.43, 0.224).rotation.x = -0.20;
    orb(person, hair, 0.375, 0.28, 0.272, 0, 0.63, 0.15).rotation.z = 0.14;
    for (const side of [-1, 1]) {
      orb(person, ear, 0.071, 0.108, 0.066, side * 0.37, 0.34, 0.105);
      limb(shirt, [side * 0.45, -0.34, 0.32], [side * 0.76, -0.42, 0.02], 0.218);
      limb(cuff, [side * 0.73, -0.38, 0.07], [side * 0.82, -0.35, -0.12], 0.177);
      limb(hand, [side * 0.82, -0.35, -0.10], [side * 0.87, 0.056, -0.65], 0.117);
      orb(person, hand, 0.124, 0.071, 0.148, side * 0.88, 0.081, -0.66);
      for (let i = 0; i < 4; i += 1) {
        const x = side * (0.813 + i * 0.048);
        limb(hand, [x, 0.083, -0.69], [x + side * 0.018, 0.060, -0.88 + Math.abs(i - 1) * 0.027], 0.025);
      }
      limb(hand, [side * 0.80, 0.080, -0.61], [side * 0.74, 0.061, -0.72], 0.034);
    }
    return person;
  }

  const blackKey = material(0x44565b);
  const screen = material(0x9ac6d2, 0, 0.36);
  const screenInk = material(0x427485);
  const orangeScreen = material(0xe6a662);
  const mutedTray = material(0x3f6669);
  const woodEdge = material(0xb88d64, 0, 0.89);
  const woodTop = material(0xe6ccaa, 0, 0.9);
  const woodGrain = material(0xd1b390);
  const matEdge = material(0x294c46);
  const matTop = material(0x385e53);
  const matInk = material(0x567e72);
  const matRuler = material(0x799a86);

  return {
    sources: {
      usb: makeUsb(),
      adapter: makeAdapter(),
      aa: makeCells(),
      lithium: makeLithium(),
      mains: makeMains(),
    },
    loads: {
      board: makeBoard(),
      servo: makeServo(),
      motor: makeMotor(),
    },
    person: makePerson(),
    table: makeTable(),
  };
}
