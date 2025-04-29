import { AdminLayout } from "@/components/layouts/admin-layout";
import UploadTest from "@/components/admin/upload-test";

export default function UploadTestPage() {
  return (
    <AdminLayout title="File Upload Test" subtitle="Test the file upload functionality for admin users">
      <div className="container mx-auto py-6">
        <UploadTest />
      </div>
    </AdminLayout>
  );
}