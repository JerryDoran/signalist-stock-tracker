'use server';

import { auth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';

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
