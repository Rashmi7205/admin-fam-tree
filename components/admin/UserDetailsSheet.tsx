import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FamilyTree {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  members: Member[];
}

interface Member {
  _id: string;
  name: string;
  gender?: "male" | "female" | "other";
  birthDate?: string;
  deathDate?: string;
  image?: string;
  createdAt: string;
}

interface UserDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  trees: FamilyTree[];
  members: Member[];
}

export default function UserDetailsSheet({
  open,
  onOpenChange,
  user,
  trees,
  members,
}: UserDetailsSheetProps) {
  const isMobile = useIsMobile();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "moderator":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[90vh] p-0" : "w-[900px] p-6"}
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>User Details</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                  <AvatarFallback>
                    {user?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{user?.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getRoleBadgeColor(user?.role)}>
                    {user?.role || "user"}
                  </Badge>
                  {user?.emailVerified && (
                    <Badge variant="secondary">Verified</Badge>
                  )}
                  {user?.isActive && <Badge variant="default">Active</Badge>}
                </div>
              </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="trees">Family Trees</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Provider</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.provider}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.phoneNumber || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created At</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(user?.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(user?.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {user?.profile && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.profile.title && (
                          <div>
                            <p className="text-sm font-medium">Title</p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.title}
                            </p>
                          </div>
                        )}
                        {user.profile.gender && (
                          <div>
                            <p className="text-sm font-medium">Gender</p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.gender}
                            </p>
                          </div>
                        )}
                        {user.profile.dateOfBirth && (
                          <div>
                            <p className="text-sm font-medium">Date of Birth</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(user.profile.dateOfBirth)}
                            </p>
                          </div>
                        )}
                        {user.profile.bloodGroup && (
                          <div>
                            <p className="text-sm font-medium">Blood Group</p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.bloodGroup}
                            </p>
                          </div>
                        )}
                        {user.profile.education && (
                          <div>
                            <p className="text-sm font-medium">Education</p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.education}
                            </p>
                          </div>
                        )}
                        {user.profile.occupation && (
                          <div>
                            <p className="text-sm font-medium">Occupation</p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.occupation}
                            </p>
                          </div>
                        )}
                        {user.profile.maritalStatus && (
                          <div>
                            <p className="text-sm font-medium">
                              Marital Status
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.profile.maritalStatus}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user?.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.address.street && (
                          <div>
                            <p className="text-sm font-medium">Street</p>
                            <p className="text-sm text-muted-foreground">
                              {user.address.street}
                            </p>
                          </div>
                        )}
                        {user.address.city && (
                          <div>
                            <p className="text-sm font-medium">City</p>
                            <p className="text-sm text-muted-foreground">
                              {user.address.city}
                            </p>
                          </div>
                        )}
                        {user.address.state && (
                          <div>
                            <p className="text-sm font-medium">State</p>
                            <p className="text-sm text-muted-foreground">
                              {user.address.state}
                            </p>
                          </div>
                        )}
                        {user.address.country && (
                          <div>
                            <p className="text-sm font-medium">Country</p>
                            <p className="text-sm text-muted-foreground">
                              {user.address.country}
                            </p>
                          </div>
                        )}
                        {user.address.postalCode && (
                          <div>
                            <p className="text-sm font-medium">Postal Code</p>
                            <p className="text-sm text-muted-foreground">
                              {user.address.postalCode}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trees" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Family Trees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No family trees found
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {trees.map((tree) => (
                          <Card key={tree._id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{tree.name}</h4>
                                  {tree.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {tree.description}
                                    </p>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    <Badge
                                      variant={
                                        tree.isPublic ? "default" : "secondary"
                                      }
                                    >
                                      {tree.isPublic ? "Public" : "Private"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {tree.members?.length ?? 0} Members
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Created {formatDate(tree.createdAt)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
