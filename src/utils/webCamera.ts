/**
 * Web-only live camera capture. expo-image-picker's web camera is just an
 * `<input capture>`, which desktop browsers treat as a plain file picker, so we
 * open a real webcam preview with getUserMedia instead.
 *
 * Resolves with a JPEG data URL cropped to a 3:4 portrait, or null when the
 * user closes the overlay. Rejects when the camera can't be accessed.
 */
export function isWebCameraAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof document !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export function captureWebPhoto(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        const overlay = document.createElement('div');
        overlay.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;';

        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.srcObject = stream;
        video.style.cssText = 'flex:1;min-height:0;width:100%;object-fit:contain;transform:scaleX(-1);';

        const bar = document.createElement('div');
        bar.style.cssText =
          'width:100%;display:flex;align-items:center;justify-content:center;gap:48px;padding:20px 0 calc(20px + env(safe-area-inset-bottom));';

        const close = document.createElement('button');
        close.type = 'button';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '✕';
        close.style.cssText =
          'width:48px;height:48px;border-radius:24px;border:0;background:rgba(255,255,255,0.2);color:#fff;font-size:20px;cursor:pointer;';

        const shutter = document.createElement('button');
        shutter.type = 'button';
        shutter.setAttribute('aria-label', 'Capture');
        shutter.style.cssText =
          'width:72px;height:72px;border-radius:36px;border:4px solid #fff;background:rgba(255,255,255,0.35);cursor:pointer;';

        bar.append(close, shutter);
        overlay.append(video, bar);
        document.body.appendChild(overlay);

        const finish = (value: string | null) => {
          stream.getTracks().forEach((track) => track.stop());
          overlay.remove();
          resolve(value);
        };

        close.onclick = () => finish(null);
        shutter.onclick = () => {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh) return;
          // Center-crop to 3:4 portrait.
          let cw = vw;
          let ch = Math.round((vw * 4) / 3);
          if (ch > vh) {
            ch = vh;
            cw = Math.round((vh * 3) / 4);
          }
          const canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d');
          if (!ctx) return finish(null);
          ctx.drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, cw, ch);
          finish(canvas.toDataURL('image/jpeg', 0.85));
        };
      })
      .catch(reject);
  });
}
