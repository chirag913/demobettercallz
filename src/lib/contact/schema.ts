import { z } from "zod";

export const interests = ["Instant Lead Calling", "Lead Recovery", "Both", "Custom AI Sales Agent"] as const;
export const leadVolumes = ["Under 100", "100–500", "501–2,000", "2,001–10,000", "10,000+", "Not sure yet"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid work email.").max(254),
  phone: z.string().trim().max(30).refine((value) => /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15, "Enter a valid phone number, including country code."),
  company: z.string().trim().min(1, "Enter your company name.").max(160),
  website: z.string().trim().max(300).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") && !url.username && !url.password;
    } catch { return false; }
  }, "Enter a valid website, such as company.com."),
  leadVolume: z.enum(leadVolumes, { error: "Choose an approximate lead volume." }),
  interest: z.enum(interests, { error: "Choose what you’re interested in." }),
  message: z.string().trim().min(1, "Tell us a little about your leads.").max(3000, "Keep your message under 3,000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
