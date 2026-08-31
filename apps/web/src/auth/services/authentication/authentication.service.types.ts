export interface OnboardUserPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface OnboardUserResponse {
  message: string;
}

export interface OnboardingRequiredResponse {
  onboardingRequired: boolean;
}
