import { useRef, useEffect } from "react";

const useCanvas = (draw: any) => {
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frameCount = 0;
    let animationFrameId: any;

    //const render = () => {
    frameCount++;

    if (draw) {
      draw(ctx, frameCount);
    }
    //animationFrameId = window.requestAnimationFrame(render)
    //}
    //render()

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return canvasRef;
};

export default useCanvas;
