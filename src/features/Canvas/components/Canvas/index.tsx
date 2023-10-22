//import { useRef, useEffect } from 'react'

import {
  Button,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  VStack,
} from "@chakra-ui/react";
import useCanvas from "../../hooks/useCanvas";

interface CanvasProps {
  draw: (ctx: any, frameCount: number) => void;
  isExportable?: boolean;
  [key: string]: any;
}

const Canvas = (props: CanvasProps) => {
  const { draw, ...rest } = props;

  const canvasRef = useCanvas(draw);

  const handleCanvasClick = (event: any) => {
    const currentCoord = { x: event.clientX - 88, y: event.clientY - 124 };
    if (props.setCoordinates !== undefined) props.setCoordinates(currentCoord);
  };

  const exportCanvas = () => {
    let timage = canvasRef.current
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    var link = document.createElement("a");
    link.download = "my-image.png";
    link.href = timage;
    link.click();
  };

  return (
    <VStack alignItems={"flex-start"}>
      <canvas
        ref={canvasRef}
        {...rest}
        style={{ border: "1px solid black" }}
        onClick={handleCanvasClick}
      />
      {props.isExportable && (
        <Button
          colorScheme="orange"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            exportCanvas();
          }}
          zIndex={10000000}
        >
          Export canvas image
        </Button>
      )}
    </VStack>
  );
};

export default Canvas;
