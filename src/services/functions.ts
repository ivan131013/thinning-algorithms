export function drawBlueSquaresOverLineBreaks(imageData: ImageData) {
  const { width, height, data } = structuredClone(imageData);
  const squareSize = 5; // Size of the blue square
  const squareColor = [0, 0, 255, 255]; // Blue color (R, G, B, A)

  let markersCoordinates = [];

  const isGrayOrBlack = (r: number, g: number, b: number) => {
    // Check if the color is black or gray (adjust the thresholds as needed)
    return r + g + b < 500;
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
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
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
                  imageData.data[(ny * width + nx) * 4],
                  imageData.data[(ny * width + nx) * 4 + 1],
                  imageData.data[(ny * width + nx) * 4 + 2]
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
          markersCoordinates.push({ x: x, y: y });
        }
      }
    }
  }

  const localImageData = new ImageData(data, width);

  return { imageData: localImageData, markersCoordinates };
}

export function setOpacityToMaximum(imageData: ImageData): ImageData {
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

export function drawSquaresOnImageData(
  imageData: ImageData,
  coordinates: { x: number; y: number }[],
  color = "red"
): ImageData {
  const onScreenCanvas = document.createElement("canvas");
  const onScreenContext = onScreenCanvas.getContext("2d");

  if (!onScreenContext) {
    throw new Error("Failed to create a 2D rendering context.");
  }

  onScreenCanvas.width = imageData.width;
  onScreenCanvas.height = imageData.height;
  onScreenContext.putImageData(imageData, 0, 0);

  onScreenContext.strokeStyle = color;
  onScreenContext.lineWidth = 2;

  for (const coordinate of coordinates) {
    onScreenContext.beginPath();
    onScreenContext.rect(coordinate.x, coordinate.y, 10, 10); // Adjust the size of the square as needed
    onScreenContext.stroke();
  }

  const modifiedImageData = onScreenContext.getImageData(
    0,
    0,
    imageData.width,
    imageData.height
  );
  return modifiedImageData;
}

export function markConvergingDivergingLines(
  imageData: ImageData,
  circleRadius: number
) {
  const { data, width, height } = imageData;

  let markersCoordinates = [];

  // Helper function to check if a pixel is black
  function isBlack(x: number, y: number): boolean {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return false;
    }
    const index = (y * width + x) * 4;
    return data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      // Check if the current pixel is part of a black line
      if (isBlack(x, y)) {
        let isConverging = false;
        let isDiverging = false;

        // Check if it's a converging point
        if (
          isBlack(x - 1, y) &&
          isBlack(x + 1, y) &&
          isBlack(x, y - 1) &&
          isBlack(x, y + 1)
        ) {
          isConverging = true;
        }

        // Check if it's a diverging point
        if (
          (isBlack(x - 1, y) && isBlack(x + 1, y) && isBlack(x, y - 1)) ||
          (isBlack(x - 1, y) && isBlack(x + 1, y) && isBlack(x, y + 1)) ||
          (isBlack(x, y - 1) && isBlack(x, y + 1) && isBlack(x - 1, y)) ||
          (isBlack(x, y - 1) && isBlack(x, y + 1) && isBlack(x + 1, y))
        ) {
          isDiverging = true;
        }

        // If it's a converging or diverging point, draw a circle
        if (isConverging || isDiverging) {
          markersCoordinates.push({ x: x, y: y });
          for (let i = -circleRadius; i <= circleRadius; i++) {
            for (let j = -circleRadius; j <= circleRadius; j++) {
              if (
                i * i + j * j <= circleRadius * circleRadius &&
                isBlack(x + i, y + j)
              ) {
                const circleIndex = ((y + j) * width + x + i) * 4;

                if (isConverging) {
                  data[circleIndex] = 0; // Red channel
                  data[circleIndex + 1] = 255; // Green channel
                  data[circleIndex + 2] = 0; // Blue channel
                } else if (isDiverging) {
                  data[circleIndex] = 255; // Red channel
                  data[circleIndex + 1] = 160; // Green channel
                  data[circleIndex + 2] = 0; // Blue channel
                }
              }
            }
          }
        }
      }
    }
  }

  return { imageData, markersCoordinates };
}
