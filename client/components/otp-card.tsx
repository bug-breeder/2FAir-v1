"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  Button,
} from "@nextui-org/react";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode.react";
import { useDeviceContext } from "@/context/device-context";

interface OTPCardProps {
  otp: {
    issuer: string;
    label: string;
    secret: string;
    period: number;
  };
  isActive: boolean;
  setActiveMenu: (x: number, y: number) => void;
  activeMenu: { idx: number; x: number; y: number } | null;
  closeMenu: () => void;
}

const OTPCard: React.FC<OTPCardProps> = ({
  otp,
  isActive,
  activeMenu,
  setActiveMenu,
  closeMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const [remainingTime, setRemainingTime] = useState(otp.period);
  const [currentCode, setCurrentCode] = useState("");
  const [showQR, setShowQR] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const { isTouchDevice, showContextMenu, setShowContextMenu } =
    useDeviceContext();

  const totp = new OTPAuth.TOTP({
    issuer: otp.issuer,
    label: otp.label,
    algorithm: "SHA1",
    digits: 6,
    period: otp.period,
    secret: OTPAuth.Secret.fromBase32(otp.secret),
  });

  useEffect(() => {
    const generateCode = () => {
      setCurrentCode(totp.generate());
    };

    generateCode();

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === 1) {
          generateCode();
          return otp.period;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otp.period, totp]);

  const handleCopy = () => {
    if (!isLongPress.current) {
      navigator.clipboard.writeText(currentCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
    isLongPress.current = false;
  };

  const filledDots = Math.floor((remainingTime / otp.period) * 5);
  const dots = Array.from({ length: 5 }, (_, i) => i < filledDots);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!isTouchDevice) {
      setActiveMenu(event.clientX, event.clientY);
    }
    // DO NOT DELETE THIS COMMENTED CODE
    // else {
    //   setShowContextMenu(true);
    // }
  };

  const handleLongPressStart = (event: React.TouchEvent) => {
    document.documentElement.classList.add("noselect"); // Add noselect class
    isLongPress.current = false;
    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      if (!isTouchDevice)
        setActiveMenu(event.touches[0].clientX, event.touches[0].clientY);
      else setShowContextMenu(true);
    }, 500);
    event.preventDefault(); // Prevent default behavior to avoid text selection
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    document.documentElement.classList.remove("noselect"); // Remove noselect class
  };

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    document.documentElement.classList.remove("noselect"); // Remove noselect class
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleTouchMove}
    >
      <Tooltip content={copied ? "Copied!" : "Click to copy"} placement="top">
        <Card
          isHoverable
          isPressable
          className="w-full max-w-[430px] transition-transform transform betterhover:hover:scale-105 active:scale-95"
          onPress={handleCopy}
        >
          <CardBody className="flex flex-row gap-5 justify-between items-center pt-3 pl-3 pr-3 pb-1">
            <div className="flex gap-3 items-center flex-grow overflow-hidden">
              <Avatar
                className="flex-shrink-0"
                radius="full"
                size="md"
                src="https://nextui.org/avatars/avatar-1.png"
              />
              <div className="flex flex-col gap-1 items-start justify-center flex-grow overflow-hidden">
                <h4 className="text-md leading-none">{otp.issuer}</h4>
                <h5 className="text-small tracking-tight truncate w-full">
                  {otp.label}
                </h5>
              </div>
            </div>
            <div className="flex items-center font-bold text-xl">
              {currentCode}
            </div>
          </CardBody>
          <CardFooter className="flex items-center justify-between py-2">
            <p className="text-small text-default-300">
              {copied ? "Copied!" : "Tap to copy the OTP code"}
            </p>
            <div className="flex justify-center my-2">
              {dots.map((filled, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 ml-2 rounded-full ${
                    filled ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </CardFooter>
        </Card>
      </Tooltip>
      {!isTouchDevice && isActive && (
        <Dropdown isOpen onClose={closeMenu}>
          <DropdownTrigger>
            {activeMenu && (
              <div
                style={{
                  position: "absolute",
                  top: activeMenu.y,
                  left: activeMenu.x,
                  width: 0,
                  height: 0,
                }}
              />
            )}
          </DropdownTrigger>
          <DropdownMenu aria-label="Actions">
            <DropdownItem key="qr" onClick={() => setShowQR(true)}>
              Show QR
            </DropdownItem>
            <DropdownItem key="edit">Edit</DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              onClick={() => alert("deleted")}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}
      {showContextMenu && isTouchDevice && (
        <Modal
          size="sm"
          hideCloseButton={true}
          isOpen={showContextMenu}
          onClose={() => setShowContextMenu(false)}
        >
          <ModalContent>
            <div className="flex flex-col gap-2 flex-grow overflow-hidden items-center">
              <Button onClick={() => setShowQR(true)}>Show QR</Button>
              <Button>Edit</Button>
              <Button color="danger" onClick={() => alert("deleted")}>
                Delete
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
      {showQR && (
        <Modal isOpen={showQR} onClose={() => setShowQR(false)}>
          <ModalContent>
            <QRCode
              value={`otpauth://totp/${otp.issuer}:${otp.label}?secret=${otp.secret}&issuer=${otp.issuer}&algorithm=SHA1&digits=6&period=${otp.period}`}
            />
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default OTPCard;
