import { useForm, SubmitHandler } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, Navigate, redirect } from "react-router-dom"
import { SignInRequest, AuthenticationResponse } from '@activepieces/shared'
import { useMutation } from '@tanstack/react-query'
import { useState } from "react"
import { HttpStatusCode } from "axios"
import { authenticationSession } from "../../../features/authentication/lib/authentication-session"
import { authenticationApi } from "../../../features/authentication/lib/authentication-api"
import { HttpError, api } from "@/lib/api"

export function SignInForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignInRequest>()

  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const mutation = useMutation<AuthenticationResponse, HttpError, SignInRequest>({
    mutationFn: authenticationApi.signIn,
    onSuccess: (data) => {
      authenticationSession.saveResponse(data);
      return redirect('/flows');
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Unauthorized:
            setErrorMessage('Invalid email or password');
            break;
          default:
            setErrorMessage('Something went wrong, please try again later');
            break;
        }
        return;
      }
    },
  });

  if (mutation.isSuccess) {
    return <Navigate to="/flows" />;
  }

  const onSubmit: SubmitHandler<SignInRequest> = data => {
    setErrorMessage(undefined);
    mutation.mutate(data);
  }

  return (
    <>
      <Card className="mx-auto max-w-sm mt-[200px]">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your email below to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid g4">
            <div className="grid g2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="gilfoyle@piedpiper.com"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <span className="text-red-500">{errors.email.message}</span>}
            </div>
            <div className="grid g2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link to='/forget-password' className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <span className="text-red-500">{errors.password.message}</span>}
              {errorMessage && <span className="text-red-500">{errorMessage}</span>}
            </div>
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              Sign in
            </Button>
            <Button variant="outline" className="w-full">
              Sign in with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </>

  )
}