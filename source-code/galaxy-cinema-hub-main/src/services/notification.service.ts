import { API_ENDPOINTS, apiCall } from "@/lib/api";

export type NotificationType = "BOOKING" | "PROMOTION" | "SYSTEM";
export type NotificationAudience = "ALL" | "GUEST" | "USER" | "STAFF" | "ADMIN";

export interface NotificationCampaign {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  target_audience: NotificationAudience;
  status: "SCHEDULED" | "SENT" | "CANCELLED";
  scheduled_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  recipient_count: number;
  read_count: number;
}

interface ListResponse {
  success: boolean;
  message: string;
  data: {
    items: NotificationCampaign[];
    stats: {
      total_notifications: number;
      total_recipients: number;
      total_reads: number;
      sent_notifications?: number;
      scheduled_notifications?: number;
    };
  };
}

interface CreateResponse {
  success: boolean;
  message: string;
  data: {
    id?: number;
    recipient_count: number;
    status?: "SCHEDULED" | "SENT" | "CANCELLED";
  };
}

export class NotificationService {
  static async getAdminNotifications(search = "", type = "all") {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "all") params.set("type", type);

    const endpoint = `${API_ENDPOINTS.ADMIN_NOTIFICATIONS}${params.toString() ? `?${params.toString()}` : ""}`;
    return apiCall<ListResponse>(endpoint);
  }

  static async createAdminNotification(payload: {
    title: string;
    message: string;
    type: NotificationType;
    target_audience: NotificationAudience;
    scheduled_at?: string;
  }) {
    return apiCall<CreateResponse>(API_ENDPOINTS.ADMIN_NOTIFICATIONS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async deleteAdminNotification(id: number) {
    return apiCall<{ success: boolean; message: string }>(
      API_ENDPOINTS.ADMIN_NOTIFICATION_DETAIL(id),
      {
        method: "DELETE",
      },
    );
  }
}
