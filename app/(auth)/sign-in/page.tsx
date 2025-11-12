'use client';

import FooterLink from '@/components/forms/footer-link';
import InputField from '@/components/forms/input-field';
import { Button } from '@/components/ui/button';
import { signInWithEmail } from '@/lib/actions/auth.actions';
import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  async function onSubmit(data: SignInFormData) {
    try {
      const result = await signInWithEmail(data);
      if (result.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      toast.error('Sign in failed', {
        description:
          error instanceof Error ? error.message : 'Something went wrong',
      });
    }
  }

  return (
    <>
      <h1 className='form-title'>Welcome Back</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <InputField
          name='email'
          label='Email'
          type='email'
          placeholder='john.doe@example.com'
          register={register}
          error={errors.email}
          validation={{
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Email must be a valid email address',
            },
          }}
        />
        <InputField
          name='password'
          label='Password'
          placeholder='••••••••'
          type='password'
          register={register}
          error={errors.password}
          validation={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
        />

        <Button
          type='submit'
          disabled={isSubmitting}
          className='yellow-btn w-full mt-5'
        >
          {isSubmitting ? 'Signing In...' : 'Login'}
        </Button>
        <FooterLink
          text="Don't have an account?"
          linkText='Sign Up'
          href='/sign-up'
        />
      </form>
    </>
  );
}
