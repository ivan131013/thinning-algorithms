import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  useStatStyles,
} from "@chakra-ui/react";
import { FunctionComponent, useState } from "react";
import ReactCrop, { Crop, centerCrop, makeAspectCrop } from "react-image-crop";

interface ImageModalProps {
  isOpen: boolean;
  onClose(): void;
  crop?: Crop;
  setCrop(newCrop: Crop): void;
  src: string;
}

const ImageModal: FunctionComponent<ImageModalProps> = ({
  isOpen,
  onClose,
  crop,
  setCrop,
  src,
}) => {
  const [localCrop, setLocalCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 50,
    y: 0,
    x: 0,
  });

  function onImageLoad(e: any) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const ccrop = centerCrop(
      makeAspectCrop(
        {
          // You don't need to pass a complete crop into
          // makeAspectCrop or centerCrop.
          unit: "%",
          width: 90,
        },
        6 / 5,
        width,
        height
      ),
      width,
      height
    );

    setLocalCrop(ccrop);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={"xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Choose size</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <ReactCrop
            crop={localCrop}
            onChange={(c, pc) => {
              setLocalCrop(pc);
            }}
            ruleOfThirds
          >
            <Image src={src} onLoad={onImageLoad} />
          </ReactCrop>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCrop({ ...localCrop });
              onClose();
            }}
          >
            Set image
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageModal;
