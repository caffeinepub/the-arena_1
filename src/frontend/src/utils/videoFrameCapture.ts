/**
 * Captures the current frame of a video element as a PNG Blob.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!video || video.readyState < 2) {
      reject(new Error("Video is not ready"));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to capture frame"));
        }
      },
      "image/png",
      0.92,
    );
  });
}
