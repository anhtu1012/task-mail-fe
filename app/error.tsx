// Error components must be Client Components
"use client";
import { Button, Flex, Space, Typography } from "antd";
import Image from "next/image";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Space className="not-found__page">
      <Flex vertical justify="center" align="center" style={{ width: "100%" }}>
        <Image
          src="/images/somthing-wrong.png"
          alt="somthing-wrong"
          width={400}
          height={300}
          loading="eager"
        />
        <Typography className="title">OOP!</Typography>
        <Typography className="title-des">Lỗi không xác định.</Typography>
        <Typography className="des">
          Trang hiện tại đang gặp sự cố. Vui lòng làm mới lại trang website hoặc
          liên hệ với quản trị viên.
        </Typography>
        <Button className="btn-back" onClick={() => reset()}>
          Làm mới
        </Button>
      </Flex>
    </Space>
  );
}
