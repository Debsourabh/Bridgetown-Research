"use client";

// Loaded with next/dynamic (ssr: false) so three.js never lands in the main bundle.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "@/lib/gsap";
import { AGREED_MIN, BASE_QUESTIONS, BASE_TOTAL } from "@/lib/guide";

const CUT = new Set(["q2", "q7", "q12"]);

/**
 * onReveal fires when the loader starts dissolving (the app builds in underneath,
 * a crossfade); onDone fires once it is fully gone and can be unmounted.
 */
export default function IntroScene({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const [copy, setCopy] = useState({ a: "Reading your guide", b: `12 questions · ~${BASE_TOTAL} min` });
  const done = useRef(false);

  useEffect(() => {
    const el = host.current!;
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onReveal();
      const tl = gsap.timeline({ onComplete: onDone });
      tl.to(el.querySelector(".intro__copy"), { opacity: 0, y: -10, duration: 0.35, ease: "power2.in" }, 0)
        .to(el.querySelector("canvas"), { scale: 1.06, duration: 0.8, ease: "power2.inOut" }, 0)
        .to(el, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 0.1);
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onReveal(); // no WebGL: skip straight to the app
      onDone();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    // Neutral tone mapping keeps the brand lime/red true (ACES/AgX wash them out)
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    // Soft studio reflections: what makes the clear-coat read as a material
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    const FOV = 32;
    const camera = new THREE.PerspectiveCamera(FOV, el.clientWidth / el.clientHeight, 0.1, 200);
    // distance at which the finished row (+ margin) fits the viewport width
    const fitDist = (aspect: number) => {
      const w = (BASE_TOTAL * 0.34 + 0.06 * 11) * 1.3;
      const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      return Math.max(9, w / (2 * t * aspect));
    };
    let dist = fitDist(camera.aspect);
    camera.position.set(0, 3.2, dist * 1.25);
    camera.lookAt(0, 0.6, 0);

    // Studio lighting: soft fill, warm key with soft shadows, cool rim from behind
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe7e5e4, 0.9));
    const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
    key.position.set(3.5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 6, bottom: -6, near: 1, far: 30 });
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdbeafe, 1.4);
    rim.position.set(-6, 3, -8);
    scene.add(rim);

    // Invisible floor that only catches the soft contact shadows
    const floorGeo = new THREE.PlaneGeometry(60, 30);
    const floorMat = new THREE.ShadowMaterial({ color: 0x1c1917, opacity: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.42;
    floor.receiveShadow = true;
    scene.add(floor);

    // One block per question, length = estimated minutes (same idea as the Fit preview).
    const unit = 0.34;
    const gap = 0.06;
    const rowWidth = BASE_TOTAL * unit + gap * (BASE_QUESTIONS.length - 1);
    const lime = new THREE.Color("#d9f99d");
    const limeDeep = new THREE.Color("#bef264");
    const red = new THREE.Color("#fca5a5");
    const geos: THREE.BufferGeometry[] = [floorGeo];
    const mats: THREE.Material[] = [floorMat];
    const group = new THREE.Group();
    scene.add(group);

    let x = -rowWidth / 2;
    const blocks = BASE_QUESTIONS.map((q, i) => {
      const w = q.minutes * unit;
      const geo = new RoundedBoxGeometry(w, 0.55, 0.55, 5, 0.13);
      // A soft-touch lacquer: satin base, thin clear-coat, a whisper of sheen on
      // the edges, and a slight tint shift per block so the row isn't flat.
      const tint = lime.clone().lerp(new THREE.Color("#ecfccb"), (i % 3) * 0.18);
      const mat = new THREE.MeshPhysicalMaterial({
        color: tint,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
        sheen: 0.5,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color("#f7fee7"),
        specularIntensity: 0.6,
      });
      geos.push(geo);
      mats.push(mat);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      const target = { x: x + w / 2, y: 0, z: 0 };
      x += w + gap;
      // start scattered on a loose ring
      const a = (i / BASE_QUESTIONS.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 4.2, 1.2 + Math.sin(a * 2) * 1.4, Math.sin(a) * 3);
      m.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      m.scale.setScalar(0.001);
      group.add(m);
      return { m, mat, q, target };
    });

    // 25-min marker: a thin dark bar that drops in at the agreed length
    const markerX = -rowWidth / 2 + AGREED_MIN * unit + gap * 7.5;
    const markerGeo = new THREE.BoxGeometry(0.035, 1.6, 0.035);
    const markerMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.3, clearcoat: 1, transparent: true, opacity: 0 });
    geos.push(markerGeo);
    mats.push(markerMat);
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(markerX, 0.2, 0.4);
    scene.add(marker);

    let raf = 0;
    const tick = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(blocks.map((b) => b.m.scale), { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(1.6)", stagger: 0.035 })
      .to(group.rotation, { y: Math.PI * 0.35, duration: 1.1, ease: "sine.inOut" }, 0)
      .add(() => setCopy({ a: "Checking it against your brief", b: "and the 25-min call" }), 0.75)
      .addLabel("line", 0.85)
      .to(group.rotation, { y: 0, duration: 0.8, ease: "power3.inOut" }, "line")
      .to(blocks.map((b) => b.m.position), {
        x: (i: number) => blocks[i].target.x,
        y: 0,
        z: 0,
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.025,
      }, "line")
      .to(blocks.map((b) => b.m.rotation), { x: 0, y: 0, z: 0, duration: 0.8, ease: "power3.inOut", stagger: 0.025 }, "line")
      .to(camera.position, { y: 1.4, z: dist, duration: 1, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0) }, "line")
      .to(markerMat, { opacity: 1, duration: 0.3 }, "line+=0.7")
      .from(marker.position, { y: 2.2, duration: 0.45, ease: "bounce.out" }, "line+=0.7")
      .add(() => {
        setCopy({ a: "7 suggestions ready", b: "Nothing changes until you accept" });
        blocks.forEach((b) => {
          const to = CUT.has(b.q.id) ? red : limeDeep;
          gsap.to(b.mat.color, { r: to.r, g: to.g, b: to.b, duration: 0.35 });
          if (CUT.has(b.q.id)) gsap.to(b.m.position, { y: 0.18, yoyo: true, repeat: 1, duration: 0.18, ease: "power1.out" });
        });
      }, "line+=1.05")
      .to({}, { duration: 0.75 });

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      dist = fitDist(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);
    const skip = () => {
      tl.kill();
      finish();
    };
    el.addEventListener("click", skip);
    window.addEventListener("keydown", skip);

    return () => {
      tl.kill();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", skip);
      el.removeEventListener("click", skip);
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onDone, onReveal]);

  useEffect(() => {
    gsap.fromTo([line.current, sub.current], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" });
  }, [copy]);

  return (
    <div className="intro" ref={host} role="status" aria-live="polite">
      <div className="intro__copy">
        <p className="intro__line" ref={line}>{copy.a}</p>
        <p className="intro__sub" ref={sub}>{copy.b}</p>
      </div>
      <span className="intro__skip">Click or press any key to skip</span>
    </div>
  );
}
