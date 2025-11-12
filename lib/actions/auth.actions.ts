'use server';

import { auth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';
import { headers } from 'next/headers';

export async function signUpWithEmail(data: SignUpFormData) {
  const {
    fullName,
    email,
    password,
    country,
    investmentGoals,
    riskTolerance,
    preferredIndustry,
  } = data;
  try {
    const response = await auth.api.signUpEmail({
      body: {
        email: email,
        password: password,
        name: fullName,
      },
    });

    if (response) {
      await inngest.send({
        name: 'app/user.created',
        data: {
          email: email,
          name: fullName,
          country: country,
          investmentGoals: investmentGoals,
          riskTolerance: riskTolerance,
          preferredIndustry: preferredIndustry,
        },
      });
    }

    console.log(data);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error during sign-up:', error);
    return {
      success: false,
      error: 'An error occurred during sign-up.',
    };
  }
}

export async function signInWithEmail(data: SignInFormData) {
  const { email, password } = data;
  try {
    const response = await auth.api.signInEmail({
      body: {
        email: email,
        password: password,
      },
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error during sign-in:', error);
    return {
      success: false,
      error: 'An error occurred during signing in.',
    };
  }
}

export async function signOut() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    return { success: true };
  } catch (error) {
    console.log('Sign out failed', error);
    return { success: false, error: 'Sign out failed' };
  }
}
