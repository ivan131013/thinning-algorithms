import {
  VStack,
  Slider,
  SliderMark,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Flex,
  Button,
  Heading,
  Box,
  Text,
  Switch,
} from "@chakra-ui/react";
import { FunctionComponent, useEffect, useState } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Canvas from "../Canvas/components/Canvas";
import { Crop } from "react-image-crop";
import {
  drawBlueSquaresOverLineBreaks,
  drawSquaresOnImageData,
  markConvergingDivergingLines,
  setOpacityToMaximum,
} from "../../services/functions";

interface HilditchThinningProps {
  originalBase64Image: string;
  crop?: Crop;
}

const labelStyles = {
  mt: "2",
  ml: "-2.5",
  fontSize: "sm",
};

const HilditchThinning: FunctionComponent<HilditchThinningProps> = ({
  crop,
  originalBase64Image,
}) => {
  const [hilditchThreshhold, setHilditchThreshhold] = useState<number>(128);
  const [numberOfTearPoints, setNumberOfTearPoints] = useState<number>();
  const [resultMode, setResultMode] = useState<boolean>(false);
  const [numberOfSpecialPoints, setNumberOfSpecialPoints] = useState<number>();

  const [draw2, setDraw2] = useState<any>();
  const [originalDraw, setOriginalDraw] = useState<any>();

  useEffect(() => {
    if (originalBase64Image === "" || !crop) {
      return;
    }

    const initialImage = new Image();

    initialImage.src = originalBase64Image; // Set source path

    const loadEventCallback = (event: Event) => {
      const drawFunction =
        () => (ctx: CanvasRenderingContext2D, frameCount: number) => {
          const pixelRatio = 1;

          //ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            initialImage,
            (crop.x / 100) * initialImage.naturalWidth, //sx
            (crop.y / 100) * initialImage.naturalHeight, //sy
            (crop.width / 100) * initialImage.naturalWidth, //sWidth
            (crop.height / 100) * initialImage.naturalHeight, //sHeight
            0, //dx
            0, //dy
            600, //dWidth
            500 //dHeight
          );
        };

      setDraw2(drawFunction);
      setOriginalDraw(drawFunction);
    };

    initialImage.addEventListener("load", loadEventCallback, false);

    return () => {
      initialImage.removeEventListener("load", loadEventCallback);
    };
  }, [crop, originalBase64Image]);

  function hilditchThinning(
    imageData: ImageData,
    threshold: number = 128
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(structuredClone(imageData.data));

    let hasChanged = true;
    let tempData: Uint8ClampedArray;

    function isPixelBlack(x: number, y: number): boolean {
      const index = (y * width + x) * 4;
      const grayscaleValue =
        (data[index] + data[index + 1] + data[index + 2]) / 3;
      return grayscaleValue < threshold;
    }

    while (hasChanged) {
      hasChanged = false;
      tempData = new Uint8ClampedArray(data);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          if (!isPixelBlack(x, y)) continue;

          const p2 = isPixelBlack(x, y - 1) ? 1 : 0;
          const p3 = isPixelBlack(x + 1, y - 1) ? 1 : 0;
          const p4 = isPixelBlack(x + 1, y) ? 1 : 0;
          const p5 = isPixelBlack(x + 1, y + 1) ? 1 : 0;
          const p6 = isPixelBlack(x, y + 1) ? 1 : 0;
          const p7 = isPixelBlack(x - 1, y + 1) ? 1 : 0;
          const p8 = isPixelBlack(x - 1, y) ? 1 : 0;
          const p9 = isPixelBlack(x - 1, y - 1) ? 1 : 0;

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;

          const A =
            (p2 === 0 && p3 === 1 ? 1 : 0) +
            (p3 === 0 && p4 === 1 ? 1 : 0) +
            (p4 === 0 && p5 === 1 ? 1 : 0) +
            (p5 === 0 && p6 === 1 ? 1 : 0) +
            (p6 === 0 && p7 === 1 ? 1 : 0) +
            (p7 === 0 && p8 === 1 ? 1 : 0) +
            (p8 === 0 && p9 === 1 ? 1 : 0) +
            (p9 === 0 && p2 === 1 ? 1 : 0);

          if (A === 1) {
            const C = p2 * p4 * p6;
            const C2 = p2 * p4 * p8;
            if (C === 0 && C2===0) {
              tempData[(y * width + x) * 4] = 255;
              tempData[(y * width + x) * 4 + 1] = 255;
              tempData[(y * width + x) * 4 + 2] = 255;
              hasChanged = true;
            }
          }
        }
      }

      data.set(tempData);
    }

    for (let i = 0; i < data.length; i++) {
      imageData.data[i] = data[i];
    }

    return imageData;
  }

  const onHilditchThinClick = () => {
    setDraw2(() => (ctx2: CanvasRenderingContext2D, frameCount: number) => {
      let imageData = ctx2.getImageData(0, 0, 600, 500);
      let processedImage = setOpacityToMaximum(imageData);

      let thinImage = hilditchThinning(processedImage, hilditchThreshhold);

      let { imageData: circledThinImage } = drawBlueSquaresOverLineBreaks(
        markConvergingDivergingLines(thinImage, 10).imageData
      );

      ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
      ctx2.putImageData(circledThinImage, 0, 0);
    });

    setOriginalDraw(
      () => (ctx: CanvasRenderingContext2D, frameCount: number) => {
        let imageData = ctx.getImageData(0, 0, 600, 500);
        let processedImage = setOpacityToMaximum(imageData);

        let thinImage = hilditchThinning(
          structuredClone(processedImage),
          hilditchThreshhold
        );
        let { markersCoordinates } = drawBlueSquaresOverLineBreaks(
          structuredClone(thinImage)
        );

        let { markersCoordinates: divergingMarkersCoordinates } =
          markConvergingDivergingLines(thinImage, 10);
        setNumberOfSpecialPoints(divergingMarkersCoordinates.length);
        setNumberOfTearPoints(markersCoordinates.length);

        let circledImage = drawSquaresOnImageData(
          drawSquaresOnImageData(imageData, markersCoordinates),
          divergingMarkersCoordinates,
          "orange"
        );

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.putImageData(circledImage, 0, 0);
      }
    );
  };

  const resetCanvas = (canvasDrawFunction: any) => {
    const initialImage = new Image();

    initialImage.src = originalBase64Image; // Set source path

    const loadEventCallback = (event: Event) => {
      const drawFunction =
        () => (ctx: CanvasRenderingContext2D, frameCount: number) => {
          const pixelRatio = 1;

          //ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            initialImage,
            ((crop?.x ?? 0) / 100) * initialImage.naturalWidth, //sx
            ((crop?.y ?? 0) / 100) * initialImage.naturalHeight, //sy
            ((crop?.width ?? 0) / 100) * initialImage.naturalWidth, //sWidth
            ((crop?.height ?? 0) / 100) * initialImage.naturalHeight, //sHeight
            0, //dx
            0, //dy
            600, //dWidth
            500 //dHeight
          );
        };

      canvasDrawFunction(drawFunction);

      initialImage.removeEventListener("load", loadEventCallback);
    };

    initialImage.addEventListener("load", loadEventCallback, false);
  };

  return (
    <VStack mt={"2rem"} alignItems={"stretch"}>
      <Box w={"100%"}>
        <Slider
          aria-label="slider-ex-6"
          onChange={(val) => setHilditchThreshhold(val)}
          max={255}
          min={0}
        >
          <SliderMark value={0} {...labelStyles}>
            0
          </SliderMark>
          <SliderMark value={128} {...labelStyles}>
            128
          </SliderMark>
          <SliderMark value={255} {...labelStyles}>
            255
          </SliderMark>
          <SliderMark
            value={hilditchThreshhold}
            textAlign="center"
            bg="blue.500"
            color="white"
            mt="-10"
            ml="-5"
            w="12"
          >
            {hilditchThreshhold}
          </SliderMark>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
        <Flex mt={"2rem"} alignItems={"center"} gap={"1rem"}>
          <Button
            colorScheme={"blue"}
            onClick={() => {
              onHilditchThinClick();
            }}
          >
            Perform Hilditch thinning
          </Button>

          <Text>
            Selected threshold: <b>{hilditchThreshhold}</b>
          </Text>

          <Button
            variant={"ghost"}
            marginLeft={"auto"}
            opacity={"0.6"}
            fontWeight={"500"}
            onClick={() => {
              resetCanvas(setDraw2);
              resetCanvas(setOriginalDraw);
            }}
          >
            Reset
          </Button>
        </Flex>
      </Box>
      <Flex alignItems={"center"} justifyContent={"space-between"}>
        <Heading fontSize={"1.5rem"} fontWeight={"500"}>
          Result:
        </Heading>
        <Flex alignItems={"center"}>
          <Text>Side by side comparison:</Text>
          <Switch
            id="email-alerts"
            isChecked={resultMode}
            onChange={(e) => {
              setResultMode(e.target.checked);
            }}
          />
        </Flex>
      </Flex>

      <Box display={resultMode ? "block" : "none"}>
        <ReactCompareSlider
          itemOne={<Canvas draw={draw2} width={600} height={500} />}
          itemTwo={<Canvas draw={originalDraw} width={600} height={500} />}
        />
      </Box>

      <Box display={resultMode ? "none" : "block"}>
        <TransformWrapper>
          <TransformComponent>
            <Canvas draw={draw2} width={600} height={500} isExportable={true} />
          </TransformComponent>
        </TransformWrapper>
      </Box>
      <Text>
        Number of tear points: <b>{numberOfTearPoints}</b>
      </Text>

      <Text>
        Number of special points: <b>{numberOfSpecialPoints}</b>
      </Text>
    </VStack>
  );
};

export default HilditchThinning;
