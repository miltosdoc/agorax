import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import t from "@/i18n";
import type { User, SelectAccountActivity } from "@shared/schema";

interface UserWithActivity extends User {
  activityCount?: number;
}

export default function AdminAccountsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery<UserWithActivity[]>({
    queryKey: ['/api/admin/accounts', { status: statusFilter !== 'all' ? statusFilter : undefined, search: searchQuery || undefined }],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<SelectAccountActivity[]>({
    queryKey: [`/api/admin/accounts/${selectedUserId}/activity`],
    enabled: !!selectedUserId && activityModalOpen,
  });

  const banMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/admin/accounts/${userId}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounts'] });
      toast({
        title: t("Success"),
        description: t("User has been banned successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("Error"),
        description: t("Failed to ban user"),
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/admin/accounts/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounts'] });
      toast({
        title: t("Success"),
        description: t("User has been approved successfully"),
      });
    },
    onError: () => {
      toast({
        title: t("Error"),
        description: t("Failed to approve user"),
        variant: "destructive",
      });
    },
  });

  const handleViewActivity = (userId: number) => {
    setSelectedUserId(userId);
    setActivityModalOpen(true);
  };

  const handleBan = (userId: number) => {
    banMutation.mutate(userId);
  };

  const handleApprove = (userId: number) => {
    approveMutation.mutate(userId);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600" data-testid="badge-status-active">
            {t("Active")}
          </Badge>
        );
      case "flagged":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600" data-testid="badge-status-flagged">
            {t("Flagged")}
          </Badge>
        );
      case "banned":
        return (
          <Badge variant="destructive" data-testid="badge-status-banned">
            {t("Banned")}
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600" data-testid="badge-status-active">
            {t("Active")}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-page-title">
            {t("Account Management")}
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            {t("Manage user accounts and monitor activity")}
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t("Filter by Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="select-option-all">{t("All")}</SelectItem>
                <SelectItem value="active" data-testid="select-option-active">{t("Active")}</SelectItem>
                <SelectItem value="flagged" data-testid="select-option-flagged">{t("Flagged")}</SelectItem>
                <SelectItem value="banned" data-testid="select-option-banned">{t("Banned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              placeholder={t("Search by username or email")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-users"
            />
          </div>
        </div>

        {usersLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" data-testid={`skeleton-user-${i}`} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="table-head-username">{t("Username")}</TableHead>
                  <TableHead data-testid="table-head-email">{t("Email")}</TableHead>
                  <TableHead data-testid="table-head-status">{t("Account Status")}</TableHead>
                  <TableHead data-testid="table-head-reg-ip">{t("Registration IP")}</TableHead>
                  <TableHead data-testid="table-head-last-ip">{t("Last Login IP")}</TableHead>
                  <TableHead data-testid="table-head-fingerprint">{t("Device Fingerprint")}</TableHead>
                  <TableHead data-testid="table-head-actions">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell data-testid={`text-username-${user.id}`}>{user.username}</TableCell>
                      <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                      <TableCell data-testid={`cell-status-${user.id}`}>
                        {getStatusBadge(user.accountStatus)}
                      </TableCell>
                      <TableCell data-testid={`text-reg-ip-${user.id}`}>
                        {user.registrationIp || t("N/A")}
                      </TableCell>
                      <TableCell data-testid={`text-last-ip-${user.id}`}>
                        {user.lastLoginIp || t("N/A")}
                      </TableCell>
                      <TableCell data-testid={`text-fingerprint-${user.id}`}>
                        {user.deviceFingerprint ? user.deviceFingerprint.substring(0, 8) : t("N/A")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewActivity(user.id)}
                            data-testid={`button-view-activity-${user.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t("View Activity")}
                          </Button>
                          {user.accountStatus !== "banned" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBan(user.id)}
                              disabled={banMutation.isPending}
                              data-testid={`button-ban-${user.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              {t("Ban")}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                              data-testid={`button-approve-${user.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("Approve")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8" data-testid="text-no-users">
                      {t("No users found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Footer />

      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-activity">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-activity">{t("User Activity")}</DialogTitle>
          </DialogHeader>
          
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" data-testid={`skeleton-activity-${i}`} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="table-head-action">{t("Action")}</TableHead>
                    <TableHead data-testid="table-head-ip">{t("IP Address")}</TableHead>
                    <TableHead data-testid="table-head-device">{t("Device Fingerprint")}</TableHead>
                    <TableHead data-testid="table-head-timestamp">{t("Timestamp")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities && activities.length > 0 ? (
                    activities.map((activity) => (
                      <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
                        <TableCell data-testid={`text-action-${activity.id}`}>{activity.action}</TableCell>
                        <TableCell data-testid={`text-ip-${activity.id}`}>
                          {activity.ipAddress || t("N/A")}
                        </TableCell>
                        <TableCell data-testid={`text-device-${activity.id}`}>
                          {activity.deviceFingerprint ? activity.deviceFingerprint.substring(0, 8) : t("N/A")}
                        </TableCell>
                        <TableCell data-testid={`text-timestamp-${activity.id}`}>
                          {format(new Date(activity.timestamp), "PPp", { locale: el })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8" data-testid="text-no-activity">
                        {t("No activity found")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
