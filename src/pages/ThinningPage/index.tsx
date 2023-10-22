import { FunctionComponent, useEffect, useState } from "react";
import DefaultLayout from "../../ui/layout/DefaultLayout";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Input,
  useDisclosure,
  Image as ChakraImage,
  VStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import Canvas from "../../features/Canvas/components/Canvas";
import ImageModal from "../../features/ImageModal";
import { Crop } from "react-image-crop/dist/types";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface ThinningPageProps {}

const labelStyles = {
  mt: "2",
  ml: "-2.5",
  fontSize: "sm",
};

const ThinningPage: FunctionComponent<ThinningPageProps> = () => {
  const [draw, setDraw] = useState<any>();
  const [draw2, setDraw2] = useState<any>();
  const [originalBase64Image, setOriginalBase64Image] = useState<string>("");

  const [zhangSuenThreshhold, setZhangSuenThreshhold] = useState<number>(128);
  const [hilditchThreshhold, setHilditchThreshhold] = useState<number>(128);

  const {
    isOpen: isSelectImageOpen,
    onClose: onSelectImageClose,
    onOpen: onSelectImageOpen,
  } = useDisclosure();

  const [crop, setCrop] = useState<Crop>();

  const toBase64 = async (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const onUploadImage = async (e: any) => {
    const fileBase64 = await toBase64(e.target.files[0]);
    setOriginalBase64Image(fileBase64);
    onSelectImageOpen();
  };

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

      setDraw(drawFunction);
    };

    initialImage.addEventListener("load", loadEventCallback, false);

    return () => {
      initialImage.removeEventListener("load", loadEventCallback);
    };
  }, [crop, originalBase64Image]);

  function zhangSuenThinning(
    imageData: ImageData,
    threshold: number = 128
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);

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
          const p2 = isPixelBlack(x, y - 1) ? 1 : 0;
          const p3 = isPixelBlack(x + 1, y - 1) ? 1 : 0;
          const p4 = isPixelBlack(x + 1, y) ? 1 : 0;
          const p5 = isPixelBlack(x + 1, y + 1) ? 1 : 0;
          const p6 = isPixelBlack(x, y + 1) ? 1 : 0;
          const p7 = isPixelBlack(x - 1, y + 1) ? 1 : 0;
          const p8 = isPixelBlack(x - 1, y) ? 1 : 0;
          const p9 = isPixelBlack(x - 1, y - 1) ? 1 : 0;

          const A =
            (p2 && !p3 ? 1 : 0) +
            (p3 && !p4 ? 1 : 0) +
            (p4 && !p5 ? 1 : 0) +
            (p5 && !p6 ? 1 : 0) +
            (p6 && !p7 ? 1 : 0) +
            (p7 && !p8 ? 1 : 0) +
            (p8 && !p9 ? 1 : 0) +
            (p9 && !p2 ? 1 : 0);
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;

          if (isPixelBlack(x, y) && A === 1 && B >= 2 && B <= 6) {
            const m1 = p2 * p4 * p6;
            const m2 = p4 * p6 * p8;

            if ((m1 === 0 || m2 === 0) && B >= 3) {
              // Adjust this condition
              tempData[(y * width + x) * 4] = 255;
              tempData[(y * width + x) * 4 + 1] = 255;
              tempData[(y * width + x) * 4 + 2] = 255;
              hasChanged = true;
            }
          }
        }
      }

      data.set(tempData);
      tempData = new Uint8ClampedArray(data);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const p2 = isPixelBlack(x, y - 1) ? 1 : 0;
          const p3 = isPixelBlack(x + 1, y - 1) ? 1 : 0;
          const p4 = isPixelBlack(x + 1, y) ? 1 : 0;
          const p5 = isPixelBlack(x + 1, y + 1) ? 1 : 0;
          const p6 = isPixelBlack(x, y + 1) ? 1 : 0;
          const p7 = isPixelBlack(x - 1, y + 1) ? 1 : 0;
          const p8 = isPixelBlack(x - 1, y) ? 1 : 0;
          const p9 = isPixelBlack(x - 1, y - 1) ? 1 : 0;

          const A =
            (p2 && !p3 ? 1 : 0) +
            (p3 && !p4 ? 1 : 0) +
            (p4 && !p5 ? 1 : 0) +
            (p5 && !p6 ? 1 : 0) +
            (p6 && !p7 ? 1 : 0) +
            (p7 && !p8 ? 1 : 0) +
            (p8 && !p9 ? 1 : 0) +
            (p9 && !p2 ? 1 : 0);
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;

          if (isPixelBlack(x, y) && A === 1 && B >= 2 && B <= 6) {
            const m1 = p2 * p4 * p8;
            const m2 = p2 * p6 * p8;

            if ((m1 === 0 || m2 === 0) && B >= 3) {
              // Adjust this condition
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

  function hilditchThinning(
    imageData: ImageData,
    threshold: number = 128
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);

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
            if (C === 0) {
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

  function stentifordThinning(
    inputImageData: ImageData,
    threshold: number
  ): ImageData {
    const width = inputImageData.width;
    const height = inputImageData.height;
    const inputData = inputImageData.data;

    // Helper function to get the pixel value at a specific (x, y) location
    function getPixel(x: number, y: number) {
      const index = (y * width + x) * 4; // 4 channels (R, G, B, A)
      return inputData[index];
    }

    // Helper function to set the pixel value at a specific (x, y) location
    function setPixel(x: number, y: number, value: number) {
      const index = (y * width + x) * 4;
      inputData[index] = value;
      inputData[index + 1] = value;
      inputData[index + 2] = value;
      inputData[index + 3] = 255; // Alpha channel
    }

    // Stentiford Thinning Algorithm Logic
    // (You need to implement the algorithm steps here)

    // After performing the thinning algorithm, update the output ImageData
    const outputImageData = new ImageData(
      new Uint8ClampedArray(inputData),
      width,
      height
    );

    return outputImageData;
  }

  // Example usage:
  // You need to pass an ImageData object as input to this function.
  // const inputImage = new ImageData(new Uint8ClampedArray([...pixelData]), width, height);
  // const thinnedImage = stentifordThinning(inputImage);

  function markConvergingDivergingLinePoints(
    imageData: ImageData,
    radius: number
  ): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);

    interface Color {
      r: number;
      g: number;
      b: number;
      a: number;
    }

    // Helper function to set a pixel to a specific color
    function setPixel(x: number, y: number, color: Color) {
      const index = (y * width + x) * 4;
      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
      data[index + 3] = color.a;
    }

    // Helper function to check if a pixel is part of a line (non-background)
    function isLinePixel(x: number, y: number) {
      const index = (y * width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];

      // You can adjust these conditions based on your specific line color
      return red === 0 && green === 0 && blue === 0 && alpha === 255;
    }

    // Iterate through the pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isLinePixel(x, y)) {
          // Check neighboring pixels to find endpoints
          const isEndpoint =
            !isLinePixel(x - 1, y) &&
            !isLinePixel(x + 1, y) &&
            !isLinePixel(x, y - 1) &&
            !isLinePixel(x, y + 1);

          const isBeginning =
            isLinePixel(x - 1, y) &&
            isLinePixel(x + 1, y) &&
            isLinePixel(x, y - 1) &&
            isLinePixel(x, y + 1);

          if (isEndpoint) {
            // Mark endpoints with red circles
            for (let i = -radius; i <= radius; i++) {
              for (let j = -radius; j <= radius; j++) {
                const distance = Math.sqrt(i ** 2 + j ** 2);
                if (distance <= radius) {
                  setPixel(x + i, y + j, { r: 255, g: 0, b: 0, a: 255 });
                }
              }
            }
          } else if (isBeginning) {
            // Mark beginnings with blue circles
            for (let i = -radius; i <= radius; i++) {
              for (let j = -radius; j <= radius; j++) {
                const distance = Math.sqrt(i ** 2 + j ** 2);
                if (distance <= radius) {
                  setPixel(x + i, y + j, { r: 0, g: 0, b: 255, a: 255 });
                }
              }
            }
          }
        }
      }
    }

    return new ImageData(data, width, height);
  }

  function drawBlueSquaresOverLineBreaks(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const squareSize = 5; // Size of the blue square
    const squareColor = [0, 0, 255, 255]; // Blue color (R, G, B, A)

    const isGrayOrBlack = (r: number, g: number, b: number) => {
      // Check if the color is black or gray (adjust the thresholds as needed)
      return r < 50 && g < 50 && b < 50;
    };

    const drawSquareBorder = (x: number, y: number) => {
      for (let dy = 0; dy < squareSize; dy++) {
        for (let dx = 0; dx < squareSize; dx++) {
          if (
            dx === 0 ||
            dx === squareSize - 1 ||
            dy === 0 ||
            dy === squareSize - 1
          ) {
            const squareX = x - Math.floor(squareSize / 2) + dx;
            const squareY = y - Math.floor(squareSize / 2) + dy;

            if (
              squareX >= 0 &&
              squareX < width &&
              squareY >= 0 &&
              squareY < height
            ) {
              const squareIndex = (squareY * width + squareX) * 4;
              data.set(squareColor, squareIndex);
            }
          }
        }
      }
    };

    const isDiagonal = (dx: number, dy: number) => {
      // Check if the line is more diagonal than vertical or horizontal
      const angleThreshold = 30; // Adjust this angle threshold as needed
      const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
      return angle > angleThreshold;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4; // Index for the current pixel

        // Check if the current pixel is part of a black or gray line
        const { r, g, b } = {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
        };

        if (isGrayOrBlack(r, g, b)) {
          let isThinDiagonal = false;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx !== 0 || dy !== 0) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                  nx >= 0 &&
                  nx < width &&
                  ny >= 0 &&
                  ny < height &&
                  isDiagonal(dx, dy) &&
                  isGrayOrBlack(
                    data[(ny * width + nx) * 4],
                    data[(ny * width + nx) * 4 + 1],
                    data[(ny * width + nx) * 4 + 2]
                  )
                ) {
                  isThinDiagonal = true;
                  break;
                }
              }
            }
            if (isThinDiagonal) {
              break;
            }
          }

          if (!isThinDiagonal) {
            drawSquareBorder(x, y);
          }
        }
      }
    }

    return imageData;
  }

  function setOpacityToMaximum(imageData: ImageData): ImageData {
    const { data, width, height } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      // Check if the pixel has non-zero opacity
      if (data[i + 3] > 0) {
        // Set the alpha channel to its maximum value (255)
        data[i + 3] = 255;
      }
    }

    return imageData;
  }

  const onHilditchThinClick = () => {
    setDraw2(() => (ctx2: CanvasRenderingContext2D, frameCount: number) => {
      let imageData = ctx2.getImageData(0, 0, 600, 500);
      let processedImage = setOpacityToMaximum(imageData);

      let thinImage = hilditchThinning(processedImage, hilditchThreshhold);

      let circledThinImage = drawBlueSquaresOverLineBreaks(thinImage);

      ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
      ctx2.putImageData(circledThinImage, 0, 0);
    });
  };

  const onZhangSuenThinClick = () => {
    setDraw(() => (ctx: CanvasRenderingContext2D, frameCount: number) => {
      let imageData = ctx.getImageData(0, 0, 600, 500);
      let processedImage = setOpacityToMaximum(imageData);

      let thinImage = stentifordThinning(processedImage, zhangSuenThreshhold);
      let circledThinImage = drawBlueSquaresOverLineBreaks(thinImage);

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.putImageData(circledThinImage, 0, 0);
    });
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
    <DefaultLayout>
      <Box
        boxShadow={"0px 0px 8px 8px rgba(0, 0, 0, 0.1)"}
        borderRadius={"1rem"}
        p={"2rem"}
      >
        <Heading fontFamily={"Raleway"}>Thinning algorythms</Heading>

        <VStack>
          {originalBase64Image !== "" && <Heading>Original: </Heading>}
          <ChakraImage
            maxW={"50vw"}
            maxH={"50vh"}
            src={originalBase64Image}
            boxShadow={"0px 0px 4px 4px rgba(0, 0, 0, 0.05)"}
            borderRadius={"1rem"}
          ></ChakraImage>

          <Flex gap={"1rem"}>
            <Input
              width={"20rem"}
              pt={"0.25rem"}
              type={"file"}
              onChange={onUploadImage}
            />
          </Flex>
        </VStack>

        <Divider mt={"2rem"} mb={"2rem"} />

        <Flex gap={"3rem"}>
          <Box>
            <Heading fontFamily={"Raleway"}>
              Zhang-Sueng thinning algorithm
            </Heading>
            <VStack mt={"2rem"} alignItems={"stretch"}>
              <Box w={"100%"}>
                <Slider
                  aria-label="slider-ex-6"
                  onChange={(val) => setZhangSuenThreshhold(val)}
                  max={255}
                  min={0}
                  value={zhangSuenThreshhold}
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
                    value={zhangSuenThreshhold}
                    textAlign="center"
                    bg="blue.500"
                    color="white"
                    mt="-10"
                    ml="-5"
                    w="12"
                  >
                    {zhangSuenThreshhold}
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
                      onZhangSuenThinClick();
                    }}
                  >
                    Perform Zhang-Suen thinning
                  </Button>

                  <Text>
                    Selected threshold: <b>{zhangSuenThreshhold}</b>
                  </Text>

                  <Button
                    variant={"ghost"}
                    marginLeft={"auto"}
                    opacity={"0.6"}
                    fontWeight={"500"}
                    onClick={() => {
                      resetCanvas(setDraw);
                    }}
                  >
                    Reset
                  </Button>
                </Flex>
              </Box>
              <Heading fontSize={"1.5rem"} fontWeight={"500"}>
                Result:
              </Heading>
              <TransformWrapper>
                <TransformComponent>
                  <Canvas draw={draw} width={600} height={500} />
                </TransformComponent>
              </TransformWrapper>
            </VStack>
          </Box>

          <Box>
            <Heading fontFamily={"Raleway"}>
              Hilditch Thinning Algorithm
            </Heading>
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
                    }}
                  >
                    Reset
                  </Button>
                </Flex>
              </Box>
              <Heading fontSize={"1.5rem"} fontWeight={"500"}>
                Result:
              </Heading>
              <TransformWrapper>
                <TransformComponent>
                  <Canvas draw={draw2} width={600} height={500} />
                </TransformComponent>
              </TransformWrapper>
            </VStack>
          </Box>
        </Flex>
      </Box>
      <ImageModal
        isOpen={isSelectImageOpen}
        onClose={onSelectImageClose}
        crop={crop}
        setCrop={setCrop}
        src={originalBase64Image}
      />
    </DefaultLayout>
  );
};

export default ThinningPage;
