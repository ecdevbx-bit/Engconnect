import Profile from "@/components/Profile";

// The Profile component owns its PageHeader so it can wire the "Edit profile"
// action button to its own dialog state.
export default function ProfilePage() {
  return <Profile />;
}
