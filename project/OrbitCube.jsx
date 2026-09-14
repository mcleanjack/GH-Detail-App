/* OrbitCube — navigation gizmo for the detail viewer.
   Props:
     getQuaternion : () => THREE.Quaternion | [x,y,z,w]   (polled per frame)
     quaternion    : [x,y,z,w]                            (alternative, prop-driven)
     onSelectView  : (name) => void   name: front|back|left|right|top|bottom|iso
     size          : px (default 52)
   All look-and-feel lives in STYLE below — tune freely. */


const STYLE = {
  // ---- materials -------------------------------------------------------
  faceColor: "#4a4a48",        // graphite plate, lit from upper-left
  faceColorHover: "#4e4e4c",   // hovered face
  edgeColor: "#5c5b59",        // faint edge definition
  edgeOpacity: 0.35,
  edgeThickness: 0.028,        // in cube units — matches the toolbar cube icon stroke
  roughness: 0.55,
  metalness: 0.06,
  // ---- lighting --------------------------------------------------------
  ambient: 0.16,
  keyIntensity: 3.2,           // soft top-down directional
  keyPosition: [-0.9, 1.5, 0.9],
  keyColor: "#f2efe9",         // near-neutral soft light
  rimIntensity: 0.16,
  rimPosition: [-1.1, 0.35, -0.9],
  rimColor: "#9aa09b",
  // ---- contact shadow / glow ------------------------------------------
  glow: "none",
  // ---- arrows ----------------------------------------------------------
  arrowColor: "#454b48",
  arrowOpacity: 0.9,
  // ---- misc ------------------------------------------------------------
  cubeScale: 0.62,             // fraction of the canvas the cube occupies
  hoverLift: 1.035,
};

const FACES = [
  { name: "right",  normal: [1, 0, 0] },
  { name: "left",   normal: [-1, 0, 0] },
  { name: "top",    normal: [0, 1, 0] },
  { name: "bottom", normal: [0, -1, 0] },
  { name: "front",  normal: [0, 0, 1] },
  { name: "back",   normal: [0, 0, -1] },
];

function OrbitCube({ three, getQuaternion, quaternion, onSelectView, onOrbit, size = 52, touch: touchProp }) {
  const THREE = three || window.THREE;
  const hostRef = React.useRef(null);
  const stateRef = React.useRef({});
  const [hover, setHover] = React.useState(null);
  const hoverRef = React.useRef(null);
  hoverRef.current = hover;
  const cbRef = React.useRef(onSelectView);
  const orbitRef = React.useRef(onOrbit);
  orbitRef.current = onOrbit;
  cbRef.current = onSelectView;
  const qRef = React.useRef(getQuaternion);
  qRef.current = getQuaternion;
  const propQ = React.useRef(quaternion);
  propQ.current = quaternion;

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || !THREE) return;
    const S = stateRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(4);
    renderer.setSize(size, size);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: size + "px", height: size + "px", display: "block", cursor: "pointer" });

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0, 5);

    // lighting ---------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, STYLE.ambient));
    const key = new THREE.DirectionalLight(new THREE.Color(STYLE.keyColor), STYLE.keyIntensity);
    key.position.set(...STYLE.keyPosition);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(STYLE.rimColor), STYLE.rimIntensity);
    rim.position.set(...STYLE.rimPosition);
    scene.add(rim);

    // cube -------------------------------------------------------------
    const pivot = new THREE.Group();
    scene.add(pivot);
    const s = STYLE.cubeScale * 1.55;
    // diagonal light→dark ramp painted onto every face (as in the reference plate)
    const ramp = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const g = cv.getContext("2d").createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.45, "#c9c9c7");
      g.addColorStop(1, "#6e6e6c");
      const cx = cv.getContext("2d");
      cx.fillStyle = g;
      cx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(cv);
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();
    const mats = FACES.map(() => new THREE.MeshStandardMaterial({
      color: new THREE.Color(STYLE.faceColor),
      map: ramp,
      roughness: STYLE.roughness,
      metalness: STYLE.metalness,
    }));
    // BoxGeometry material order: +x -x +y -y +z -z — matches FACES
    const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s, 4, 4, 4), mats);
    pivot.add(cube);

    const edgeGeo = new THREE.EdgesGeometry(cube.geometry, 1);
    const edges = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: new THREE.Color(STYLE.edgeColor), transparent: true, opacity: STYLE.edgeOpacity })
    );
    pivot.add(edges);

    // picking ----------------------------------------------------------
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const el = renderer.domElement;

    const pick = (ev) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(cube, false)[0];
      if (!hit || !hit.face) return null;
      // The box is subdivided (4x4 per side), so faceIndex counts many
      // triangles per side — the material index is the only reliable mapping
      // back to a named face, and it matches FACES order by construction.
      const mi = hit.face.materialIndex;
      const f = FACES[mi];
      return f ? f.name : null;
    };

    // Drag tracking is started on ANY press inside the gizmo and the >5px
    // threshold decides tap-vs-drag on release, so a press that begins just off
    // a face still orbits. Move/up are bound on the window for the duration of
    // the gesture: pointer capture is unreliable across browsers and the finger
    // routinely leaves the small canvas mid-drag.
    let drag = null;
    const onDragMove = (ev) => {
      if (!drag) return;
      if (ev.cancelable) ev.preventDefault();
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      drag.x = ev.clientX; drag.y = ev.clientY;
      drag.moved += Math.hypot(dx, dy);
      if (drag.moved > 5) setHover(null);
      if (orbitRef.current) orbitRef.current(dx, dy);
    };
    const endDrag = () => {
      window.removeEventListener("pointermove", onDragMove, true);
      window.removeEventListener("pointerup", onDragUp, true);
      window.removeEventListener("pointercancel", onDragCancel, true);
    };
    const onDragUp = (ev) => {
      const d = drag;
      drag = null;
      endDrag();
      if (!d || d.moved > 5) return;
      const n = pick(ev);
      if (n && cbRef.current) cbRef.current(n);
    };
    const onDragCancel = () => { drag = null; endDrag(); };
    const onHoverMove = (ev) => {
      if (drag) return;
      const n = pick(ev);
      if (n !== hoverRef.current) setHover(n);
    };
    const onLeave = () => { if (!drag) setHover(null); };
    const onDown = (ev) => {
      ev.stopPropagation();
      drag = { x: ev.clientX, y: ev.clientY, moved: 0 };
      window.addEventListener("pointermove", onDragMove, true);
      window.addEventListener("pointerup", onDragUp, true);
      window.addEventListener("pointercancel", onDragCancel, true);
    };
    el.addEventListener("pointermove", onHoverMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);

    // loop -------------------------------------------------------------
    const q = new THREE.Quaternion();
    const inv = new THREE.Quaternion();
    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const src = (qRef.current && qRef.current()) || propQ.current;
      if (src) {
        if (src.isQuaternion) q.copy(src);
        else q.set(src[0], src[1], src[2], src[3]);
        // the gizmo shows the model's orientation as seen from the camera
        inv.copy(q).invert();
        pivot.quaternion.copy(inv);
      }
      const h = hoverRef.current;
      const target = h ? STYLE.hoverLift : 1;
      pivot.scale.lerp(new THREE.Vector3(target, target, target), 0.2);
      FACES.forEach((f, i) => {
        mats[i].color.lerp(new THREE.Color(f.name === h ? STYLE.faceColorHover : STYLE.faceColor), 0.25);
      });
      renderer.render(scene, camera);
    };
    loop();

    S.dispose = () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onHoverMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      endDrag();
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
    el.style.touchAction = "none";
    return () => S.dispose();
  }, [size, THREE]);

  // Touch has no hover to reveal the arrows with, so on a touch device they
  // stay visible and grow to a proper finger target.
  // The viewer's own device mode decides this: an iPad mode shown on a desktop
  // still needs finger targets, and PC mode on a touchscreen laptop does not.
  const touch = touchProp !== undefined
    ? !!touchProp
    : (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(hover: none)").matches : false);
  const hitSz = touch ? 44 : 24;

  const arrow = (rot, name, key) => React.createElement(
    "button",
    {
      key,
      title: name + " view",
      onClick: () => onSelectView && onSelectView(name),
      style: {
        position: "absolute", width: hitSz, height: hitSz, padding: 0, border: 0, background: "transparent",
        cursor: "pointer", display: "grid", placeItems: "center",
        color: STYLE.arrowColor,
        opacity: touch ? Math.max(0.72, STYLE.arrowOpacity) : STYLE.arrowOpacity,
        transition: "opacity .18s ease",
        transform: "translate(-50%,-50%)",
        ...rot,
      },
    },
    React.createElement("svg", { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },
      React.createElement("path", { d: "M12 19V6M7 11l5-5 5 5" })
    )
  );

  return React.createElement(
    "div",
    {
      onPointerEnter: () => setHover(h => h || "near"),
      onPointerLeave: () => { if (!touch) setHover(null); },
      onPointerDown: () => setHover(h => h || "near"),
      style: { position: "relative", width: size + (touch ? 46 : 22), height: size + (touch ? 46 : 22), display: "grid", placeItems: "center", userSelect: "none", touchAction: "none" },
    },
    React.createElement("div", { style: { position: "absolute", inset: 0, background: STYLE.glow, pointerEvents: "none" } }),
    arrow({ left: "50%", top: touch ? 14 : 6, transform: "translate(-50%,-50%)" }, "top", "a1"),
    arrow({ left: "50%", top: "auto", bottom: touch ? 14 : 6, transform: "translate(-50%,50%) rotate(180deg)" }, "front", "a2"),
    arrow({ left: touch ? 14 : 6, top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }, "left", "a3"),
    arrow({ left: "auto", right: touch ? 14 : 6, top: "50%", transform: "translate(50%,-50%) rotate(90deg)" }, "right", "a4"),
    React.createElement("div", { ref: hostRef, style: { width: size, height: size } })
  );
}

module.exports = { OrbitCube };
