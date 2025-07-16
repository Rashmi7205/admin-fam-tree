import { FC, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Types
interface FamilyTree {
  _id: string;
  name: string;
}
interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
  profileImageUrl?: string;
  treeId: {
    _id: string;
    name: string;
  };
  parents?: { _id: string; name: string }[];
  children?: { _id: string; name: string }[];
  spouse?: { _id: string; name: string };
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
  allMembers: Member[];
  trees: FamilyTree[];
  loading?: boolean;
}

export const AddMemberModal: FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allMembers,
  trees,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    deathDate: "",
    bio: "",
    familyTreeId: "",
  });
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [spouseId, setSpouseId] = useState<string>("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [parentSearch, setParentSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        gender: "",
        birthDate: "",
        deathDate: "",
        bio: "",
        familyTreeId: "",
      });
      setParentIds([]);
      setChildIds([]);
      setSpouseId("");
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setParentSearch("");
      setChildSearch("");
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImageFile(null);
      setProfileImagePreview(null);
    }
  };

  const handleSelectChange = (field: "parents" | "children", value: string) => {
    if (
      value &&
      !(field === "parents" ? parentIds : childIds).includes(value)
    ) {
      if (field === "parents") setParentIds((prev) => [...prev, value]);
      else setChildIds((prev) => [...prev, value]);
    }
  };

  const handleBadgeRemove = (field: "parents" | "children", value: string) => {
    if (field === "parents")
      setParentIds((prev) => prev.filter((id) => id !== value));
    else setChildIds((prev) => prev.filter((id) => id !== value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    parentIds.forEach((id) => data.append("parents", id));
    childIds.forEach((id) => data.append("children", id));
    if (spouseId) data.append("spouseId", spouseId);
    if (profileImageFile) data.append("profileImage", profileImageFile);
    onSubmit(data);
  };

  // Filter members by selected tree
  const membersInTree = allMembers.filter(
    (m) => m.treeId._id === formData.familyTreeId
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="max-w-lg w-full sm:max-w-xl p-0 flex flex-col h-full"
      >
        <SheetHeader className="p-4 sm:p-6 pb-0">
          <SheetTitle>Add Family Member</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="familyTreeId">Family Tree</Label>
              <Select
                value={formData.familyTreeId}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, familyTreeId: val }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select family tree" />
                </SelectTrigger>
                <SelectContent>
                  {trees.map((tree) => (
                    <SelectItem key={tree._id} value={tree._id}>
                      {tree.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthDate: e.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="deathDate">Death Date</Label>
              <Input
                id="deathDate"
                type="date"
                value={formData.deathDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deathDate: e.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="profileImage">Profile Image</Label>
            <Input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
              disabled={loading}
            />
            {profileImagePreview && (
              <img
                src={profileImagePreview}
                alt="Preview"
                className="h-20 w-20 rounded-full mt-2 object-cover border-2 border-purple-400"
              />
            )}
          </div>

          {/* Show relationship selectors only if tree is selected */}
          {formData.familyTreeId && (
            <>
              <div>
                <Label>Parents</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      type="button"
                    >
                      {parentIds.length > 0
                        ? `${parentIds.length} selected`
                        : "Select parent(s)"}
                      <svg
                        className="ml-2 h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <div className="p-2">
                      <Input
                        placeholder="Search members..."
                        onChange={(e) => setParentSearch(e.target.value)}
                        value={parentSearch}
                        className="mb-2"
                        disabled={loading}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {membersInTree
                          .filter(
                            (m) =>
                              (!parentSearch ||
                                `${m.firstName} ${m.lastName}`
                                  .toLowerCase()
                                  .includes(parentSearch.toLowerCase())) &&
                              !childIds.includes(m._id)
                          )
                          .map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!parentIds.includes(m._id))
                                  setParentIds((prev) => [...prev, m._id]);
                                else
                                  setParentIds((prev) =>
                                    prev.filter((id) => id !== m._id)
                                  );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={parentIds.includes(m._id)}
                                readOnly
                                className="accent-purple-600"
                              />
                              <span>
                                {m.firstName} {m.lastName}
                              </span>
                            </div>
                          ))}
                        {membersInTree.length === 0 && (
                          <div className="text-muted-foreground px-2 py-1">
                            No members found
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1 mt-2">
                  {parentIds.map((pId) => {
                    const parent = membersInTree.find((m) => m._id === pId);
                    return parent ? (
                      <Badge
                        key={pId}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleBadgeRemove("parents", pId)}
                      >
                        {parent.firstName} {parent.lastName} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <Label>Children</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      type="button"
                    >
                      {childIds.length > 0
                        ? `${childIds.length} selected`
                        : "Select child(ren)"}
                      <svg
                        className="ml-2 h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <div className="p-2">
                      <Input
                        placeholder="Search members..."
                        onChange={(e) => setChildSearch(e.target.value)}
                        value={childSearch}
                        className="mb-2"
                        disabled={loading}
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {membersInTree
                          .filter(
                            (m) =>
                              (!childSearch ||
                                `${m.firstName} ${m.lastName}`
                                  .toLowerCase()
                                  .includes(childSearch.toLowerCase())) &&
                              !parentIds.includes(m._id)
                          )
                          .map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!childIds.includes(m._id))
                                  setChildIds((prev) => [...prev, m._id]);
                                else
                                  setChildIds((prev) =>
                                    prev.filter((id) => id !== m._id)
                                  );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={childIds.includes(m._id)}
                                readOnly
                                className="accent-purple-600"
                              />
                              <span>
                                {m.firstName} {m.lastName}
                              </span>
                            </div>
                          ))}
                        {membersInTree.length === 0 && (
                          <div className="text-muted-foreground px-2 py-1">
                            No members found
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1 mt-2">
                  {childIds.map((cId) => {
                    const child = membersInTree.find((m) => m._id === cId);
                    return child ? (
                      <Badge
                        key={cId}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleBadgeRemove("children", cId)}
                      >
                        {child.firstName} {child.lastName} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <Label>Spouse</Label>
                <Select
                  value={spouseId === "" ? "none" : spouseId}
                  onValueChange={(val) =>
                    setSpouseId(val === "none" ? "" : val)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select spouse (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {membersInTree
                      .filter((m) => m._id && m._id !== "")
                      .map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.firstName} {m.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="p-4 border-t bg-white sticky bottom-0 left-0 w-full flex flex-col gap-2 z-10">
            <Button type="submit" disabled={loading} className="w-full">
              Add Member
            </Button>
            <SheetClose asChild>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
