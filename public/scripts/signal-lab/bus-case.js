const busCases = {
  rs485: {
    wires: ["D+", "D−"],
    label: "บัส RS‑485 แบบสองสาย มีเทอร์มิเนชันที่ปลายทั้งสองด้าน",
    traffic: "เกตเวย์ถาม ID 2 → เซนเซอร์ CO₂ ตอบบนคู่สายเดิม",
    detail: "แต่ละโมดูลมี RS‑485 transceiver และที่อยู่ Modbus ของตัวเอง ทุกกิ่งต่อขนานเข้าคู่สายหลัก",
    packets: [[0, 2, 25, 0], [2, 0, 49, 1.12]],
  },
  can: {
    wires: ["CAN_H", "CAN_L"],
    label: "บัส CAN ในรถ มีเทอร์มิเนชันที่ปลายทั้งสองด้าน",
    traffic: "กล่อง ABS กระจายความเร็วล้อ → หน้าปัดและกล่องอื่นรับได้",
    detail: "เซนเซอร์วัดล้อและอุณหภูมิส่งเข้ากล่องของตัวเองก่อน กล่องจึงส่งข้อความผ่าน CAN transceiver ไปยังบัสร่วม",
    packets: [[1, 3, 25, 0], [1, 0, 25, .06]],
  },
};

export function renderBusCase(figure, kind, scene) {
  const config = busCases[kind];
  const width = 400;
  const anchors = scene.nodes.map((_, index) => (index + .5) * width / scene.nodes.length);
  const nodes = scene.nodes.map(node => `
    <li class="story-bus-node">
      ${node.illustration}
      <strong>${node.name}</strong>
      <small>${node.detail}</small>
    </li>`).join("");
  const stubs = anchors.map(x => `
    <path class="story-bus-high" d="M${x - 4} 2V25"/>
    <path class="story-bus-low" d="M${x + 4} 2V49"/>
    <circle class="story-bus-high-dot" cx="${x - 4}" cy="25" r="2.8"/>
    <circle class="story-bus-low-dot" cx="${x + 4}" cy="49" r="2.8"/>`).join("");
  const packets = config.packets.map(([from, to, lane, delay]) => `
    <circle class="story-bus-packet" cx="${anchors[from]}" cy="${lane}" r="4"
      style="--bus-distance:${anchors[to] - anchors[from]}px;--bus-delay:${delay}s"/>`).join("");

  figure.innerHTML = `
    <ul class="story-bus-nodes" aria-label="อุปกรณ์บนบัส">${nodes}</ul>
    <svg viewBox="0 0 400 58" role="img" aria-label="${config.label}">
      <path class="story-bus-high" d="M10 25H390"/>
      <path class="story-bus-low" d="M10 49H390"/>
      <path class="story-bus-end" d="M10 25v4l-4 4 8 4-8 4 4 4v4m380-24v4l-4 4 8 4-8 4 4 4v4"/>
      ${stubs}${packets}
    </svg>
    <div class="story-bus-legend">
      <span class="story-bus-high-key">${config.wires[0]}</span>
      <span class="story-bus-low-key">${config.wires[1]}</span>
      <span>120 Ω ที่ปลายบัสทั้งสองด้าน</span>
    </div>
    <figcaption>
      <strong>${config.traffic}</strong>
      <small>${config.detail}</small>
    </figcaption>`;
}
