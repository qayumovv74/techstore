"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 3D-сцена для главной и страниц входа: смартфон из «фиолетового титана» с экраном в цветах
 * сайта и парящие вокруг стеклянные шары, кольцо и капсулы. Three.js грузится отдельным
 * чанком только здесь. Вне экрана и в фоновой вкладке рендер стоит, курсор слегка
 * поворачивает сцену, при prefers-reduced-motion — один статичный кадр.
 */
export function Hero3D({ className, variant = "hero" }: { className?: string; variant?: "hero" | "auth" }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // нет WebGL — остаётся мягкое свечение-заглушка
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, variant === "auth" ? 11 : 10);

      scene.add(new THREE.AmbientLight(0x8a78c8, 0.35));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 4, 6);
      scene.add(key);
      const rim = new THREE.PointLight(0x916bbf, 40, 20);
      rim.position.set(-4, -1, 3);
      scene.add(rim);

      // ─── смартфон ───
      const phone = new THREE.Group();
      const W = 1.7;
      const H = 3.5;
      const D = 0.2;
      const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x2c2560, metalness: 0.85, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
      const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, 0.24), bodyMat);
      phone.add(body);

      // экран: скруглённый прямоугольник с текстурой из canvas
      const sw = W - 0.14;
      const sh = H - 0.14;
      const r = 0.2;
      const shape = new THREE.Shape();
      shape.moveTo(-sw / 2 + r, -sh / 2);
      shape.lineTo(sw / 2 - r, -sh / 2);
      shape.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + r);
      shape.lineTo(sw / 2, sh / 2 - r);
      shape.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - r, sh / 2);
      shape.lineTo(-sw / 2 + r, sh / 2);
      shape.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - r);
      shape.lineTo(-sw / 2, -sh / 2 + r);
      shape.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + r, -sh / 2);
      const screenGeo = new THREE.ShapeGeometry(shape, 8);
      // UV под размер экрана, чтобы текстура легла целиком
      const uv = screenGeo.attributes.uv;
      const pos = screenGeo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / sw + 0.5, pos.getY(i) / sh + 0.5);

      const tex = new THREE.CanvasTexture(paintScreen());
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      screen.position.z = D / 2 + 0.002;
      phone.add(screen);
      // глянец поверх экрана
      const gloss = new THREE.Mesh(
        screenGeo,
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0, clearcoat: 1 }),
      );
      gloss.position.z = D / 2 + 0.004;
      phone.add(gloss);

      // логотип на экране догружается картинкой
      const mark = new Image();
      mark.src = "/brand/mark-silver.png";
      mark.onload = () => {
        paintScreen(tex.image as HTMLCanvasElement, mark);
        tex.needsUpdate = true;
        renderOnce();
      };

      // камера на задней стороне
      const island = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.7, 0.06, 4, 0.14), bodyMat);
      island.position.set(-0.42, 1.27, -D / 2 - 0.02);
      phone.add(island);
      const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x07061a, metalness: 0.2, roughness: 0.05, clearcoat: 1 });
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xb9a8e6, metalness: 1, roughness: 0.25 });
      for (const [lx, ly] of [[-0.58, 1.43], [-0.58, 1.11], [-0.26, 1.27]] as const) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(lx, ly, -D / 2 - 0.07);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.052, 32), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.copy(ring.position);
        lens.position.z -= 0.004;
        phone.add(ring, lens);
      }
      scene.add(phone);

      // ─── парящие объекты ───
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xc4b5e8, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.8, ior: 1.4, clearcoat: 1, attenuationColor: new THREE.Color(0x916bbf), attenuationDistance: 1.5,
      });
      const violetMetal = new THREE.MeshStandardMaterial({ color: 0x916bbf, metalness: 0.9, roughness: 0.22 });
      const pearl = new THREE.MeshPhysicalMaterial({ color: 0xf3eeff, metalness: 0.1, roughness: 0.3, clearcoat: 1, sheen: 1, sheenColor: new THREE.Color(0xc4b5e8) });

      type Floater = { mesh: import("three").Mesh; base: import("three").Vector3; speed: number; phase: number; spin: number };
      const floaters: Floater[] = [];
      const addFloater = (mesh: import("three").Mesh, x: number, y: number, z: number, speed: number, spin: number) => {
        mesh.position.set(x, y, z);
        scene.add(mesh);
        floaters.push({ mesh, base: new THREE.Vector3(x, y, z), speed, phase: Math.random() * Math.PI * 2, spin });
      };
      addFloater(new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), glass), 1.9, 1.3, 0.6, 0.7, 0.3);
      addFloater(new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 32), glass), -1.8, -1.5, 1, 0.9, 0.4);
      addFloater(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 24, 64), violetMetal), -2, 1.2, -0.4, 0.6, 0.8);
      addFloater(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.32, 8, 16), pearl), 1.7, -1.4, 0.8, 0.8, 1.1);
      addFloater(new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.32, 8, 16), pearl), 2.2, -0.9, 0.2, 0.75, 1.3);

      // ─── размеры, курсор, видимость ───
      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // на узком холсте отодвигаем камеру, чтобы сцена не обрезалась
        camera.position.z = (variant === "auth" ? 11 : 10) * Math.max(1, 0.85 / camera.aspect);
        camera.updateProjectionMatrix();
        renderOnce();
      };

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e: PointerEvent) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      let t = 0;
      let raf = 0;
      let onScreen = true;

      function frame(dt: number) {
        t += dt;
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
        phone.rotation.y = -0.45 + Math.sin(t * 0.35) * 0.55 + pointer.x * 0.35;
        phone.rotation.x = 0.06 + Math.sin(t * 0.27) * 0.06 + pointer.y * 0.18;
        phone.rotation.z = Math.sin(t * 0.2) * 0.04;
        phone.position.y = Math.sin(t * 0.8) * 0.08;
        for (const f of floaters) {
          f.mesh.position.set(
            f.base.x + Math.sin(t * f.speed * 0.6 + f.phase) * 0.12,
            f.base.y + Math.sin(t * f.speed + f.phase) * 0.18,
            f.base.z + Math.cos(t * f.speed * 0.5 + f.phase) * 0.1,
          );
          f.mesh.rotation.x += dt * f.spin * 0.6;
          f.mesh.rotation.y += dt * f.spin;
        }
        renderer.render(scene, camera);
      }
      function renderOnce() {
        frame(0);
      }
      const tick = () => {
        frame(Math.min(clock.getDelta(), 0.05));
        raf = requestAnimationFrame(tick);
      };
      const start = () => {
        if (raf || reduced || !onScreen || document.hidden) return;
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };

      const ro = new ResizeObserver(resize);
      ro.observe(host);
      const io = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen) start();
        else stop();
      });
      io.observe(host);
      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pointermove", onPointer, { passive: true });

      resize();
      start();
      setReady(true);

      cleanup = () => {
        stop();
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pointermove", onPointer);
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          m.geometry?.dispose();
          const mat = m.material as import("three").Material | import("three").Material[] | undefined;
          (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
        });
        tex.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [variant]);

  return (
    <div className={cn("relative", className)}>
      {/* свечение под сценой — видно сразу и остаётся, если WebGL недоступен */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(145_107_191/0.45),transparent_65%)] blur-2xl transition-opacity duration-700",
          ready ? "opacity-70" : "opacity-100",
        )}
      />
      <div ref={hostRef} className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

/** Рисует «обои» экрана телефона: размытые пятна палитры, логотип и док с иконками */
function paintScreen(canvas = document.createElement("canvas"), mark?: HTMLImageElement) {
  canvas.width = 512;
  canvas.height = 1056;
  const g = canvas.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#04052e");
  bg.addColorStop(0.55, "#1a1250");
  bg.addColorStop(1, "#02010a");
  g.fillStyle = bg;
  g.fillRect(0, 0, canvas.width, canvas.height);

  const blob = (x: number, y: number, r: number, color: string) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "transparent");
    g.fillStyle = rg;
    g.fillRect(0, 0, canvas.width, canvas.height);
  };
  blob(120, 260, 360, "rgba(145,107,191,0.85)");
  blob(420, 620, 320, "rgba(61,44,141,0.9)");
  blob(260, 900, 260, "rgba(196,181,232,0.35)");

  // строка состояния
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = "600 30px 'JetBrains Mono Variable', monospace";
  g.fillText("21:00", 44, 70);
  g.fillRect(404, 50, 56, 22);

  if (mark) {
    const w = 300;
    const h = (mark.height / mark.width) * w;
    g.globalAlpha = 0.95;
    g.drawImage(mark, (canvas.width - w) / 2, 360, w, h);
    g.globalAlpha = 1;
  }
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.font = "700 44px 'JetBrains Mono Variable', monospace";
  g.textAlign = "center";
  g.fillText("techstore", canvas.width / 2, 620);
  g.textAlign = "start";

  // док
  g.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(g, 36, 900, 440, 110, 40);
  const colors = ["#916bbf", "#c4b5e8", "#3d2c8d", "#f3eeff"];
  colors.forEach((c, i) => {
    g.fillStyle = c;
    roundRect(g, 64 + i * 104, 918, 76, 76, 22);
  });
  return canvas;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
