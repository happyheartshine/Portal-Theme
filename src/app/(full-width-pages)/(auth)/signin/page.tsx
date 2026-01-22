import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin Page Portal Dashboard",
  description: "Signin Page Portal Dashboard",
};

export default function SignIn() {
  return <SignInForm />;
}
