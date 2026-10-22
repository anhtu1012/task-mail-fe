import type { Metadata } from "next";
import { LegalLayout, SUPPORT_EMAIL } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — TaskBox",
  description: "How TaskBox collects, uses, stores and deletes your data, including data from Google APIs.",
};

/*
 * GIỮ KHỚP VỚI CODE. Người duyệt Google đối chiếu từng câu ở đây với những gì
 * app thực sự làm (task-mail-be: mail-ingestion.service.ts, mail-accounts,
 * google.strategy.ts). Đổi scope hoặc cách xử lý mail thì sửa trang này.
 */
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summaryVi={
        <>
          TaskBox chỉ đọc những email có tiêu đề bắt đầu bằng tiền tố bạn cấu hình (vd.{" "}
          <code>[TASK]</code>) để tạo công việc, rồi đánh dấu các email đó là đã đọc. Chúng tôi
          không lưu nội dung email, không bán dữ liệu, không dùng cho quảng cáo hay huấn luyện AI.
          Token Google được mã hoá AES-256-GCM. Bạn có thể ngắt kết nối Gmail bất cứ lúc nào và
          yêu cầu xoá tài khoản qua email {SUPPORT_EMAIL}.
        </>
      }
    >
      <p>
        TaskBox (&quot;we&quot;, &quot;us&quot;) is a task management application available at{" "}
        <a href="https://task-mail-fe.vercel.app">task-mail-fe.vercel.app</a>. It turns emails
        into tasks and sends deadline reminders. This policy explains what data we collect, why,
        and how you can control it.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email address, and a hashed password if you sign up
          with email. If you sign in with Google, we receive your Google account ID, email address
          and basic profile (name, picture) via the <code>email</code> and <code>profile</code>{" "}
          scopes.
        </li>
        <li>
          <strong>Content you create:</strong> projects, boards, tasks, checklists, comments,
          labels and attachments you add in the app.
        </li>
        <li>
          <strong>Gmail data (only if you connect a Gmail account):</strong> see Section 3.
        </li>
        <li>
          <strong>Zalo data (only if you link Zalo):</strong> your Zalo user ID, used solely to
          send you task reminders through the TaskBox Zalo Bot.
        </li>
        <li>
          <strong>Technical data:</strong> session cookies needed to keep you signed in, and the
          browser user-agent and IP address recorded with each login session for security.
        </li>
      </ul>

      <h2>2. How we use data</h2>
      <ul>
        <li>To provide the service: sign you in, store and display your tasks, send reminders.</li>
        <li>To keep your account secure (session management, detecting token reuse).</li>
        <li>To respond to your support requests.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your data, show advertising, or use your data to train
        artificial-intelligence or machine-learning models.
      </p>

      <h2>3. Google user data (Gmail)</h2>
      <p>
        When you choose to connect a Gmail account on the Integrations page, TaskBox requests the{" "}
        <code>https://www.googleapis.com/auth/gmail.modify</code> and{" "}
        <code>userinfo.email</code> scopes. With this access TaskBox:
      </p>
      <ul>
        <li>
          Periodically searches your mailbox <strong>only</strong> for messages whose subject
          contains the task prefixes you configure (for example <code>[TASK]</code>) and that were
          received within a limited recent time window.
        </li>
        <li>
          Reads those matching messages to extract a task: title, description, deadline, priority,
          assignee email and attachment file names. The task is saved in your TaskBox account
          together with a reference to the original message ID so the same email is never turned
          into a task twice.
        </li>
        <li>
          Marks those matching messages as read (removes the UNREAD label) so you can see which
          emails have been processed. This is the only change TaskBox makes to your mailbox.
        </li>
      </ul>
      <p>TaskBox does not:</p>
      <ul>
        <li>read, store or process any message that does not match your task prefixes;</li>
        <li>store full email bodies, headers or attachment contents beyond the task fields above;</li>
        <li>send, delete, or move emails, or change any other label or setting;</li>
        <li>
          share Gmail data with third parties, use it for advertising, or allow humans to read it,
          except with your explicit consent for support, for security purposes, or to comply with
          law.
        </li>
      </ul>
      <p>
        <strong>Limited Use disclosure:</strong> TaskBox&apos;s use and transfer to any other app
        of information received from Google APIs will adhere to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h2>4. Storage and security</h2>
      <ul>
        <li>
          Google OAuth access and refresh tokens are encrypted at rest with AES-256-GCM and never
          stored in plain text.
        </li>
        <li>Passwords are stored only as salted hashes.</li>
        <li>
          Your sign-in session uses an HttpOnly, Secure cookie; refresh tokens are rotated on each
          use and stored as hashes.
        </li>
        <li>All traffic between your browser, our servers and Google is encrypted with HTTPS.</li>
        <li>
          Our infrastructure providers are Vercel (web front-end) and Render (API server and
          database). They process data only on our behalf to host the service.
        </li>
      </ul>

      <h2>5. Data retention and deletion</h2>
      <ul>
        <li>
          <strong>Disconnect Gmail</strong> at any time from the Integrations page. This deletes
          the stored Google tokens for that account immediately; tasks already created remain
          until you delete them. You can also revoke access at{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          .
        </li>
        <li>You can delete individual tasks, boards and projects in the app at any time.</li>
        <li>
          To delete your whole account and all associated data, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address registered with
          TaskBox. We complete deletion within 30 days.
        </li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use only essential cookies: an access-token cookie and an HttpOnly refresh-token cookie
        to keep you signed in, plus local storage for interface preferences (theme, selected
        project). We do not use tracking or advertising cookies.
      </p>

      <h2>7. Children</h2>
      <p>TaskBox is not directed to children under 13 and we do not knowingly collect their data.</p>

      <h2>8. Changes</h2>
      <p>
        We will post any changes on this page and update the effective date. Material changes
        affecting Google user data will be communicated before they take effect.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalLayout>
  );
}
