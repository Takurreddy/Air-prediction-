import {
  SignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";

export default function Auth() {
  return (
    <div className="dashboard dashboard-page auth-container">
      <SignedOut>
        <SignIn
          appearance={{ elements: { rootBox: "auth-card", card: "auth-card-inner" } }}
          routing="hash"
        />
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
