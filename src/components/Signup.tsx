"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/schemas";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useModal } from "@/context/ModalContext";
import { Year } from "@prisma/client";

export function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, closeModal } = useModal();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      college: "Silicon Institute of Technology, Sambalpur",
      phone: "",
      imageUrl: "",
      eventParticipation: 0,
      year: Year.FIRST_YEAR, // Add this default value
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("A user with this email already exists");
        } else if (response.status === 400 && result.details) {
          // Show validation errors
          result.details.forEach((err: { field: string; message: string }) => {
            toast.error(`${err.field}: ${err.message}`);
          });
        } else {
          toast.error(result.error || "Something went wrong");
        }
        setIsLoading(false);
        return;
      }

      toast.success("Signup successful! Welcome aboard!");
      if (isOpen) {
        closeModal();
      }
      // Get redirection URL from response or use default
      const redirectUrl = result.redirect || "/dashboard/home";
      console.log(`Redirecting to: ${redirectUrl}`);

      // Allow a moment for cookies to be set
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full h-[80dvh] md:h-auto mx-auto rounded-2xl p-8 shadow-input bg-black overflow-y-auto relative">
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-label="Close modal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <h2 className="font-bold text-xl text-neutral-200">
        Welcome to Techstacy
      </h2>
      <p className="text-sm max-w-sm mt-2 text-neutral-300">
        Create your account to get started
      </p>

      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer>
            <Label htmlFor="firstName">First name</Label>
            <Input
              {...register("firstName")}
              id="firstName"
              placeholder="Tyler"
              type="text"
            />
            {errors.firstName && (
              <span className="text-red-500 text-sm">
                {errors.firstName.message}
              </span>
            )}
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastName">Last name</Label>
            <Input
              {...register("lastName")}
              id="lastName"
              placeholder="Durden"
              type="text"
            />
            {errors.lastName && (
              <span className="text-red-500 text-sm">
                {errors.lastName.message}
              </span>
            )}
          </LabelInputContainer>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer>
            <Label htmlFor="year">year</Label>
            <select
              {...register("year")}
              id="year"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={Year.FIRST_YEAR}>1st year</option>
              <option value={Year.SECOND_YEAR}>2nd year</option>
              <option value={Year.THIRD_YEAR}>3rd year</option>
              <option value={Year.FOURTH_YEAR}>4th year</option>
            </select>
            {errors.year && (
              <span className="text-red-500 text-sm">
                {errors.year.message}
              </span>
            )}
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="sic">SIC</Label>
            <Input
              {...register("sic")}
              id="sic"
              placeholder="Durden"
              type="text"
            />
            {errors.sic && (
              <span className="text-red-500 text-sm">{errors.sic.message}</span>
            )}
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            {...register("email")}
            id="email"
            placeholder="projectmayhem@fc.com"
            type="email"
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            {...register("password")}
            id="password"
            placeholder="••••••••"
            type="password"
          />
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password.message}
            </span>
          )}
        </LabelInputContainer>
        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirmPassword">Retype Password</Label>
          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            placeholder="••••••••"
            type="password"
          />
          {errors.confirmPassword && (
            <span className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </span>
          )}
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            {...register("phone")}
            id="phone"
            placeholder="Your phone number"
            type="tel"
          />
          {errors.phone && (
            <span className="text-red-500 text-sm">{errors.phone.message}</span>
          )}
        </LabelInputContainer>

        <button
          className="bg-gradient-to-br relative group/btn from-zinc-900 to-zinc-900 block bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing up..." : "Sign up"} &rarr;
          <BottomGradient />
        </button>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
