"use client";

import React from "react";
import * as HeThong from "./he-thong";
import * as DinhDang from "./dinh-dang";
import * as KeHoach from "./ke-hoach";
import * as PrePlanning from "./pre-planning";

interface ShipModuleRendererProps {
  moduleCode: string;
}

export const ShipModuleRenderer: React.FC<ShipModuleRendererProps> = ({ moduleCode }) => {
  const code = moduleCode.toUpperCase();

  switch (code) {
    // 1. HỆ THỐNG
    case "THIET-LAP-QUY-LUAT":
      return <HeThong.ThietLapQuyLuatPage />;

    // 2. ĐỊNH DẠNG
    case "SHIP": // Hoặc mặc định SHIP mở thông tin tàu
    case "THONG-TIN-TAU":
      return <DinhDang.ThongTinTauPage />;
    case "TRONG-LUONG-TOI-DA":
      return <DinhDang.TrongLuongToiDaPage />;
    case "THIET-KE-TAU":
      return <DinhDang.ThietKeTauPage />;
    case "IN-SO-DO-TAU":
      return <DinhDang.InSoDoTauPage />;

    // 3. KẾ HOẠCH
    case "KE-HOACH-DO-CONTAINER":
      return <KeHoach.KeHoachDoContainerPage />;
    case "KE-HOACH-XEP-CONTAINER":
      return <KeHoach.KeHoachXepContainerPage />;
    case "DANH-SACH-CONTAINER-XUAT-TAU":
      return <KeHoach.DanhSachXuatTauPage />;
    case "THONG-KE-KE-HOACH-XEP-DO":
      return <KeHoach.ThongKeXepDoPage />;
    case "GAN-CAU":
      return <KeHoach.GanCauPage />;
    case "CAP-NHAT-DANH-SACH-CONTAINER-XUAT-TAU":
      return <KeHoach.CapNhatDanhSachXuatTauPage />;
    case "IN-KE-HOACH":
      return <KeHoach.InKeHoachPage />;
    case "CMC":
      return <KeHoach.CmcPage />;

    // 4. PRE PLANNING
    case "DANH-SACH-PRE-PLAN":
      return <PrePlanning.DanhSachPrePlanPage />;
    case "GROUP-CONTAINER-XUAT-TAU":
      return <PrePlanning.GroupContainerXuatTauPage />;

    default:
      return null;
  }
};

export default ShipModuleRenderer;
