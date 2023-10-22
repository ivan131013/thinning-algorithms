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
import { ReactCompareSlider } from "react-compare-slider";
import {
  drawBlueSquaresOverLineBreaks,
  setOpacityToMaximum,
} from "../../services/functions";
import HilditchThinning from "../../features/HilditchThinning";
import ZhangSuenThinning from "../../features/ZhangSuenThinning";

interface ThinningPageProps {}

const ThinningPage: FunctionComponent<ThinningPageProps> = () => {
  const [originalBase64Image, setOriginalBase64Image] = useState<string>("");

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

        <Flex gap={"3rem"} justifyContent={"center"}>
          <Box>
            <Heading fontFamily={"Raleway"}>
              Zhang-Sueng thinning algorithm
            </Heading>
            <ZhangSuenThinning
              crop={crop}
              originalBase64Image={originalBase64Image}
            />
          </Box>

          <Box>
            <Heading fontFamily={"Raleway"}>
              Hilditch Thinning Algorithm
            </Heading>
            <HilditchThinning
              crop={crop}
              originalBase64Image={originalBase64Image}
            />
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
