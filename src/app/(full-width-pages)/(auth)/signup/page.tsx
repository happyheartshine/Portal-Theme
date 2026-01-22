import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignUp Page Portal Dashboard",
  description: "SignUp Page Portal Dashboard",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
