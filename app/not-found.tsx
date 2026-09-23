"use client";

import { Button, Typography } from "antd";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import "@/styles/pages/not-found.scss";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="not-found__page">
      <div className="not-found__content">
        <Image
          src="/images/404.png"
          alt="404"
          width={380}
          height={260}
          priority
          className="not-found__image"
        />
        <Typography.Title level={1} className="title">
          404
        </Typography.Title>
        <Typography.Text className="title-des">
          Không tìm thấy trang
        </Typography.Text>
        <Typography.Paragraph className="des">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
        </Typography.Paragraph>
        <Button
          type="primary"
          icon={<Home size={16} />}
          className="btn-back"
          onClick={() => router.push("/")}
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
}
