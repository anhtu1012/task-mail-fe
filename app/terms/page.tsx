import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, SUPPORT_EMAIL } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — TaskBox",
  description: "The terms that govern your use of TaskBox.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      summaryVi={
        <>
          Dùng TaskBox nghĩa là bạn đồng ý với các điều khoản này: dùng dịch vụ hợp pháp, tự chịu
          trách nhiệm với nội dung mình tạo, dịch vụ cung cấp &quot;nguyên trạng&quot; và có thể
          thay đổi. Bạn có thể ngừng dùng và yêu cầu xoá tài khoản bất cứ lúc nào.
        </>
      }
    >
      <p>
        These Terms govern your use of TaskBox at{" "}
        <a href="https://task-mail-fe.vercel.app">task-mail-fe.vercel.app</a> and its API. By
        creating an account or using the service you agree to them.
      </p>

      <h2>1. The service</h2>
      <p>
        TaskBox lets you manage projects and tasks, optionally create tasks from Gmail messages
        with configured subject prefixes, and receive reminders through a Zalo Bot. Features may
        change or be discontinued over time.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials secure.</li>
        <li>You are responsible for activity that happens under your account.</li>
        <li>You must be at least 13 years old to use TaskBox.</li>
      </ul>

      <h2>3. Connected services</h2>
      <p>
        When you connect Gmail or Zalo you authorise TaskBox to access those services only as
        described in our <Link href="/privacy">Privacy Policy</Link>. You can disconnect them at
        any time. Your use of Google and Zalo remains subject to their own terms.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use TaskBox for unlawful purposes or to store content you have no right to store;</li>
        <li>attempt to access other users&apos; data or disrupt the service;</li>
        <li>reverse engineer, overload, or automate abusive access to the API.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of the tasks and content you create. You grant us only the limited
        permission needed to store, process and display that content to provide the service.
      </p>

      <h2>6. Termination</h2>
      <p>
        You may stop using TaskBox at any time and request account deletion by emailing{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may suspend accounts that
        violate these Terms.
      </p>

      <h2>7. Disclaimer and liability</h2>
      <p>
        TaskBox is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
        permitted by law, we are not liable for indirect or consequential damages, missed
        deadlines, or loss of data arising from use of the service.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms and will post the new version on this page with an updated
        effective date. Continued use after changes means you accept them.
      </p>

      <h2>9. Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalLayout>
  );
}
