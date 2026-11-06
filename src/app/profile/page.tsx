"use client";

import React, { useEffect, useState } from "react";
import {
  fetchUserProfileAction,
  fetchUserEmailAction,
  updateUserProfileAction,
  fetchDormsAction,
  fetchUserDormAction,
  updateUserDormAction,
} from "@/app/actions/profile";
import {
  deleteAccountAction,
  updateEmailAction,
  updatePasswordAction,
} from "@/app/actions/auth";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/ui/spinner";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Eye, EyeOff } from "lucide-react";
import { fetchUserProviderTypeAction } from "../actions/profile/fetch-user-provider-type";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
}

interface Dorm {
  id: string;
  short_name: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [dormId, setDormId] = useState<string>("");
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [hasPassword, setHasPassword] = useState<boolean>(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchUserProfileAction();
        const userEmail = await fetchUserEmailAction();
        const userProviderType = await fetchUserProviderTypeAction();
        const dormsList = await fetchDormsAction();
        const userDormId = await fetchUserDormAction();

        // Combine profile data with email
        const profileWithEmail = {
          ...profile,
          email: userEmail ?? "",
        };
        setUserProfile(profileWithEmail);
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setDormId(userDormId ? String(userDormId) : "");
        setDorms(dormsList);
        setEmail(userEmail ?? "");
        setHasPassword(userProviderType === "email");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user profile.",
        });
      }
    };

    fetchProfile();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Update user profile info
      const updatedProfile = await updateUserProfileAction(firstName, lastName);
      setUserProfile(updatedProfile);

      // Update dorm mapping
      try {
        await updateUserDormAction(dormId || null);
        // Update the original dorm ID to the new value after successful save
      } catch (dormError) {
        console.error("Error updating dorm:", dormError);
        toast({
          title: "Error",
          description: "Failed to update dorm. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If email is modified, update it using Supabase Auth
      if (userProfile && email !== userProfile.email) {
        try {
          await updateEmailAction(email);
          // Update the email in userProfile state after successful update
          setUserProfile((prev) => (prev ? { ...prev, email } : null));
        } catch (emailError) {
          console.error("Error updating email:", emailError);
          toast({
            title: "Error",
            description: "Failed to update email. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // If password is modified, update it using Supabase Auth
      if (password && hasPassword) {
        try {
          await updatePasswordAction(password);
          // Clear the password field after successful update
          setPassword("");
        } catch (passwordError) {
          console.error("Error updating password:", passwordError);
          toast({
            title: "Error",
            description: "Failed to update password. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Profile Updated!",
        description:
          "Your profile has been updated successfully. Your changes are now live.",
      });
      setEditing(false); // Exit editing mode after saving
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountAction();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        variant: "destructive",
      });
      // Redirect to account deleted page
      window.location.href = "/account-deleted";
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unknown error occurred.";
      toast({
        title: "Error",
        description: (
          <div className="space-y-1">
            <p>Failed to delete your account. Please try again.</p>
            {errorMessage && (
              <p className="text-xs text-muted-foreground break-words">
                Details: {errorMessage}
              </p>
            )}
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading || userProfile === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="w-full pb-8 px-4 md:px-0">
      <div className="max-w-full mx-auto">
        <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">
          {editing ? "Edit Profile" : "Your Profile"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-2 flex-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onFocus={() => setEditing(true)}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onFocus={() => setEditing(true)}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onFocus={() => setEditing(true)}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dorm">Dorm</Label>
            <Select
              value={dormId || ""}
              onValueChange={(value) => {
                setDormId(value);
                setEditing(true);
              }}
            >
              <SelectTrigger id="dorm">
                <SelectValue placeholder="Select your dorm" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" 
              className="max-h-[200px] overflow-y-auto">
                {dorms.map((dorm) => (
                  <SelectItem key={dorm.id} value={String(dorm.id)}>
                    {dorm.short_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasPassword && <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setEditing(true)} 
                placeholder={editing ? "Enter new password" : "••••••••"}
              />
              {editing && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500
                             hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {editing && (
              <div className="text-sm text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </div>
            )}
          </div>}

          <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <>
                <SubmitButton
                  disabled={loading}
                  pendingText="Saving..."
                  className="w-full"
                >
                  Save
                </SubmitButton>
              </>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-6">
            <div className="flex items-center md:items-start gap-2 md:gap-4 p-2 md:p-6 
              rounded-lg border border-primary/30
                            bg-background/50 dark:bg-background/50">
              <div className="flex flex-col items-center md:w-1/3 shrink-0">
                <h2 className="text-sm md:text-lg font-semibold text-primary 
                dark:text-primary whitespace-nowrap">
                  DANGER ZONE
                </h2>
                <img
                  src="/danger-zone-transparent.png"
                  alt="Danger Zone"
                  className="mt-1 h-12 md:h-20 w-auto md:mt-2"
                />
              </div>
              <div className="flex-1 md:w-2/3 flex flex-col items-end md:items-start 
                justify-center min-w-0">
                <p className="text-[10px] md:text-sm text-black dark:text-white mb-1.5 md:mb-6 
                  leading-4 md:leading-6 text-right md:text-left">
                  Once you delete your account, there is no going back. This action is permanent.
                </p>
                <div className="md:mt-4">
                  <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 dark:bg-red-500
                                   dark:hover:bg-red-600 text-white h-6 md:h-auto px-4 md:px-4 
                                    text-[10px] md:text-base min-w-[120px] md:min-w-0 
                                    rounded-full"
                      >
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-gray-100 mb-2">
                          Delete Account
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-white/75 leading-6">
                          Are you absolutely sure you want to delete your
                          account? This action cannot be undone and all your
                          data will be permanently deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                          disabled={isDeleting}
                          className="text-gray-600 dark:text-gray-300 hover:bg-gray-100
                                     dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="bg-red-500 hover:bg-red-600 dark:bg-red-500
                                     dark:hover:bg-red-600 text-white"
                        >
                          {isDeleting ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Account"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
