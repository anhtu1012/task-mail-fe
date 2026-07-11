"use client";
import { Button, Flex, Space, Typography } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import "@/styles/pages/not-found.scss"

// export default function NotFound() {
const NotFound = () => {
  const router = useRouter();
  return (
    <Fragment>
      <Space className="not-found__page">
        <Flex
          vertical
          justify="center"
          align="center"
          style={{ width: "100%" }}
        >
          <Image src="/images/404.png" alt="404" width={400} height={300}  loading="eager"/>
          <Typography className="title">404</Typography>
          <Typography className="title-des">Không tìm thấy trang.</Typography>
          <Typography className="des">
            Chúng tôi không tìm thấy trang mà bạn đang tìm kiếm.
          </Typography>
          <Button className="btn-back" onClick={() => router.push("/")}>
            Về trang chủ
          </Button>
        </Flex>
      </Space>
    </Fragment>
  );
};

export default NotFound;
