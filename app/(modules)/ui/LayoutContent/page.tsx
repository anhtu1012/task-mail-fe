"use client";

import React from "react";
import LayoutContent, {
  LayoutSection,
} from "@/components/global/LayoutContent";

const LayoutDemoPage = () => {
  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
      }}
    >
      <section>
        <h2 style={{ marginBottom: "16px" }}>1. Split Horizontal (Split-H)</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Dùng để chia đôi màn hình, ví dụ bên trái là Bảng, bên phải là Biểu
          đồ.
        </p>
        <div style={{ height: "300px", border: "1px dashed #ccc" }}>
          <LayoutContent type="split-h" gap={16}>
            <LayoutSection
              style={{
                backgroundColor: "#e6f7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Data Grid Area</b>
            </LayoutSection>
            <LayoutSection
              style={{
                backgroundColor: "#f6ffed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Chart / Statistics Area</b>
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>2. Sidebar - Main</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Dùng khi có bộ lọc bên trái và nội dung chính bên phải.
        </p>
        <div style={{ height: "300px", border: "1px dashed #ccc" }}>
          <LayoutContent type="sidebar-main" gap={16}>
            <LayoutSection
              style={{
                backgroundColor: "#fff7e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Filters / Sidebar</b>
            </LayoutSection>
            <LayoutSection
              style={{
                backgroundColor: "#f9f0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Main Content</b>
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>3. Grid Layout</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Tự động chia cột, ví dụ layout 3 cột cho các thẻ Dashboard.
        </p>
        <div style={{ border: "1px dashed #ccc", padding: "10px" }}>
          <LayoutContent type="grid" columns={3} gap={16}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LayoutSection
                key={i}
                style={{
                  height: "100px",
                  backgroundColor: "#fff1f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                }}
              >
                <b>Card {i}</b>
              </LayoutSection>
            ))}
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>4. Dashboard Complex Layout</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Layout phức tạp có Header, Main, Aside và Footer.
        </p>
        <div style={{ height: "400px", border: "1px dashed #ccc" }}>
          <LayoutContent type="dashboard" gap={8}>
            <LayoutSection
              area="header"
              style={{
                backgroundColor: "#001529",
                color: "white",
                padding: "10px",
              }}
            >
              Header Area
            </LayoutSection>
            <LayoutSection
              area="main"
              style={{ backgroundColor: "#fff", padding: "20px" }}
            >
              Main Content Area (Scrollable)
            </LayoutSection>
            <LayoutSection
              area="aside"
              style={{
                backgroundColor: "#fafafa",
                borderLeft: "1px solid #f0f0f0",
                padding: "10px",
              }}
            >
              Right Sidebar / Tools
            </LayoutSection>
            <LayoutSection
              area="footer"
              style={{
                backgroundColor: "#f0f2f5",
                padding: "10px",
                textAlign: "center",
              }}
            >
              Footer Area
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>
      <section>
        <h2 style={{ marginBottom: "16px" }}>5. Three Columns</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Chia làm 3 cột bằng nhau, tự động xuống dòng trên mobile.
        </p>
        <div style={{ border: "1px dashed #ccc" }}>
          <LayoutContent type="three-columns" gap={16}>
            <LayoutSection
              style={{
                height: "150px",
                backgroundColor: "#e6fffb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Column 1</b>
            </LayoutSection>
            <LayoutSection
              style={{
                height: "150px",
                backgroundColor: "#fff0f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Column 2</b>
            </LayoutSection>
            <LayoutSection
              style={{
                height: "150px",
                backgroundColor: "#fcffe6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <b>Column 3</b>
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>6. Holy Grail Layout</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Bố cục đầy đủ: Header, Nav, Main, Aside và Footer.
        </p>
        <div style={{ height: "400px", border: "1px dashed #ccc" }}>
          <LayoutContent type="holy-grail" gap={8}>
            <LayoutSection
              area="header"
              style={{
                backgroundColor: "#001529",
                color: "white",
                padding: "10px",
              }}
            >
              Header
            </LayoutSection>
            <LayoutSection
              area="nav"
              style={{ backgroundColor: "#f0f2f5", padding: "10px" }}
            >
              Nav
            </LayoutSection>
            <LayoutSection
              area="main"
              style={{ backgroundColor: "#fff", padding: "10px" }}
            >
              Main Content
            </LayoutSection>
            <LayoutSection
              area="aside"
              style={{ backgroundColor: "#f0f2f5", padding: "10px" }}
            >
              Aside
            </LayoutSection>
            <LayoutSection
              area="footer"
              style={{
                backgroundColor: "#001529",
                color: "white",
                padding: "10px",
              }}
            >
              Footer
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>
          7. Sticky Header + Scrollable Content
        </h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Header cố định bên trên, nội dung bên dưới có thể cuộn.
        </p>
        <div
          style={{
            height: "300px",
            border: "1px dashed #ccc",
            overflow: "hidden",
          }}
        >
          <LayoutContent type="sticky-header">
            <LayoutSection
              style={{
                backgroundColor: "#1890ff",
                color: "white",
                padding: "15px",
              }}
            >
              <b>Sticky Header (Fixed)</b>
            </LayoutSection>
            <LayoutSection style={{ padding: "20px" }}>
              <div
                style={{
                  height: "600px",
                  background: "linear-gradient(to bottom, #fff, #f0f0f0)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <p>Scroll down to see the effect...</p>
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    style={{ padding: "10px", border: "1px solid #eee" }}
                  >
                    Item {i + 1}
                  </div>
                ))}
              </div>
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "16px" }}>8. Card with Sidebar</h2>
        <p style={{ marginBottom: "12px", color: "#666" }}>
          Thường dùng cho trang Profile hoặc Settings bên trong một Card.
        </p>
        <div style={{ padding: "20px", backgroundColor: "#f5f5f5" }}>
          <LayoutContent type="card-with-sidebar">
            <LayoutSection>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                    fontWeight: "bold",
                  }}
                >
                  Profile
                </li>
                <li
                  style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
                >
                  Account
                </li>
                <li
                  style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}
                >
                  Security
                </li>
                <li style={{ padding: "8px 0" }}>Notifications</li>
              </ul>
            </LayoutSection>
            <LayoutSection>
              <h3>Profile Settings</h3>
              <p>Đây là nội dung chi tiết bên phải của Card.</p>
              <div
                style={{
                  height: "100px",
                  backgroundColor: "#fafafa",
                  border: "1px dashed #ccc",
                }}
              ></div>
            </LayoutSection>
          </LayoutContent>
        </div>
      </section>
    </div>
  );
};

export default LayoutDemoPage;
